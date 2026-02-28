# Guardrail: Versão e Data das Fontes

## Propósito

Este guardrail garante que todas as informações médicas incluam a versão/edição/ano da fonte utilizada, priorizando fontes atualizadas e permitindo ao leitor avaliar a atualidade das informações.

## Regra Principal

**⚠️ REGRA OBRIGATÓRIA:**

- **SEMPRE** incluir ano/edição da fonte em TODAS as citações
- **PRIORIZAR** fontes dos últimos 2-3 anos para informações que mudam frequentemente
- **INFORMAR** explicitamente quando informações são de fontes antigas mas ainda válidas
- **DIFERENCIAR** entre informações atemporais (fisiopatologia) e informações temporais (tratamentos, guidelines)

## Estrutura de Citação Obrigatória

### Formato Padrão de Citação

**Para Diretrizes/Guidelines:**

```
[Nome da Diretriz] - [Organização] ([ano]) - ([site.com])
```

**Exemplos:**

- ✅ "Diretriz Brasileira de Hipertensão Arterial - SBC (2024) (diretrizes.cardiol.br)"
- ✅ "Heart Failure Guidelines - AHA/ACC (2023) (heart.org)"
- ✅ "ADA Standards of Care - ADA (2024) (diabetes.org)"

**Para Livros:**

```
[Nome do Livro] ([edição]ª edição, [ano de publicação])
```

**Exemplos:**

- ✅ "Harrison Medicina Interna (20ª edição, 2020)"
- ✅ "Semiologia Médica - Porto (7ª edição, 2020)"
- ✅ "Sabiston - Tratado de Cirurgia (19ª edição, 2020)"

**Para Artigos/Revisões:**

```
[Primeiro Autor] et al. ([título]). [Revista] ([ano]). DOI: [se disponível]
```

**Para Protocolos Governamentais:**

```
[Protocolo/Programa] - [Órgão] ([ano]) ([site.com])
```

**Exemplos:**

- ✅ "Protocolo Clínico de Diabetes - Ministério da Saúde (2023) (saude.gov.br)"
- ✅ "PCDT Diabetes Mellitus - CONITEC (2022) (conitec.gov.br)"

### Informação de Data na Resposta

**SEMPRE incluir após cada citação:**

- Ano de publicação/edição
- Data de atualização (se disponível)
- Edição do livro (se aplicável)
- Versão da diretriz (se aplicável)

**Exemplo de estrutura:**

```markdown
## Tratamento

### Primeira Linha

**IECA ou BRA:**

- Enalapril: 5-40 mg/dia
- Losartana: 50-100 mg/dia

**Fonte:** Diretriz Brasileira de Hipertensão Arterial - SBC (2024) (diretrizes.cardiol.br)
**Atualização:** Última revisão em 2024
**Base teórica:** Harrison Medicina Interna (20ª edição, 2020)
```

## Priorização Temporal de Fontes

### Informações que MUDAM Frequentemente (Priorizar <2 anos)

**Requerem fontes atualizadas (últimos 2-3 anos):**

- ✅ Tratamentos farmacológicos (novos medicamentos, mudanças em guidelines)
- ✅ Protocolos clínicos (PCDT, diretrizes de sociedades)
- ✅ Dados epidemiológicos (prevalência, incidência, tendências)
- ✅ Aprovação de medicamentos (FDA, ANVISA)
- ✅ Tecnologias em saúde (novos dispositivos, procedimentos)
- ✅ Algoritmos de tratamento (escalonamento terapêutico atualizado)
- ✅ Metas terapêuticas (valores alvo de exames)

**Estratégia:**

1. **PRIMEIRO:** Buscar diretrizes/guidelines mais recentes (últimos 2 anos)
2. **SE NÃO ENCONTRAR:** Usar fontes mais antigas mas INFORMAR que pode estar desatualizado
3. **COMPLEMENTAR:** Com base teórica de livros para entender mecanismos

