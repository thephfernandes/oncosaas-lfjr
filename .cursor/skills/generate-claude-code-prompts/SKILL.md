---
name: generate-claude-code-prompts
description: Generates structured prompts for Claude Code to execute specific tasks. Use when the user requests a prompt for Claude Code, needs to create instructions for agent execution, or wants to formulate task descriptions for automation.
---

# Gerar Prompts para Claude Code

## Objetivo

Produzir prompts estruturados e executáveis que serão usados no Claude Code para realizar tarefas solicitadas. O prompt gerado deve ser autocontido, claro e orientado à ação.

## Template Obrigatório

Todo prompt gerado deve seguir esta estrutura:

```markdown
# Contexto

[1-2 frases descrevendo o cenário/projeto e onde a tarefa se encaixa]

# Tarefa

[Descrição concisa e específica do que deve ser feito. Use verbos de ação: criar, implementar, corrigir, refatorar, adicionar.]

# Requisitos

- [Requisito 1 - obrigatório]
- [Requisito 2 - obrigatório]
- [Restrições ou preferências técnicas]

# Formato Esperado

[O que o resultado deve conter: arquivos, estrutura, convenções, padrões a seguir]

# Não Fazer

- [Anti-padrão ou erro a evitar]
```

## Workflow de Geração

1. **Clarificar a tarefa**: Entender exatamente o que o usuário quer executar no Claude Code.
2. **Identificar contexto**: Tecnologias, estrutura do projeto, convenções existentes.
3. **Listar requisitos**: Obrigatórios primeiro, opcionais depois.
4. **Definir formato**: Estrutura esperada do output (código, arquivos, documentação).
5. **Excluir anti-padrões**: O que evitar para não gerar resultados indesejados.
6. **Montar o prompt**: Preencher o template e entregar pronto para copiar.

## Princípios de Prompts Eficazes

- **Específico > Genérico**: "Adicionar validação Zod ao formulário X em Y" em vez de "melhorar validação".
- **Uma tarefa por prompt**: Focar em um objetivo claro; dividir tarefas complexas em vários prompts.
- **Contexto mínimo necessário**: Incluir só o que Claude Code precisa para executar (paths, nomes de arquivos, stack).
- **Verbos de ação**: Usar criar, implementar, adicionar, corrigir, refatorar, remover.
- **Formato explícito**: Especificar se deve editar arquivo existente, criar novo, ou ambos.

## Tarefas Comuns e Suas Estruturas

| Tipo de Tarefa | Contexto Essencial | Requisitos Típicos |
|----------------|-------------------|-------------------|
| Implementar feature | Módulo/pasta, stack | Padrões do projeto, multi-tenancy |
| Corrigir bug | Arquivo, sintoma, comportamento esperado | Não quebrar X |
| Refatorar código | Escopo, objetivo | Manter testes, manter API |
| Criar endpoint | Rota, payload, autenticação | DTOs, validação, tenant |
| Adicionar componente | Localização, props | Acessibilidade, tailwind |

## Output para o Usuário

Entregar o prompt em bloco de código markdown, com título "Prompt para Claude Code" e instrução de uso:

```markdown
## Prompt para Claude Code

Copie o bloco abaixo e cole no Claude Code para executar a tarefa:

---
[Cole aqui o prompt gerado seguindo o template]
---
```

## Exemplos Rápidos

Para mais exemplos práticos por domínio (backend, frontend, refatoração), ver [examples.md](examples.md).
