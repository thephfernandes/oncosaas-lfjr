---
name: openevidence-pesquisa-casos-clinicos
description: Estrutura prompts em português ou inglês para pesquisa de evidência clínica no OpenEvidence a partir de casos de paciente (perguntas PICO, contexto seguro e objetivo clínico explícito). Usar quando o usuário pedir prompt para OpenEvidence, busca de evidência para caso clínico, formulação de pergunta clínica estruturada ou revisão de literatura orientada ao paciente.
---

# OpenEvidence — prompts para casos clínicos

## Objetivo

Gerar **perguntas reutilizáveis e precisas** para o OpenEvidence (ou ferramentas similares de evidência), maximizando relevância e segurança, sem expor identificadores do paciente.

## Princípios

1. **Anonimização obrigatória**: idade em faixas quando possível; sem nome, iniciais, datas exatas de nascimento, número de prontuário, local preciso.
2. **Uma pergunta principal** por prompt; perguntas secundárias só se forem independentes.
3. **Contexto mínimo viável**: só o que altera conduta (comorbidades, função renal/hepática, gravidez, medicações que interagem, alergias relevantes, estágio/linha de tratamento).
4. **Objetivo explícito**: diagnóstico diferencial, escolha de regime, manejo de toxicidade, suporte, critérios de internação, transição de cuidados, etc.
5. **População e cenário**: ambulatorial vs emergência; país/região só quando impactar disponibilidade de drogas ou diretrizes.

## Estrutura recomendada do prompt

Usar nesta ordem (seções curtas):

```
1) Resumo do caso (2–6 linhas)
2) Pergunta clínica principal (1 frase)
3) Subperguntas opcionais (máx. 2)
4) Evidência desejada (diretriz nacional/internacional, RCT, revisão sistemática, série de casos)
5) Restrições / o que evitar (ex.: contraindicações, preferência por via oral, ausência de biobanco)
```

## Mapa rápido PICO (para embutir no texto)

| P | Paciente/população (sem PHI) |
| I | Intervenção ou exposição em dúvida |
| C | Comparador (placebo, outro regime, observação) |
| O | Desfecho desejado (sobrevida, toxicidade grau ≥3, resposta, qualidade de vida, tempo até evento) |

Quando não houver comparador claro, declarar: *“comparar opções A vs B”* ou *“melhor abordagem quando não há RCT”*.

## Template base (copiar e preencher)

```markdown
## Caso (anonimizado)
- Idade/faixa: 
- Sexo (se relevante biologicamente): 
- Diagnóstico e estádio/linha: 
- Comorbidades e órgãos-alvo (FR, FEVI, Child-Pugh, etc.): 
- Medicações relevantes (classe ou nome): 
- Achados-chave (sinais, exames, tempo de evolução): 

## Pergunta principal
Para [população] com [condição] em [cenário], qual [intervenção/estratégia] melhora [desfecho] em relação a [alternativa], considerando [restrições]?

## Evidência preferida
[ diretriz / revisão sistemática / RCT / consenso ]

## O que preciso na resposta
- Resumo executivo (3–5 linhas)
- Nível de evidência e limitações
- Alternativas quando evidência for fraca
- Red flags / quando escalar ou referenciar urgência
```

## Ajustes por intenção

| Intenção | Reforçar no prompt |
|----------|-------------------|
| Diagnóstico | critérios diagnósticos, diferenciais por prevalência no cenário, exames sequenciados |
| Tratamento | linha de terapia, biomarcadores, interações, dose em DRC |
| Toxicidade / evento agudo | gradação (CTCAE quando aplicável), manejo escalonado, profilaxia |
| Prognóstico | fatores validados, calculadoras citadas na literatura |
| Populações especiais | idoso frágil, gestante, imunossuprimido, transplante |

## Erros comuns a evitar

- Pergunta única demais (“o que fazer?”) sem desfecho.
- Misturar três cenários diferentes num só prompt.
- Incluir dados identificáveis ou irrelevantes (nome de hospital, data exata).
- Pedir “tudo sobre o câncer X” sem linha de tratamento ou dúvida.

## Saída esperada do agente

Ao acionar esta skill, produzir:

1. **Prompt principal** pronto para colar no OpenEvidence.
2. **Variante curta** (≤280 caracteres) se o usuário preferir busca rápida.
3. **Lista de 3–6 termos MeSH/sinônimos** opcionais para refinar se a plataforma permitir busca avançada.

## Limitações

- A skill **não substitui** julgamento clínico nem fonte primária; orienta só a formulação da pergunta.
- Se o caso for urgência com instabilidade, o prompt deve pedir **algoritmo de estabilização e critérios de encaminhamento**, não só evidência eletiva.

## Exemplo mínimo

**Entrada (esboço do usuário):** “Paciente com mieloma recidivado após IMiD e PI, rim ruim, qual esquema?”

**Saída (prompt):**

```text
Caso: adulto com mieloma múltiplo recidivado após falha a lenalidomida e inibidor de proteassoma; DRC estádio 3b (TFG estimada ~35 mL/min); sem contraindicação a anticorpo monoclonal; ECOG 1.

Pergunta: Quais regimes (incluindo terapias baseadas em anticorpo) têm melhor relação benefício/risco em recidiva pós-IMiD/PI com TFG 30–40 mL/min, e como ajustar dose/monitorização?

Evidência: diretrizes e RCTs; se evidência fraca, consenso de especialidade.

Resposta desejada: comparação de opções, ajustes renais citados, toxicidades relevantes.
```