### Informações ATEMPORAIS (Podem ser antigas se ainda válidas)

**Permitem fontes mais antigas (mas informar ano):**

- ✅ Fisiopatologia (mecanismos fundamentais raramente mudam)
- ✅ Semiologia clássica (técnicas de exame físico)
- ✅ Anatomia (estruturas anatômicas)
- ✅ Histologia/patologia básica
- ✅ Conceitos fundamentais (definições clássicas)

**Estratégia:**

1. Usar livros clássicos (Harrison, Porto) mesmo se antigos
2. **SEMPRE informar:** "Fonte: Harrison Medicina Interna (20ª edição, 2020)"
3. Se houver atualização recente do conceito, priorizar fonte atualizada

### Informações que MUDAM Moderadamente (Priorizar <5 anos)

**Fontes intermediárias aceitáveis:**

- ✅ Critérios diagnósticos (podem ter atualizações)
- ✅ Escalas prognósticas (podem ser revisadas)
- ✅ Fisiologia aplicada (pode ter novas descobertas)

**Estratégia:**

1. Preferir fontes <5 anos
2. Se mais antiga, verificar se houve atualização
3. Informar ano e mencionar se pode estar desatualizado

## Regras de Citação por Tipo de Informação

### 1. Tratamento Farmacológico

**OBRIGATÓRIO incluir:**

- Ano da diretriz/protocolo usado
- Última atualização da informação
- Base teórica (livro) para mecanismo de ação

**Exemplo:**

```markdown
### Tratamento de Hipertensão Arterial

**1ª Linha - Monoterapia:**

**IECA:**

- Enalapril: 5-40 mg/dia (iniciar 10 mg/dia)
- Mecanismo: Inibição da enzima conversora de angiotensina

**Fonte do protocolo:** Diretriz Brasileira de Hipertensão Arterial - SBC (2024) (diretrizes.cardiol.br)
**Base teórica:** Harrison Medicina Interna (20ª edição, 2020)
**Última atualização:** 2024
```

### 2. Critérios Diagnósticos

**OBRIGATÓRIO incluir:**

- Ano dos critérios usados
- Se há versão mais recente disponível, mencionar

**Exemplo:**

```markdown
### Diagnóstico

**Critérios de Framingham para Insuficiência Cardíaca:**

[Critérios listados]

**Fonte:** Framingham Heart Study (critérios clássicos, 1971)
**Atualização:** Mantidos válidos em estudos subsequentes
**Alternativa atual:** Diretriz Europeia de IC - ESC (2021) (escardio.org)
```

### 3. Dados Epidemiológicos

**OBRIGATÓRIO incluir:**

- Ano dos dados
- Fonte (instituição/governo)
- Região geográfica

**Exemplo:**

```markdown
### Epidemiologia

**Prevalência no Brasil:**

- Adultos ≥18 anos: 32,5% (2021)
- Idosos ≥65 anos: 65,8% (2021)

**Fonte:** Vigitel Brasil 2021 - Ministério da Saúde (saude.gov.br)
**Último levantamento:** 2021
**Nota:** Dados mais recentes disponíveis em [ano] se houver
```

### 4. Protocolos e Algoritmos

**OBRIGATÓRIO incluir:**

- Versão/ano do protocolo
- Data de publicação
- Se há versão mais recente

**Exemplo:**

```markdown
### Protocolo de Manejo

[Algoritmo]

**Fonte:** Protocolo Clínico de Diabetes Tipo 2 - Ministério da Saúde (2023) (saude.gov.br)
**Versão:** PCDT atualizado em 2023
**Anterior:** Versão 2020 (substituída)
```

### 5. Informações de Livros

**OBRIGATÓRIO incluir:**

- Edição do livro
- Ano de publicação
- Nota se há edição mais recente (se souber)

**Exemplo:**

