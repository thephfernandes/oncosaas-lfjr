# Wireframes - Dashboard para Enfermagem

## Visão Geral

Dashboard para monitoramento de pacientes oncológicos, visualização de conversas WhatsApp, alertas em tempo real e intervenção manual.

## Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Plataforma Oncológica          [Usuário] [Notif]   │
├─────────────────────────────────────────────────────────────┤
│  [Dashboard] [Pacientes] [Conversas] [Alertas] [Métricas]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FILTROS                                             │   │
│  │  [Tipo Câncer ▼] [Estágio ▼] [Status ▼] [Buscar]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LISTA DE PACIENTES (Ordenada por Prioridade)        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🔴 João Silva - Mama III - Score: 85 (CRÍTICO)     │   │
│  │      Última interação: 2h atrás | 3 alertas         │   │
│  │      [Ver Conversa] [Assumir] [Marcar Resolvido]    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🟡 Maria Santos - Pulmão II - Score: 65 (ALTO)     │   │
│  │      Última interação: 1 dia atrás | 1 alerta       │   │
│  │      [Ver Conversa] [Assumir]                        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🟢 Pedro Costa - Colorretal I - Score: 25 (MÉDIO)  │   │
│  │      Última interação: 3 dias atrás | 0 alertas     │   │
│  │      [Ver Conversa]                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tela: Lista de Pacientes

### Componentes

**1. Filtros e Busca**

- Dropdown: Tipo de câncer
- Dropdown: Estágio (I, II, III, IV)
- Dropdown: Status (crítico, alto, médio, baixo)
- Dropdown: Último contato (24h, 7 dias, 30 dias)
- Campo de busca: Nome do paciente

**2. Lista de Pacientes**

- Ordenada por score de prioridade (descendente)
- Cards com informações principais:
  - Nome do paciente
  - Tipo de câncer e estágio
  - Score de prioridade (0-100)
  - Categoria (crítico, alto, médio, baixo)
  - Indicador visual (🔴 🟡 🟢)
  - Última interação com agente
  - Número de alertas ativos
- Ações rápidas:
  - [Ver Conversa]: Abre modal com histórico
  - [Assumir]: Assume conversa manualmente
  - [Marcar Resolvido]: Marca alerta como resolvido

**3. Indicadores Visuais**

- 🔴 Vermelho: Crítico (score 76-100)
- 🟡 Amarelo: Alto (score 51-75)
- 🟢 Verde: Médio/Baixo (score 0-50)

## Tela: Visualização de Conversa

### Modal de Conversa

```
┌─────────────────────────────────────────────────────────────┐
│  Conversa: João Silva                    [X]                │
├─────────────────────────────────────────────────────────────┤
│  [Informações do Paciente]                                   │
│  Tipo: Mama III | Idade: 58 | Score: 85 (CRÍTICO)          │
├─────────────────────────────────────────────────────────────┤
│  HISTÓRICO DE CONVERSA                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📅 15/01/2024 10:30                                 │   │
│  │  🤖 Agente: Olá João, como você está se sentindo?    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📅 15/01/2024 10:32                                 │   │
│  │  👤 João: Estou com muita dor, tipo 8 de 10          │   │
│  │  ⚠️ ALERTA: Dor intensa detectada!                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📅 15/01/2024 10:35                                 │   │
│  │  🤖 Agente: Entendo, você está com dor intensa.      │   │
│  │         Vou alertar a equipe para entrar em contato. │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📅 15/01/2024 10:40                                 │   │
│  │  👩‍⚕️ Enfermeira Ana: João, vou ligar para você agora │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  DADOS ESTRUTURADOS EXTRAÍDOS                               │
│  • Dor: 8/10 (Crítico)                                      │
│  • Náusea: 3/10 (Leve)                                      │
│  • Fadiga: 6/10 (Moderada)                                  │
│                                                              │
│  [Campo de texto para responder] [Enviar] [Assumir Conversa]│
└─────────────────────────────────────────────────────────────┘
```

