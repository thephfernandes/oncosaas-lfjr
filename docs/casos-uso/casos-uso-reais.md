# Casos de Uso Reais

## Plataforma de Otimização Oncológica

### Template para Coleta de Casos de Uso

Este documento serve como template para coletar casos de uso reais de clientes piloto. Cada caso deve incluir métricas de impacto, economia gerada e depoimentos.

---

## Template de Caso de Uso

```markdown
### [Nome do Hospital/Clínica]

**Período do Piloto:** [Data início] - [Data fim]
**Número de Pacientes:** [X] pacientes
**Tipo de Instituição:** [Clínica pequena / Hospital médio / Hospital grande]

#### Contexto Inicial

- [Desafios enfrentados antes da plataforma]
- [Processo anterior de acompanhamento]
- [Problemas específicos]

#### Implementação

- [Como foi o processo de implementação]
- [Tempo de setup]
- [Treinamento da equipe]
- [Dificuldades encontradas]

#### Resultados Alcançados

**Métricas de Impacto:**

- Redução de readmissões: [X]% (de [Y] para [Z])
- Redução de consultas presenciais: [X]% (de [Y] para [Z])
- Tempo médio de resposta a alertas: [X] horas → [Y] minutos
- Taxa de adesão a questionários: [X]% (antes: [Y]%)
- Satisfação do paciente: [X]/10 (antes: [Y]/10)

**Economia Gerada:**

- Economia anual em readmissões: R$ [X]
- Economia anual em consultas: R$ [X]
- Economia total anual: R$ [X]
- ROI: [X]x

**Melhorias Operacionais:**

- [Eficiência da equipe]
- [Redução de tarefas manuais]
- [Melhor coordenação]

#### Casos Específicos de Sucesso

**Caso 1: [Título]**

- Situação: [Descrição]
- Ação: [O que a plataforma fez]
- Resultado: [Impacto]

**Caso 2: [Título]**

- Situação: [Descrição]
- Ação: [O que a plataforma fez]
- Resultado: [Impacto]

#### Depoimentos

**Oncologista:**

> "[Depoimento do oncologista]"
>
> — [Nome], [Cargo], [Hospital]

**Enfermeira/Coordenadora:**

> "[Depoimento da enfermagem]"
>
> — [Nome], [Cargo], [Hospital]

**Gestor/Diretor:**

> "[Depoimento do gestor]"
>
> — [Nome], [Cargo], [Hospital]

#### Lições Aprendidas

- [O que funcionou bem]
- [O que poderia ser melhorado]
- [Recomendações para outros hospitais]

#### Próximos Passos

- [Expansão planejada]
- [Novas features solicitadas]
- [Continuidade do uso]
```

---

## Exemplos de Casos de Uso (Placeholder)

### Exemplo 1: Hospital X - Detecção Precoce de Neutropenia

**Período do Piloto:** Janeiro - Março 2024
**Número de Pacientes:** 50 pacientes em quimioterapia
**Tipo de Instituição:** Hospital médio

#### Contexto Inicial

- Hospital tinha dificuldade em monitorar pacientes entre ciclos de quimioterapia
- Pacientes com neutropenia chegavam ao pronto-socorro já com infecção estabelecida
- Taxa de readmissão por complicações: 18%

#### Implementação

- Setup completo em 2 semanas
- Treinamento da equipe de enfermagem: 4 horas
- Integração com EHR em 3 semanas

#### Resultados Alcançados

**Métricas de Impacto:**

- Redução de readmissões: 28% (de 18% para 13%)
- Detecção de neutropenia: 85% dos casos detectados antes de infecção
- Tempo médio de resposta: 72 horas → 2 horas
- Taxa de adesão: 78% (antes: 25%)

**Economia Gerada:**

- Economia anual em readmissões: R$ 420.000
- Economia anual em consultas: R$ 150.000
- Economia total anual: R$ 570.000
- ROI: 19x

**Melhorias Operacionais:**

