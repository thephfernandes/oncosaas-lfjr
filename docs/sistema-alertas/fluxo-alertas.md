# 🔄 Fluxo de Alertas - Diagrama Visual

## Fluxo Completo: Criação → Notificação → Resolução

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRIAÇÃO DE ALERTA                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ Agente de IA │    │ Scheduler        │    │ Manual/API   │
│ (WhatsApp)   │    │ (Navegação)      │    │              │
└──────────────┘    └──────────────────┘    └──────────────┘
        │                     │                     │
        │ Detecta sintoma     │ Verifica etapas     │ Admin cria
        │ crítico             │ atrasadas           │ alerta
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ AlertsService   │
                    │ .create()       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ 1. Validar       │
                    │    paciente      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ 2. CRIAR NO      │
                    │    BANCO PRIMEIRO│
                    │ (status: PENDING) │
                    │ (gera UUID)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ 3. EMITIR        │
                    │    WEBSOCKET     │
                    │ (usa alert criado)│
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ critical_    │    │ new_alert    │    │ open_alerts_ │
│ alert        │    │              │    │ count        │
│ (se CRITICAL)│    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Frontend         │
                    │ (useAlertsSocket)│
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Notificação  │    │ Atualizar    │    │ Atualizar    │
│ Navegador    │    │ Lista        │    │ Contador     │
│ (se CRITICAL)│    │ Alertas       │    │ Badge        │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Dashboard         │
                    │ (AlertsPanel)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Usuário vê       │
                    │ alerta           │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Reconhecer   │    │ Resolver     │    │ Descartar    │
│ (ACKNOWLEDGED)│   │ (RESOLVED)   │    │ (DISMISSED)  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ AlertsService    │
                    │ .update()        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Banco de Dados   │
                    │ (atualiza status)│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ WebSocket        │
                    │ alert_updated    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Frontend         │
                    │ (atualiza UI)    │
                    └──────────────────┘
```

---

## Fluxo Específico: Alerta de Sintoma Crítico

```
PACIENTE ENVIA MENSAGEM VIA WHATSAPP
              │
              ▼
    ┌─────────────────────┐
    │ Webhook WhatsApp     │
    │ Recebe mensagem      │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Backend processa     │
    │ mensagem             │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Chama AI Service     │
    │ (process_message)    │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Agente de IA         │
    │ Detecta sintomas     │
    │ críticos             │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Retorna:             │
    │ should_alert: true   │
    │ critical_symptoms:   │
    │ ['febre', 'dispneia']│
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Backend cria alerta  │
    │ AlertsService.create │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Salva no banco       │
    │ status: PENDING      │
    │ severity: CRITICAL   │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ WebSocket emite      │
    │ critical_alert       │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Frontend recebe      │
    │ (useAlertsSocket)    │
    └─────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
┌──────────┐  ┌──────────┐
│ Notifica │  │ Atualiza │
│ Navegador│  │ Lista    │
└──────────┘  └──────────┘
```

---

## Fluxo Específico: Alerta de Etapa Atrasada

```
SCHEDULER EXECUTA (6h DA MANHÃ)
              │
              ▼
    ┌─────────────────────┐
    │ Para cada tenant:    │
    │ checkOverdueSteps()  │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Busca etapas com:    │
    │ - dueDate < hoje     │
    │ - isCompleted = false│
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Para cada etapa:     │
    │ checkAndCreateAlert  │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Verifica se já       │
    │ existe alerta        │
    │ pendente             │
    └─────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
   ┌────────┐  ┌────────┐
   │ Existe │  │ Não    │
   │        │  │ existe │
   └────────┘  └────────┘
        │           │
        │           ▼
        │   ┌──────────────┐
        │   │ Cria alerta   │
        │   │ NAVIGATION_   │
        │   │ DELAY         │
        │   └──────────────┘
        │           │
        └───────────┘
              │
              ▼
    ┌─────────────────────┐
    │ WebSocket emite      │
    │ new_alert            │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Frontend atualiza    │
    │ lista de alertas     │
    └─────────────────────┘
```

---

## Estados e Transições

```
                    ┌─────────┐
                    │ CRIADO  │
                    │ PENDING │
                    └─────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Reconhecido  │  │ Resolvido    │  │ Descartado   │
│ ACKNOWLEDGED │  │ RESOLVED     │  │ DISMISSED    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                    ┌─────────┐
                    │ FIM     │
                    │ (não    │
                    │ aparece │
                    │ mais)   │
                    └─────────┘
```

**Transições permitidas**:

- `PENDING` → `ACKNOWLEDGED` (reconhecer)
- `PENDING` → `RESOLVED` (resolver direto)
- `PENDING` → `DISMISSED` (descartar)
- `ACKNOWLEDGED` → `RESOLVED` (resolver após reconhecer)
- `ACKNOWLEDGED` → `DISMISSED` (descartar após reconhecer)

---

## WebSocket Rooms e Isolamento

```
                    ┌──────────────┐
                    │ Cliente      │
                    │ Conecta      │
                    └──────────────┘
                         │
                         ▼
                    ┌──────────────┐
                    │ Autentica    │
                    │ (JWT)        │
                    └──────────────┘
                         │
                         ▼
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ tenant:      │  │ user:        │  │ patient:     │
│ ${tenantId}  │  │ ${userId}    │  │ ${patientId} │
│              │  │              │  │ :tenant:     │
│ Todos do     │  │ Notificações │  │ ${tenantId}  │
│ tenant       │  │ pessoais     │  │              │
│              │  │              │  │ Alertas      │
│              │  │              │  │ específicos  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Isolamento Multi-Tenant**:

- Cada tenant tem sua própria room
- Eventos são emitidos apenas para o tenant correto
- Clientes só recebem alertas do seu tenant

---

## Componentes Frontend e Interação

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard                            │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Critical     │  │ AlertsPanel  │  │ AlertDetails │
│ AlertsPanel  │  │              │  │              │
│              │  │ Lista todos  │  │ Detalhes     │
│ Topo da      │  │ os alertas   │  │ completos    │
│ página       │  │ pendentes    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                ┌──────────────┐
                │ useAlerts()   │
                │ useAlertsSocket│
                └──────────────┘
                         │
                         ▼
                ┌──────────────┐
                │ API Calls     │
                │ WebSocket     │
                └──────────────┘
```

---

## Permissões e Acesso

```
                    ┌──────────────┐
                    │ Usuário      │
                    │ (Role)       │
                    └──────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ADMIN        │  │ ONCOLOGIST   │  │ NURSE        │
│              │  │              │  │              │
│ ✅ Tudo      │  │ ✅ Ver       │  │ ✅ Ver       │
│ ✅ Criar     │  │ ✅ Reconhecer│  │ ✅ Reconhecer│
│ ✅ Resolver  │  │ ✅ Resolver  │  │ ✅ Resolver  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Resumo de Permissões**:

- **Ver alertas**: ADMIN, ONCOLOGIST, NURSE, COORDINATOR
- **Criar alertas**: ADMIN, COORDINATOR (sistema/AI)
- **Reconhecer/Resolver**: ADMIN, ONCOLOGIST, NURSE, COORDINATOR

---

📖 **Documentação completa**: [como-funcionam-alertas.md](./como-funcionam-alertas.md)
