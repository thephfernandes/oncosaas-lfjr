# MVP Scope - Features e Backlog Priorizado

## Definição do MVP

**Objetivo**: Validar valor da plataforma com features mínimas viáveis que resolvam problemas críticos identificados no Product Discovery.

**Duração Estimada**: 6 meses

**Release**: v1.0

## Features do MVP

### 1. Navegação de Pacientes ⭐⭐⭐

**Prioridade**: Alta (Must-Have)

**Descrição**: Dashboard que mostra onde cada paciente está na jornada oncológica (rastreio, diagnóstico, tratamento, seguimento).

**Features**:

- [ ] Lista de pacientes com status atual
- [ ] Visualização da jornada (timeline)
- [ ] Filtros básicos (tipo de câncer, estágio, status)
- [ ] Detalhes do paciente (informações básicas)

**Critérios de Aceitação**:

- Enfermagem consegue ver todos os pacientes em uma tela
- É possível filtrar por tipo de câncer e estágio
- Timeline mostra etapas da jornada claramente

**Esforço**: Médio (2-3 sprints)

---

### 2. Priorização com IA ⭐⭐⭐

**Prioridade**: Alta (Must-Have)

**Descrição**: Sistema de scoring que identifica casos que precisam atenção imediata baseado em múltiplos fatores.

**Features**:

- [ ] Modelo de ML para calcular score de prioridade (0-100)
- [ ] Categorização automática (crítico, alto, médio, baixo)
- [ ] Explicação do score (razão da priorização)
- [ ] Atualização automática do score quando novos dados chegam

**Critérios de Aceitação**:

- Score é calculado automaticamente para todos os pacientes
- Lista de pacientes ordenada por prioridade
- Explicação do score é clara e útil

**Esforço**: Alto (4-5 sprints)

---

### 3. Agente de IA no WhatsApp ⭐⭐⭐

**Prioridade**: Alta (Must-Have)

**Descrição**: Agente conversacional que coleta dados clínicos de pacientes via WhatsApp (texto e áudio).

**Features**:

- [ ] Integração com WhatsApp Business API
- [ ] Agente conversacional básico (LLM)
- [ ] Processamento de mensagens de texto
- [ ] Processamento de áudio (STT)
- [ ] Coleta de sintomas de forma conversacional
- [ ] Detecção de sintomas críticos
- [ ] Alertas automáticos para enfermagem

**Critérios de Aceitação**:

- Agente consegue conversar naturalmente com pacientes
- Coleta dados de sintomas (dor, náusea, fadiga, etc.)
- Detecta sintomas críticos e alerta enfermagem
- Processa áudios e transcreve corretamente

**Esforço**: Alto (5-6 sprints)

---

### 4. Dashboard para Enfermagem ⭐⭐⭐

**Prioridade**: Alta (Must-Have)

**Descrição**: Dashboard para monitorar pacientes, visualizar conversas WhatsApp, receber alertas e intervir manualmente.

**Features**:

- [ ] Lista de pacientes ordenada por prioridade
- [ ] Visualização de conversas WhatsApp (histórico completo)
- [ ] Alertas em tempo real (sintomas críticos, sem resposta, etc.)
- [ ] Intervenção manual (assumir conversa, responder paciente)
- [ ] Filtros e busca
- [ ] Indicadores visuais (cores por prioridade)

**Critérios de Aceitação**:

- Enfermagem consegue ver todos os pacientes e suas prioridades
- É possível visualizar conversas completas
- Alertas aparecem em tempo real
- Enfermagem pode assumir conversa e responder manualmente

**Esforço**: Médio (3-4 sprints)

---

### 5. Integração Básica HL7/FHIR ⭐⭐

**Prioridade**: Média (Should-Have)

**Descrição**: Integração básica com sistemas EHR/PMS para sincronizar dados de pacientes e enviar observações.

**Features**:

- [ ] Integração FHIR REST (pull de dados de pacientes)
- [ ] Sincronização de dados básicos do paciente
- [ ] Envio de observações (FHIR Observation) para EHR
- [ ] Suporte a 1-2 EHRs principais (Epic, Cerner, ou Tasy)

**Critérios de Aceitação**:

- Dados de pacientes são sincronizados do EHR
- Observações coletadas pelo agente são enviadas para EHR
- Sincronização funciona de forma confiável

**Esforço**: Alto (4-5 sprints)

---

### 6. Questionários Adaptativos (Básico) ⭐⭐

**Prioridade**: Média (Should-Have)

**Descrição**: Coleta de questionários validados (EORTC QLQ-C30, PRO-CTCAE, ESAS) de forma conversacional.