- Equipe de enfermagem 20% mais eficiente
- Redução de 60% em chamadas telefônicas manuais
- Melhor coordenação entre equipes

#### Casos Específicos de Sucesso

**Caso 1: Detecção de Febre em Paciente Oncológico**

- Situação: Paciente reportou febre via WhatsApp às 22h de sábado
- Ação: Sistema detectou sintoma crítico e alertou enfermagem imediatamente
- Resultado: Paciente foi ao pronto-socorro, recebeu antibiótico precoce, evitou sepse

**Caso 2: Priorização de Caso Urgente**

- Situação: 45 pacientes ativos no sistema
- Ação: Sistema identificou paciente com piora súbita de sintomas e colocou no topo
- Resultado: Equipe focou no caso certo, evitou complicação grave

#### Depoimentos

**Oncologista:**

> "A plataforma transformou nosso processo de acompanhamento. Agora conseguimos detectar complicações antes que se tornem graves. O agente de WhatsApp é incrível - os pacientes adoram e a adesão é muito maior que questionários tradicionais."
>
> — Dra. Maria Silva, Oncologista Clínica, Hospital X

**Enfermeira:**

> "O dashboard de enfermagem é incrível. Conseguimos priorizar nossos pacientes e intervir quando realmente precisam. Antes, ficávamos perdidos tentando descobrir quem precisava de atenção. Agora é automático."
>
> — Enfermeira Ana Costa, Coordenadora de Enfermagem, Hospital X

**Gestor:**

> "ROI evidente no primeiro mês. Reduzimos readmissões e melhoramos a satisfação dos pacientes significativamente. A economia gerada já pagou o investimento em 3 meses."
>
> — Dr. João Santos, Diretor Médico, Hospital X

#### Lições Aprendidas

- Treinamento da equipe é crucial para adoção
- Pacientes adoram a interação via WhatsApp
- Alertas precisam ser configurados cuidadosamente para evitar sobrecarga
- Integração com EHR facilita muito a adoção

#### Próximos Passos

- Expansão para todos os pacientes oncológicos
- Implementação de questionários adicionais (EORTC QLQ-C30)
- Integração com mais sistemas do hospital

---

### Exemplo 2: Clínica Y - Redução de Consultas Desnecessárias

**Período do Piloto:** Fevereiro - Abril 2024
**Número de Pacientes:** 80 pacientes
**Tipo de Instituição:** Clínica pequena

#### Contexto Inicial

- Clínica tinha dificuldade em acompanhar pacientes entre consultas
- Muitas consultas presenciais apenas para reportar sintomas leves
- Equipe sobrecarregada com chamadas telefônicas

#### Implementação

- Setup em 1 semana
- Treinamento: 2 horas
- Sem integração EHR (planejada para fase 2)

#### Resultados Alcançados

**Métricas de Impacto:**

- Redução de consultas presenciais: 42% (de 160 para 93/mês)
- Redução de chamadas telefônicas: 65%
- Tempo de resposta: 48 horas → 4 horas
- Satisfação do paciente: 8.5/10 (antes: 6.5/10)

**Economia Gerada:**

- Economia anual em consultas: R$ 200.000
- Economia em eficiência: R$ 80.000
- Economia total anual: R$ 280.000
- ROI: 18.7x

**Melhorias Operacionais:**

- Equipe pode focar em casos mais complexos
- Menos deslocamentos para pacientes
- Melhor qualidade de vida da equipe

#### Casos Específicos de Sucesso

**Caso 1: Questionário Remoto**

- Situação: Paciente precisava reportar sintomas após ciclo de quimioterapia
- Ação: Agente coletou questionário EORTC via WhatsApp
- Resultado: Consulta cancelada, sintomas leves tratados remotamente

**Caso 2: Detecção de Ansiedade**

- Situação: Paciente reportou ansiedade e insônia via WhatsApp
- Ação: Sistema detectou e enfermagem entrou em contato
- Resultado: Suporte psicológico oferecido, evitou piora