### Componentes

**1. Cabeçalho**

- Nome do paciente
- Informações básicas (tipo de câncer, estágio, score)
- Botão fechar (X)

**2. Histórico de Conversa**

- Timeline de mensagens
- Identificação de remetente (Agente, Paciente, Enfermagem)
- Timestamp de cada mensagem
- Alertas destacados visualmente
- Áudios: player para ouvir

**3. Dados Estruturados**

- Sintomas extraídos com escalas
- Questionários completados (EORTC, PRO-CTCAE, ESAS)
- Scores calculados

**4. Ações**

- Campo de texto para responder
- Botão "Enviar" (envia mensagem via WhatsApp)
- Botão "Assumir Conversa" (muda contexto para enfermagem)

## Tela: Alertas em Tempo Real

```
┌─────────────────────────────────────────────────────────────┐
│  ALERTAS                                      [Filtrar ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔴 CRÍTICO - João Silva                                     │
│     Dor intensa detectada (8/10)                            │
│     Há 5 minutos                                            │
│     [Ver Conversa] [Assumir] [Marcar Resolvido]            │
│                                                              │
│  🟡 ALTO - Maria Santos                                      │
│     Paciente não respondeu há 3 dias                        │
│     Há 1 hora                                               │
│     [Ver Conversa] [Assumir] [Marcar Resolvido]            │
│                                                              │
│  🟡 ALTO - Pedro Costa                                       │
│     Mudança significativa em score (35 → 68)                │
│     Há 2 horas                                              │
│     [Ver Conversa] [Assumir] [Marcar Resolvido]            │
│                                                              │
│  🟢 MÉDIO - Ana Oliveira                                     │
│     Consulta atrasada (deveria ter sido há 2 dias)          │
│     Há 3 horas                                              │
│     [Ver Conversa] [Assumir] [Marcar Resolvido]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

**1. Lista de Alertas**

- Ordenada por severidade e tempo
- Cards com:
  - Severidade (🔴 🟡 🟢)
  - Tipo de alerta
  - Nome do paciente
  - Descrição do alerta
  - Timestamp
  - Ações rápidas

**2. Filtros**

- Por severidade (crítico, alto, médio, baixo)
- Por tipo (sintoma crítico, sem resposta, atraso, etc.)
- Por status (pendente, resolvido, descartado)

**3. Notificações**

- Badge com número de alertas não resolvidos
- Push notifications no navegador
- Som (opcional, pode desabilitar)

## Tela: Métricas e Analytics

```
┌─────────────────────────────────────────────────────────────┐
│  MÉTRICAS E ANALYTICS                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Total        │ │ Respostas    │ │ Alertas      │        │
│  │ Pacientes    │ │ ao Agente    │ │ Gerados      │        │
│  │ 125          │ │ 78%          │ │ 12 (hoje)    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Taxa de Resposta ao Agente (Últimos 30 dias)         │   │
│  │ [Gráfico de linha]                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Sintomas Mais Reportados                              │   │
│  │ [Gráfico de barras]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tempo Médio de Resposta a Alertas                    │   │
│  │ [Gráfico de barras]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

**1. Cards de Métricas**

- Total de pacientes
- Taxa de resposta ao agente
- Número de alertas gerados
- Tempo médio de resposta

**2. Gráficos**

- Taxa de resposta ao longo do tempo
- Sintomas mais reportados
- Distribuição de prioridades
- Tempo de resposta a alertas

## Responsividade

### Mobile

- Layout adaptado para telas menores
- Lista de pacientes em formato de cards empilhados
- Conversa em tela cheia
- Navegação por abas

### Tablet

- Layout intermediário
- 2 colunas quando possível
- Melhor uso do espaço

## Próximos Passos

1. Criar wireframes detalhados no Figma
2. Prototipar interações
3. Testar com enfermeiros
4. Iterar baseado em feedback
5. Implementar no frontend (Next.js)
