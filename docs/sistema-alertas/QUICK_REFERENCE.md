# 🚨 Quick Reference - Sistema de Alertas

## Tipos de Alertas

| Tipo                  | Severidade Típica | Quando é Criado                               |
| --------------------- | ----------------- | --------------------------------------------- |
| `CRITICAL_SYMPTOM`    | CRITICAL          | Sintoma crítico detectado em mensagem         |
| `NAVIGATION_DELAY`    | HIGH/CRITICAL     | Etapa da jornada atrasada                     |
| `NO_RESPONSE`         | MEDIUM            | Paciente não responde há ≥3 dias              |
| `DELAYED_APPOINTMENT` | HIGH              | Consulta/exame não realizado                  |
| `SCORE_CHANGE`        | MEDIUM            | Score de priorização mudou significativamente |
| `SYMPTOM_WORSENING`   | HIGH              | Sintomas pioraram rapidamente                 |
| `MISSING_EXAM`        | HIGH              | Exame necessário não realizado                |
| `STAGING_INCOMPLETE`  | HIGH              | Estadiamento incompleto                       |
| `TREATMENT_DELAY`     | CRITICAL          | Atraso no início do tratamento                |
| `FOLLOW_UP_OVERDUE`   | MEDIUM            | Seguimento atrasado                           |

---

## Estados do Alerta

```
PENDING → ACKNOWLEDGED → RESOLVED
    ↓
DISMISSED
```

- **PENDING**: Criado, aguardando ação
- **ACKNOWLEDGED**: Reconhecido pela equipe
- **RESOLVED**: Problema resolvido
- **DISMISSED**: Descartado (falso positivo)

---

## Como Criar Alerta

### Via API (Backend)

```typescript
await alertsService.create(
  {
    patientId: 'uuid',
    type: 'CRITICAL_SYMPTOM',
    severity: 'CRITICAL',
    message: 'Paciente relatou febre alta',
    context: { conversationId: '...', symptom: 'febre' },
  },
  tenantId
);
```

### Via Frontend

```typescript
const createAlert = useCreateAlert();
createAlert.mutate({
  patientId: 'uuid',
  type: 'CRITICAL_SYMPTOM',
  severity: 'CRITICAL',
  message: 'Mensagem do alerta',
  context: {},
});
```

---

## WebSocket Events

### Eventos Recebidos

- `critical_alert` - Alerta crítico criado
- `new_alert` - Qualquer alerta criado
- `alert_updated` - Status do alerta mudou
- `open_alerts_count` - Contagem de alertas abertos atualizada

### Exemplo de Uso

```typescript
const { socket } = useSocket('/alerts');

socket.on('critical_alert', (alert: Alert) => {
  // Notificar usuário
  showNotification(alert);
});
```

---

## Endpoints da API

| Método  | Endpoint                  | Descrição                                  |
| ------- | ------------------------- | ------------------------------------------ |
| `GET`   | `/alerts`                 | Listar alertas (filtro: `?status=PENDING`) |
| `GET`   | `/alerts/critical`        | Alertas críticos pendentes                 |
| `GET`   | `/alerts/open/count`      | Contagem de alertas abertos                |
| `GET`   | `/alerts/critical/count`  | Contagem de alertas críticos               |
| `GET`   | `/alerts/:id`             | Detalhes de um alerta                      |
| `POST`  | `/alerts`                 | Criar alerta                               |
| `PATCH` | `/alerts/:id`             | Atualizar alerta                           |
| `PATCH` | `/alerts/:id/acknowledge` | Reconhecer alerta                          |
| `PATCH` | `/alerts/:id/resolve`     | Resolver alerta                            |

---

## Hooks React (Frontend)

```typescript
// Listar alertas
const { data: alerts } = useAlerts('PENDING');

// Alertas críticos
const { data: criticalCount } = useCriticalAlertsCount();

// Ações
const acknowledgeAlert = useAcknowledgeAlert();
const resolveAlert = useResolveAlert();

// Usar
acknowledgeAlert.mutate(alertId);
resolveAlert.mutate(alertId);
```

---

## Criação Automática

### 1. Agente de IA (Mensagens WhatsApp)

- Detecta sintomas críticos
- Cria `CRITICAL_SYMPTOM` automaticamente

### 2. Scheduler (Navegação Oncológica)

- Executa diariamente às 6h
- Verifica etapas atrasadas
- Cria `NAVIGATION_DELAY` se etapa está atrasada

---

## Severidade por Tipo

| Severidade   | Quando Usar                                              |
| ------------ | -------------------------------------------------------- |
| **CRITICAL** | Sintomas críticos, atraso em tratamento, etapas críticas |
| **HIGH**     | Etapas importantes atrasadas, piora de sintomas          |
| **MEDIUM**   | Atrasos menores, mudanças de score                       |
| **LOW**      | Informativo, não urgente                                 |

---

## Componentes Frontend

- `AlertsPanel` - Lista todos os alertas pendentes
- `CriticalAlertsPanel` - Painel destacado para alertas críticos
- `AlertDetails` - Detalhes completos do alerta

---

## Regras Importantes

1. **Sempre incluir `tenantId`** em queries
2. **Verificar duplicatas** antes de criar alerta
3. **WebSocket isolado por tenant** (`tenant:${tenantId}`)
4. **Alertas críticos** emitem evento especial `critical_alert`
5. **Status inicial** sempre `PENDING`

---

📖 **Documentação completa**: [como-funcionam-alertas.md](./como-funcionam-alertas.md)