#### Depoimentos

**Oncologista:**

> "A plataforma liberou muito tempo da nossa equipe. Agora focamos em casos que realmente precisam de atenção presencial. Os pacientes também preferem - não precisam se deslocar para reportar sintomas simples."
>
> — Dra. Carla Oliveira, Oncologista, Clínica Y

**Enfermeira:**

> "Adoramos o sistema! Conseguimos monitorar todos os pacientes de forma centralizada. Os alertas são muito úteis - não perdemos mais casos importantes."
>
> — Enfermeira Paula Lima, Clínica Y

#### Lições Aprendidas

- Clínicas pequenas se beneficiam muito da eficiência
- Pacientes adoram não precisar ir à clínica
- Alertas precisam ser calibrados para evitar falsos positivos

#### Próximos Passos

- Integração com sistema de agendamento
- Expansão para outros tipos de câncer
- Integração com laboratórios

---

## Checklist para Coleta de Casos de Uso

### Antes do Piloto

- [ ] Baseline de métricas (readmissões, consultas, satisfação)
- [ ] Definição de objetivos do piloto
- [ ] Acordo de compartilhamento de dados (anonimizado)
- [ ] Consentimento para uso de depoimentos

### Durante o Piloto

- [ ] Coleta semanal de métricas
- [ ] Entrevistas com equipe (quinzenais)
- [ ] Pesquisa de satisfação do paciente
- [ ] Registro de casos específicos de sucesso

### Após o Piloto

- [ ] Análise comparativa (antes vs. depois)
- [ ] Cálculo de ROI real
- [ ] Entrevistas finais com stakeholders
- [ ] Coleta de depoimentos
- [ ] Documentação do caso de uso
- [ ] Aprovação para uso público

---

## Métricas Padrão para Coletar

### Métricas Clínicas

- Taxa de readmissão (antes e depois)
- Tempo médio de diagnóstico
- Detecção precoce de complicações
- Satisfação do paciente (NPS ou escala 0-10)
- Adesão a questionários

### Métricas Operacionais

- Número de consultas presenciais (antes e depois)
- Tempo de resposta a alertas
- Eficiência da equipe (horas economizadas)
- Taxa de uso da plataforma
- Número de intervenções manuais

### Métricas Financeiras

- Economia em readmissões
- Economia em consultas
- Economia em eficiência
- ROI real
- Payback period

---

## Formato de Depoimentos

### Para Oncologistas

**Perguntas:**

1. Como a plataforma impactou seu trabalho?
2. Qual foi o maior benefício?
3. O que mais surpreendeu?
4. O que você diria para outros oncologistas?

### Para Enfermagem

**Perguntas:**

1. Como o dashboard facilitou seu trabalho?
2. Os alertas são úteis?
3. A intervenção manual funciona bem?
4. O que você melhoraria?

### Para Gestores

**Perguntas:**

1. O ROI foi o esperado?
2. Qual foi o maior benefício financeiro?
3. A implementação foi fácil?
4. Você recomendaria para outros hospitais?

---

## Uso dos Casos de Uso

### Apresentações

- Slides de apresentação
- Pitch deck
- Materiais de vendas

### Marketing

- Site e landing pages
- E-books e whitepapers
- Webinars
- Cases de sucesso

### Vendas

- Propostas comerciais
- Demonstrações
- Referências para prospects

---

## Notas Importantes

### Privacidade

- Sempre anonimizar dados de pacientes
- Usar nomes fictícios nos casos
- Obter consentimento para uso de depoimentos
- Respeitar LGPD

### Validação

- Validar métricas com equipe do hospital
- Aprovar depoimentos antes de usar
- Confirmar números de economia
- Garantir precisão dos dados

### Atualização

- Revisar casos periodicamente
- Atualizar métricas quando disponíveis
- Adicionar novos casos conforme surgem
- Manter casos relevantes e atualizados

---

**FIM DO DOCUMENTO**
