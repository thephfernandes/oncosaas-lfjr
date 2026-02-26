# Guardrails - Resumo Executivo

## ⚠️ Dois Guardrails Obrigatórios

### Guardrail 1: Fontes Confiáveis

**Arquivo:** `.cursor/rules/guardrail-fontes-web.md`

**Regra Principal:**

- ✅ SEMPRE usar apenas domínios da whitelist
- ✅ SEMPRE incluir `site:[domínio]` nas queries
- ❌ NUNCA buscar sem domínio especificado
- ❌ NUNCA usar Wikipedia, blogs, redes sociais

### Guardrail 2: Versão e Data das Fontes

**Arquivo:** `.cursor/rules/guardrail-versao-fontes.md`

**Regra Principal:**

- ✅ SEMPRE incluir ano/edição em TODAS as citações
- ✅ Priorizar fontes <2 anos para tratamentos/protocolos
- ✅ Informar ano mesmo de fontes antigas (para informações atemporais)
- ✅ Incluir seção "Fontes e Versões" em seções principais

## Formato de Citação Obrigatório

### Diretrizes/Guidelines

```
[Nome da Diretriz] - [Organização] ([ano]) ([site.com])
```

**Exemplo:** Diretriz Brasileira de Hipertensão Arterial - SBC (2024) (diretrizes.cardiol.br)

### Livros

```
[Nome do Livro] ([edição]ª edição, [ano])
```

**Exemplo:** Harrison Medicina Interna (20ª edição, 2020)

### Protocolos Governamentais

```
[Protocolo] - [Órgão] ([ano]) ([site.com])
```

**Exemplo:** Vigitel Brasil - Ministério da Saúde (2024) (saude.gov.br)

## Priorização Temporal

| Tipo de Informação     | Prioridade | Exemplos                                 |
| ---------------------- | ---------- | ---------------------------------------- |
| Tratamentos/Protocolos | <2 anos    | Diretrizes SBC 2024, Guidelines AHA 2023 |
| Epidemiologia          | <3 anos    | Vigitel 2024, CDC 2024                   |
| Critérios Diagnósticos | <5 anos    | Escalas, scores atualizados              |
| Fisiopatologia         | Atemporal  | Harrison 2020 (conceitos válidos)        |

## Seção Obrigatória

Ao final de cada seção principal, incluir:

```markdown
**Fontes e Versões:**

- **Protocolo atual:** [Nome] - [Org] ([ano]) ([site])
- **Base teórica:** [Livro] ([edição], [ano])
- **Última atualização consultada:** [ano]
```

## Checklist Rápido

Antes de finalizar qualquer resposta:

- [ ] Todas as fontes têm ano/edição explícito?
- [ ] Fontes temporais são dos últimos 2-3 anos?
- [ ] Seção "Fontes e Versões" presente?
- [ ] Domínios usados estão na whitelist?
- [ ] Queries têm `site:[domínio]`?

---

**Consultar arquivos completos:**

- `.cursor/rules/guardrail-fontes-web.md` (detalhes completos)
- `.cursor/rules/guardrail-versao-fontes.md` (detalhes completos)