```markdown
### Fisiopatologia

[Conteúdo sobre fisiopatologia]

**Fonte:** Harrison Medicina Interna (20ª edição, 2020)
**Nota:** Informações sobre fisiopatologia são atemporais e permanecem válidas
```

## Seção de "Fontes e Versões" Obrigatória

### Formato Padrão no Final de Cada Seção

```markdown
**Fontes e Versões:**

- **Protocolo atual:** [Nome] - [Org] ([ano]) ([site])
- **Base teórica:** [Livro] ([edição], [ano])
- **Epidemiologia:** [Fonte] ([ano]) ([site])
- **Última atualização:** [data quando possível]
- **Nota:** [Se houver informações de fontes antigas mas válidas, explicar]
```

### Exemplo Completo

```markdown
## Tratamento

[Conteúdo do tratamento]

**Fontes e Versões:**

- **Protocolo atual:** Diretriz Brasileira de Hipertensão Arterial - SBC (2024) (diretrizes.cardiol.br)
- **Guidelines internacionais:** ESC/ESH Guidelines (2023) (escardio.org)
- **Base teórica:** Harrison Medicina Interna (20ª edição, 2020)
- **Mecanismos farmacológicos:** Goodman & Gilman (13ª edição, 2018)
- **Última atualização consultada:** 2024
- **Nota:** Informações de fisiopatologia são baseadas em fontes mais antigas mas permanecem válidas (conceitos atemporais)
```

## Validação de Atualidade

### Checklist Antes de Usar Fonte

**Para cada fonte consultada, verificar:**

- [ ] Ano/edição está explícito na citação?
- [ ] Para informações temporais (tratamento, diretriz), é dos últimos 2-3 anos?
- [ ] Para informações atemporais (fisiopatologia), ano está informado mesmo se antigo?
- [ ] Se usando fonte antiga, há justificativa (ex: conceito atemporal)?
- [ ] Se há versão mais recente disponível, está mencionada?

### Quando Informar sobre Desatualização

**INFORMAR se:**

- ✅ Usando diretriz >5 anos para tratamento
- ✅ Usando dados epidemiológicos >5 anos
- ✅ Há versão mais recente conhecida disponível
- ✅ Informação pode ter mudado recentemente

**Exemplo de nota:**

```markdown
**Fonte:** Diretriz SBC de Hipertensão (2016) (diretrizes.cardiol.br)
**Nota:** Existe versão atualizada de 2024. Esta informação pode estar desatualizada. Consultar diretriz mais recente para práticas atuais.
```

## Prioridade de Fontes por Atualidade

### Ranking de Prioridade (Mais Atual = Prioridade Maior)

**1. Diretrizes/Guidelines (<2 anos) - MÁXIMA PRIORIDADE**

- SBC, AHA, ESC, ADA, etc. (últimos 2 anos)

**2. Protocolos Governamentais (<3 anos)**

- PCDT, Protocolos MS (<3 anos)

**3. Livros Texto (<5 anos para conteúdo clínico)**

- Harrison, Porto, etc. (edições recentes)

**4. Artigos Científicos (<5 anos)**

- Revisões sistemáticas, meta-análises recentes

**5. Fontes Antigas (>5 anos)**

- Aceitável apenas para informações atemporais
- **SEMPRE informar ano e justificar uso**

## Integração com Busca em @md/

### Estratégia de Busca Prioritizada

**1. Identificar ano/edição do livro em @md/:**

- Verificar metadados do arquivo
- Verificar informação no início do documento
- Se não disponível, mencionar incerteza

**2. Para atualização via MCP:**

- Buscar diretrizes mais recentes (últimos 2 anos)
- Comparar com informação de livro
- Usar diretriz atualizada como fonte principal
- Livro como base teórica complementar

### Exemplo de Integração

