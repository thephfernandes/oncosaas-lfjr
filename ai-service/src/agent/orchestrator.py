"""
Agent Orchestrator.
Main processing pipeline for the oncology navigation agent.
Receives message + context → returns response + actions.
"""

from typing import Dict, List, Optional, Any
import logging

from .llm_provider import llm_provider
from .context_builder import context_builder
from .symptom_analyzer import symptom_analyzer
from .prompts.system_prompt import build_system_prompt

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orquestrador principal do agente de navegação oncológica.
    Recebe mensagem + contexto → retorna resposta + ações.
    """

    async def process(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing pipeline.

        Args:
            request: Dict containing:
                - message: Patient message
                - patient_id: Patient UUID
                - tenant_id: Tenant UUID
                - clinical_context: Full clinical data
                - protocol: Active clinical protocol
                - conversation_history: Recent messages
                - agent_state: Persistent state
                - agent_config: Tenant LLM config

        Returns:
            Dict with response, actions, symptom_analysis, new_state, decisions
        """
        message = request.get("message", "")
        clinical_context = request.get("clinical_context", {})
        protocol = request.get("protocol")
        conversation_history = request.get("conversation_history", [])
        agent_state = request.get("agent_state", {})
        agent_config = request.get("agent_config") or {}

        # 1. Check if we're in a questionnaire flow
        if agent_state.get("active_questionnaire"):
            return await self._process_questionnaire_answer(request)

        # 2. Analyze symptoms (keyword-based, fast)
        cancer_type = clinical_context.get("patient", {}).get("cancerType")
        symptom_analysis = await symptom_analyzer.analyze(
            message=message,
            clinical_context=clinical_context,
            cancer_type=cancer_type,
            use_llm=False,  # Keyword-only for speed; LLM analysis can be enabled
            llm_config=agent_config,
        )

        # 3. Build clinical context for the prompt (RAG)
        rag_context = context_builder.build(
            clinical_context=clinical_context,
            protocol=protocol,
            symptom_analysis=symptom_analysis,
            conversation_history=conversation_history,
        )

        # 4. Build protocol context string
        protocol_context = None
        if protocol:
            protocol_context = context_builder._format_protocol_context(protocol)

        # 5. Build system prompt
        language = agent_config.get("agent_language", "pt-BR")
        system_prompt = build_system_prompt(
            clinical_context=rag_context,
            protocol_context=protocol_context,
            language=language,
        )

        # 6. Generate response via LLM
        response_text = await llm_provider.generate(
            system_prompt=system_prompt,
            messages=conversation_history + [{"role": "user", "content": message}],
            config=agent_config,
        )

        # 7. Compile actions based on analysis
        actions, decisions = self._compile_actions(
            symptom_analysis=symptom_analysis,
            agent_state=agent_state,
            clinical_context=clinical_context,
        )

        # 8. Update agent state
        new_state = self._update_state(agent_state, symptom_analysis, message)

        return {
            "response": response_text,
            "actions": actions,
            "symptom_analysis": symptom_analysis,
            "new_state": new_state,
            "decisions": decisions,
        }

    async def _process_questionnaire_answer(
        self, request: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle a message that's part of an active questionnaire flow."""
        # For now, return a simple acknowledgment
        # Full questionnaire engine will be in Sprint 3
        agent_state = request.get("agent_state", {})
        questionnaire = agent_state.get("active_questionnaire", {})

        return {
            "response": (
                "Obrigado pela resposta! Vou registrar essa informação. "
                "Podemos continuar com o questionário?"
            ),
            "actions": [],
            "symptom_analysis": None,
            "new_state": agent_state,
            "decisions": [
                {
                    "decisionType": "QUESTIONNAIRE_SCORED",
                    "reasoning": f"Questionnaire answer recorded for {questionnaire.get('type', 'unknown')}",
                    "confidence": 0.7,
                    "inputData": {"message": request.get("message")},
                    "outputAction": {"type": "RECORD_SYMPTOM"},
                    "requiresApproval": False,
                }
            ],
        }

    def _compile_actions(
        self,
        symptom_analysis: Dict[str, Any],
        agent_state: Dict[str, Any],
        clinical_context: Dict[str, Any],
    ) -> tuple:
        """
        Compile actions and decisions based on analysis results.

        Returns:
            Tuple of (actions list, decisions list)
        """
        actions = []
        decisions = []

        detected = symptom_analysis.get("detectedSymptoms", [])
        overall_severity = symptom_analysis.get("overallSeverity", "LOW")
        requires_escalation = symptom_analysis.get("requiresEscalation", False)

        # Record detected symptoms
        for symptom in detected:
            actions.append({
                "type": "RECORD_SYMPTOM",
                "payload": {
                    "code": f"symptom_{symptom['name']}",
                    "display": symptom["name"],
                    "value": symptom.get("severity"),
                },
                "requiresApproval": False,
            })

            decisions.append({
                "decisionType": "SYMPTOM_DETECTED",
                "reasoning": (
                    f"Detected symptom '{symptom['name']}' with "
                    f"severity {symptom.get('severity', 'UNKNOWN')} "
                    f"(confidence: {symptom.get('confidence', 0):.0%})"
                ),
                "confidence": symptom.get("confidence", 0.85),
                "inputData": {"symptom": symptom},
                "outputAction": {
                    "type": "RECORD_SYMPTOM",
                    "payload": {
                        "code": f"symptom_{symptom['name']}",
                        "display": symptom["name"],
                        "value": symptom.get("severity"),
                    },
                },
                "requiresApproval": False,
            })

        # Create alerts for significant symptoms
        if overall_severity in ("HIGH", "CRITICAL"):
            alert_severity = overall_severity
            alert_type = "CRITICAL_SYMPTOM" if alert_severity == "CRITICAL" else "SYMPTOM_WORSENING"

            symptom_names = [s["name"] for s in detected]
            alert_message = (
                f"Sintomas detectados pelo agente: {', '.join(symptom_names)} "
                f"(severidade: {alert_severity})"
            )

            if requires_escalation:
                # Critical alert - auto-approved but logged
                actions.append({
                    "type": "CREATE_LOW_ALERT" if alert_severity == "HIGH" else "CREATE_HIGH_CRITICAL_ALERT",
                    "payload": {
                        "type": alert_type,
                        "severity": alert_severity,
                        "message": alert_message,
                    },
                    "requiresApproval": alert_severity == "CRITICAL",
                })

                decisions.append({
                    "decisionType": "CRITICAL_ESCALATION" if requires_escalation else "ALERT_CREATED",
                    "reasoning": symptom_analysis.get("escalationReason", alert_message),
                    "confidence": 0.9,
                    "inputData": {"symptoms": detected, "severity": alert_severity},
                    "outputAction": {
                        "type": "CREATE_HIGH_CRITICAL_ALERT",
                        "payload": {
                            "type": alert_type,
                            "severity": alert_severity,
                            "message": alert_message,
                        },
                    },
                    "requiresApproval": True,
                })
            else:
                actions.append({
                    "type": "CREATE_LOW_ALERT",
                    "payload": {
                        "type": alert_type,
                        "severity": alert_severity,
                        "message": alert_message,
                    },
                    "requiresApproval": False,
                })

                decisions.append({
                    "decisionType": "ALERT_CREATED",
                    "reasoning": alert_message,
                    "confidence": 0.85,
                    "inputData": {"symptoms": detected},
                    "outputAction": {
                        "type": "CREATE_LOW_ALERT",
                        "payload": {
                            "type": alert_type,
                            "severity": alert_severity,
                            "message": alert_message,
                        },
                    },
                    "requiresApproval": False,
                })

        # Always log the response generation
        decisions.append({
            "decisionType": "RESPONSE_GENERATED",
            "reasoning": "Agent generated response to patient message",
            "confidence": 0.95,
            "inputData": {},
            "outputAction": {"type": "RESPOND_TO_QUESTION"},
            "requiresApproval": False,
        })

        return actions, decisions

    def _update_state(
        self,
        current_state: Dict[str, Any],
        symptom_analysis: Dict[str, Any],
        message: str,
    ) -> Dict[str, Any]:
        """Update agent state with new information."""
        new_state = dict(current_state)

        # Track message count
        new_state["message_count"] = new_state.get("message_count", 0) + 1

        # Store latest symptom analysis summary
        detected = symptom_analysis.get("detectedSymptoms", [])
        if detected:
            new_state["last_symptoms"] = [
                {"name": s["name"], "severity": s.get("severity")}
                for s in detected
            ]
            new_state["last_symptom_severity"] = symptom_analysis.get(
                "overallSeverity", "LOW"
            )

        # Store extracted scales
        structured = symptom_analysis.get("structuredData", {})
        scales = structured.get("scales", {})
        if scales:
            existing_scales = new_state.get("tracked_scales", {})
            existing_scales.update(scales)
            new_state["tracked_scales"] = existing_scales

        return new_state


# Global instance
orchestrator = AgentOrchestrator()