**Features**:

- [ ] EORTC QLQ-C30 (versão simplificada)
- [ ] PRO-CTCAE (sintomas principais)
- [ ] ESAS (Escala de Sintomas de Edmonton)
- [ ] Entrega conversacional (não lista de perguntas)

**Critérios de Aceitação**:

- Agente consegue coletar questionários de forma natural
- Dados são extraídos e armazenados estruturados
- Questionários podem ser completados em múltiplas conversas

**Esforço**: Médio (2-3 sprints)

---

## Features Fora do MVP (Backlog)

### Fase 2 (12 meses)

- [ ] RAG completo para suporte à decisão (guidelines NCCN, ASCO)
- [ ] Integração com mais EHRs
- [ ] Analytics avançado (dashboards executivos)
- [ ] Suporte a múltiplos idiomas
- [ ] Questionários completos (EORTC completo, outros)

### Fase 3 (18 meses)

- [ ] Expansão para outros tipos de câncer (começar com mama, pulmão, colorretal)
- [ ] Parcerias com planos de saúde
- [ ] Certificação ANVISA (SaMD Classe II)
- [ ] Agente multi-canal (WhatsApp, SMS, Telegram)
- [ ] Mobile app (opcional)

## Backlog Priorizado (RICE Score)

### Método RICE

- **Reach**: Quantos usuários serão impactados?
- **Impact**: Quão grande é o impacto?
- **Confidence**: Quão confiantes estamos?
- **Effort**: Quanto esforço necessário?

**RICE Score = (Reach × Impact × Confidence) / Effort**

### Priorização MVP

| Feature              | Reach | Impact | Confidence | Effort | RICE | Prioridade |
| -------------------- | ----- | ------ | ---------- | ------ | ---- | ---------- |
| Dashboard Enfermagem | 10    | 3      | 80%        | 8      | 3.0  | 1          |
| Agente WhatsApp      | 10    | 3      | 70%        | 10     | 2.1  | 2          |
| Priorização IA       | 10    | 3      | 60%        | 10     | 1.8  | 3          |
| Navegação            | 8     | 2      | 80%        | 6      | 2.1  | 4          |
| Integração FHIR      | 8     | 2      | 50%        | 10     | 0.8  | 5          |
| Questionários        | 7     | 2      | 70%        | 6      | 1.6  | 6          |

## Roadmap de Desenvolvimento

### Sprint 1-2: Fundação

- Setup do projeto (Next.js + NestJS)
- Banco de dados (PostgreSQL + Prisma)
- Autenticação básica
- Estrutura multi-tenant

### Sprint 3-4: Navegação de Pacientes

- CRUD de pacientes
- Dashboard básico
- Lista de pacientes
- Filtros

### Sprint 5-6: Integração WhatsApp

- Webhook WhatsApp
- Processamento de mensagens
- Fila de mensagens

### Sprint 7-10: Agente de IA

- Integração LLM (GPT-4/Claude)
- Agente conversacional básico
- Processamento de áudio (STT)
- Detecção de sintomas críticos

### Sprint 11-13: Dashboard Enfermagem

- Visualização de conversas
- Alertas em tempo real
- Intervenção manual

### Sprint 14-16: Priorização IA

- Modelo de ML
- Cálculo de scores
- Explicação do score

### Sprint 17-19: Integração FHIR

- Cliente FHIR
- Sincronização de pacientes
- Envio de observações

### Sprint 20-21: Questionários

- EORTC simplificado
- PRO-CTCAE básico
- ESAS

### Sprint 22-24: Polimento e Testes

- Testes end-to-end
- Ajustes de UX
- Performance
- Segurança

## Critérios de Sucesso do MVP

### Métricas Técnicas

- [ ] Uptime: ≥99% (MVP)
- [ ] Tempo de resposta: <3s (p95)
- [ ] Taxa de erro: <1%

### Métricas de Produto

- [ ] Taxa de resposta ao agente: ≥60%
- [ ] Taxa de detecção de sintomas críticos: ≥90%
- [ ] Tempo médio de resposta a alertas: <2 horas
- [ ] Satisfação do usuário (NPS): ≥50

### Métricas de Negócio

- [ ] 3-5 clientes piloto
- [ ] Retenção: ≥80% após 3 meses
- [ ] Churn: <10% após 6 meses

## Próximos Passos

1. Validar MVP scope com stakeholders
2. Criar backlog detalhado no Jira/Linear
3. Iniciar desenvolvimento (Sprint 1)
4. Revisões semanais de progresso
5. Ajustes de scope conforme feedback