```markdown
## Tratamento

**1ª Linha - IECA:**

- Enalapril: 5-40 mg/dia

**Mecanismo de ação (base teórica):**
[Explicação baseada em Harrison]

**Fonte do protocolo:** Diretriz Brasileira de Hipertensão - SBC (2024) (diretrizes.cardiol.br)
**Base teórica:** Harrison Medicina Interna (20ª edição, 2020) - mecanismo de ação
**Última atualização:** 2024

**Buscar mais:**

- Protocolo: "hipertensão diretriz 2024 SBC" em diretrizes.cardiol.br
- Mecanismos: "IECA mecanismo ação" em Harrison
```

## Exceções e Casos Especiais

### Quando Não Há Informação de Data Disponível

**Estratégia:**

1. Tentar identificar pelo contexto (conteúdo, formato)
2. Mencionar: "Fonte: [nome] (ano não especificado)"
3. Adicionar nota: "Informação de data não disponível na fonte consultada"
4. Priorizar outras fontes com data explícita quando possível

### Quando Informação É Atemporal Mas Fonte É Antiga

**Justificar uso:**

```markdown
**Fonte:** Semiologia Médica - Porto (7ª edição, 2020)
**Nota:** Técnicas de exame físico são atemporais e esta informação permanece válida apesar da data de publicação
```

### Quando Há Conflito Entre Fontes

**Estratégia:**

1. Priorizar fonte mais recente
2. Mencionar ambas as fontes
3. Explicar diferença ou escolha

**Exemplo:**

```markdown
**Protocolo atual:** Diretriz SBC (2024) recomenda X
**Protocolo anterior:** Diretriz SBC (2016) recomendava Y
**Mudança:** [Explicar mudança entre versões]
**Recomendação atual:** Usar protocolo 2024
```

## Mensagens Padronizadas

### Quando Usar Fonte Antiga (Justificada)

```markdown
**Fonte:** [Nome] ([ano])
**Nota sobre atualidade:** [Justificar por que fonte antiga é aceitável]
```

### Quando Informação Pode Estar Desatualizada

```markdown
**Fonte:** [Nome] ([ano])
**Aviso:** Esta informação pode estar desatualizada. Recomenda-se consultar diretriz mais recente de [ano] se disponível.
```

### Quando Informação É Atual

```markdown
**Fonte:** [Nome] ([ano])
**Atualização:** Informação atualizada de acordo com diretrizes mais recentes disponíveis
```

## Integração com Guardrail de Fontes Web

**Este guardrail funciona em conjunto com:**

- `.cursor/rules/guardrail-fontes-web.md` (validação de domínios)

**Ambos devem ser aplicados simultaneamente:**

- ✅ Validar domínio (guardrail-fontes-web)
- ✅ Informar ano/edição (guardrail-versao-fontes)

## Checklist de Validação Final

Antes de finalizar qualquer resposta, verificar:

- [ ] Todas as fontes têm ano/edição explícito?
- [ ] Fontes de tratamento são dos últimos 2-3 anos?
- [ ] Fontes atemporais têm ano informado e justificativa?
- [ ] Seção "Fontes e Versões" presente em seções principais?
- [ ] Notas sobre atualidade incluídas quando necessário?
- [ ] Mensagens padronizadas usadas corretamente?

---

## Resumo Executivo

**⚠️ REGRAS PRINCIPAIS:**

1. **SEMPRE incluir ano/edição** em todas as citações
2. **PRIORIZAR fontes recentes** (<2 anos) para informações temporais
3. **INFORMAR ano mesmo** de fontes antigas (para informações atemporais)
4. **JUSTIFICAR uso** de fontes antigas quando necessário
5. **MENCIONAR atualizações** disponíveis quando conhecidas

**Formato de citação obrigatório:**

- Diretrizes: `[Nome] - [Org] ([ano]) ([site])`
- Livros: `[Nome] ([edição]ª ed, [ano])`
- Sempre incluir ano!

**Seção obrigatória:**

- "Fontes e Versões" no final de cada seção principal
