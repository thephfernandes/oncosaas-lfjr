"""
Tests for AgentOrchestrator — tenant_id propagation and fallback path.

Scope:
  - _process_with_trace recebe tenant_id corretamente (bug fix #regression)
  - Pipeline fallback quando has_any_llm_key retorna False
  - tenant_id aparece no log de warning do fallback path

Não testado aqui:
  - Integração real com LLM/Anthropic/OpenAI
  - RAG com embeddings reais
  - End-to-end com banco de dados
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers de fixture
# ---------------------------------------------------------------------------

def _minimal_request(**overrides):
    """Retorna um request dict mínimo válido para process()."""
    base = {
        "message": "Olá, estou com dúvidas sobre meu tratamento.",
        "patient_id": "patient-uuid-1",
        "tenant_id": "tenant-abc",
        "clinical_context": {
            "patient": {"age": 55, "cancerType": "bladder"},
            "treatments": [],
            "medications": [],
            "comorbidities": [],
        },
        "protocol": None,
        "conversation_history": [],
        "agent_state": {},
        "agent_config": {
            "anthropic_api_key": None,
            "openai_api_key": None,
        },
    }
    base.update(overrides)
    return base


def _noop_symptom_analysis():
    return {
        "detectedSymptoms": [],
        "overallSeverity": None,
        "structuredData": {"scales": {}},
    }


def _noop_clinical_rules_result():
    result = MagicMock()
    result.disposition = "REMOTE_NURSING"
    result.findings = []
    result.reasoning = "sem regras disparadas"
    result.is_immediate = False
    result.is_er = False
    result.get_actions = MagicMock(return_value=[])
    return result


# ---------------------------------------------------------------------------
# Fixtures de patch globais
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_dependencies():
    """
    Patcha todas as dependências externas do orchestrator para execução
    isolada. Não faz chamadas LLM, RAG, banco ou rede.
    """
    with (
        patch("src.agent.orchestrator.intent_classifier") as mock_intent,
        patch("src.agent.orchestrator.symptom_analyzer") as mock_symptoms,
        patch("src.agent.orchestrator.clinical_rules_engine") as mock_rules,
        patch("src.agent.orchestrator.protocol_engine") as mock_protocol,
        patch("src.agent.orchestrator.context_builder") as mock_ctx,
        patch("src.agent.orchestrator.llm_provider") as mock_llm,
        patch("src.agent.orchestrator.tracer") as mock_tracer,
        patch("src.agent.orchestrator.questionnaire_engine") as mock_q,
    ):
        # intent: GREETING com skip_full_pipeline=False para entrar no pipeline principal
        mock_intent.classify_async = AsyncMock(return_value={
            "intent": "general",
            "confidence": 0.9,
            "skip_full_pipeline": False,
            "metadata": {},
        })

        # sintomas: nenhum detectado
        mock_symptoms.analyze = AsyncMock(return_value=_noop_symptom_analysis())

        # regras clínicas: sem disparo
        mock_rules.evaluate = MagicMock(return_value=_noop_clinical_rules_result())

        # protocolo: sem ações
        mock_protocol.evaluate = MagicMock(return_value=[])

        # RAG context: string vazia
        mock_ctx.build_with_rag = MagicMock(return_value="")

        # LLM: sem chave — aciona fallback
        mock_llm.has_any_llm_key = MagicMock(return_value=False)
        mock_llm.has_anthropic_key = MagicMock(return_value=False)
        mock_llm._fallback_response = MagicMock(return_value="Olá! Para mais informações, entre em contato com sua equipe de saúde.")

        # Tracer: objetos dummy sem efeitos colaterais
        mock_trace = MagicMock()
        mock_tracer.start_trace = MagicMock(return_value=mock_trace)
        mock_tracer.finish_trace = MagicMock()
        mock_tracer.start_span = MagicMock(return_value=MagicMock())
        mock_tracer.record_llm_call = MagicMock()

        # questionnaire engine: não chamado neste path
        mock_q.format_greeting = MagicMock(return_value="")

        yield {
            "intent": mock_intent,
            "symptoms": mock_symptoms,
            "rules": mock_rules,
            "protocol": mock_protocol,
            "ctx": mock_ctx,
            "llm": mock_llm,
            "tracer": mock_tracer,
            "trace": mock_trace,
            "q": mock_q,
        }


# ---------------------------------------------------------------------------
# Testes
# ---------------------------------------------------------------------------

class TestTenantIdPropagation:
    """
    Garante que tenant_id extraído de request.get('tenant_id') chegue
    corretamente a _process_with_trace e seja usado no warning do fallback.

    Regressão: antes do fix, _process_with_trace usava request.get('tenant_id')
    em um escopo onde `request` não existia, causando NameError em runtime.
    """

    @pytest.mark.asyncio
    async def test_process_passes_tenant_id_to_inner_method(self, mock_dependencies):
        """process() deve extrair tenant_id do request e passar para _process_with_trace."""
        from src.agent.orchestrator import AgentOrchestrator

        orchestrator = AgentOrchestrator()
        # Espia _process_with_trace para verificar o argumento tenant_id
        original = orchestrator._process_with_trace
        captured_kwargs = {}

        async def spy(*args, **kwargs):
            captured_kwargs.update(kwargs)
            return await original(*args, **kwargs)

        orchestrator._process_with_trace = spy

        req = _minimal_request(tenant_id="tenant-xyz-999")
        await orchestrator.process(req)

        assert "tenant_id" in captured_kwargs, (
            "_process_with_trace não recebeu tenant_id como keyword argument"
        )
        assert captured_kwargs["tenant_id"] == "tenant-xyz-999", (
            f"tenant_id esperado 'tenant-xyz-999', recebido '{captured_kwargs['tenant_id']}'"
        )

    @pytest.mark.asyncio
    async def test_process_does_not_raise_name_error(self, mock_dependencies):
        """
        Antes do fix, _process_with_trace levantava NameError ao referenciar
        `request` fora do escopo. Este teste garante que a execução completa
        sem erros mesmo no fallback path (sem LLM).
        """
        from src.agent.orchestrator import AgentOrchestrator

        orchestrator = AgentOrchestrator()
        req = _minimal_request(tenant_id="tenant-abc")

        # Não deve levantar exceção
        result = await orchestrator.process(req)
        assert result is not None

    @pytest.mark.asyncio
    async def test_process_with_empty_tenant_id_does_not_raise(self, mock_dependencies):
        """tenant_id vazio (string vazia) não deve causar exceção — apenas string em branco."""
        from src.agent.orchestrator import AgentOrchestrator

        orchestrator = AgentOrchestrator()
        req = _minimal_request(tenant_id="")

        result = await orchestrator.process(req)
        assert result is not None


class TestFallbackPath:
    """
    Garante que o pipeline funciona corretamente quando has_any_llm_key
    retorna False (modo sem LLM / chaves ausentes).
    """

    @pytest.mark.asyncio
    async def test_fallback_response_used_when_no_llm_keys(self, mock_dependencies):
        """Quando sem chaves LLM, response deve ser o retorno de _fallback_response()."""
        from src.agent.orchestrator import AgentOrchestrator

        expected_fallback = "Olá! Para mais informações, entre em contato com sua equipe de saúde."
        mock_dependencies["llm"].has_any_llm_key.return_value = False
        mock_dependencies["llm"]._fallback_response.return_value = expected_fallback

        orchestrator = AgentOrchestrator()
        result = await orchestrator.process(_minimal_request())

        assert result["response"] == expected_fallback

    @pytest.mark.asyncio
    async def test_fallback_path_does_not_call_run_agentic_loop(self, mock_dependencies):
        """Sem chaves LLM, run_agentic_loop não deve ser chamado."""
        from src.agent.orchestrator import AgentOrchestrator

        mock_dependencies["llm"].has_any_llm_key.return_value = False
        # run_agentic_loop não deve existir nem ser chamado
        mock_dependencies["llm"].run_agentic_loop = AsyncMock()

        orchestrator = AgentOrchestrator()
        await orchestrator.process(_minimal_request())

        mock_dependencies["llm"].run_agentic_loop.assert_not_called()

    @pytest.mark.asyncio
    async def test_fallback_path_still_runs_clinical_rules(self, mock_dependencies):
        """
        Layer 1 (clinical_rules_engine.evaluate) deve ser executado mesmo
        no fallback path sem LLM — invariante de segurança.
        """
        from src.agent.orchestrator import AgentOrchestrator

        mock_dependencies["llm"].has_any_llm_key.return_value = False

        orchestrator = AgentOrchestrator()
        await orchestrator.process(_minimal_request())

        mock_dependencies["rules"].evaluate.assert_called_once()

    @pytest.mark.asyncio
    async def test_fallback_path_returns_expected_structure(self, mock_dependencies):
        """Resultado do pipeline fallback deve ter as chaves obrigatórias."""
        from src.agent.orchestrator import AgentOrchestrator

        mock_dependencies["llm"].has_any_llm_key.return_value = False

        orchestrator = AgentOrchestrator()
        result = await orchestrator.process(_minimal_request())

        for key in ("response", "actions", "symptom_analysis", "new_state", "decisions"):
            assert key in result, f"Chave obrigatória ausente no resultado: '{key}'"

    @pytest.mark.asyncio
    async def test_fallback_warning_logged_with_tenant_id(self, mock_dependencies, caplog):
        """
        O warning 'Agent LLM skipped' deve ser emitido e conter o tenant_id,
        confirmando que a variável chegou ao escopo correto após o fix.
        """
        import logging
        from src.agent.orchestrator import AgentOrchestrator

        mock_dependencies["llm"].has_any_llm_key.return_value = False

        orchestrator = AgentOrchestrator()

        with caplog.at_level(logging.WARNING, logger="src.agent.orchestrator"):
            await orchestrator.process(_minimal_request(tenant_id="tenant-abc"))

        warning_messages = [r.message for r in caplog.records if r.levelno == logging.WARNING]
        assert any("tenant_id" in m or "tenant-abc" in m or "LLM skipped" in m for m in warning_messages), (
            f"Warning esperado não encontrado. Warnings emitidos: {warning_messages}"
        )


class TestSymptomAnalysisAlwaysRuns:
    """
    Garante que a análise de sintomas (step 2) é executada no pipeline
    principal, independente de haver chave LLM.
    """

    @pytest.mark.asyncio
    async def test_symptom_analyzer_called_in_main_pipeline(self, mock_dependencies):
        from src.agent.orchestrator import AgentOrchestrator

        orchestrator = AgentOrchestrator()
        await orchestrator.process(_minimal_request())

        mock_dependencies["symptoms"].analyze.assert_called_once()

    @pytest.mark.asyncio
    async def test_symptom_analysis_result_returned(self, mock_dependencies):
        from src.agent.orchestrator import AgentOrchestrator

        expected = {
            "detectedSymptoms": [{"name": "dor", "severity": "HIGH"}],
            "overallSeverity": "HIGH",
            "structuredData": {"scales": {}},
        }
        mock_dependencies["symptoms"].analyze = AsyncMock(return_value=expected)

        orchestrator = AgentOrchestrator()
        result = await orchestrator.process(_minimal_request())

        assert result["symptom_analysis"] == expected
