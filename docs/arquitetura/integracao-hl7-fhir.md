# Integração HL7/FHIR - Especificação Técnica

## Visão Geral

Integração bidirecional com sistemas EHR/PMS usando padrões HL7 v2 e FHIR para sincronizar dados de pacientes e observações clínicas.

## HL7 v2 (MLLP)

### Mensagens Suportadas

#### ADT - Admit, Discharge, Transfer

**ADT^A04 (Registro de Paciente):**

- Usado quando novo paciente é registrado no EHR
- Sincronizar dados básicos do paciente

**ADT^A08 (Atualização de Informações do Paciente):**

- Usado quando dados do paciente são atualizados
- Sincronizar mudanças

**ADT^A31 (Atualização de Informações do Paciente):**

- Similar ao A08, mas mais completo

#### ORU - Observation Result

**ORU^R01 (Resultado de Observação):**

- Usado quando resultados de exames são disponibilizados
- Sincronizar exames, resultados de laboratório

#### MDM - Medical Document Management

**MDM^T02 (Documento Original):**

- Usado quando documentos são criados (relatórios, laudos)
- Sincronizar documentos

### Implementação MLLP

**Biblioteca**: `node-hl7` (Node.js) ou `hl7` (Python)

**Fluxo**:

1. Servidor MLLP escuta na porta configurada
2. Recebe mensagem HL7 v2
3. Parse da mensagem
4. Transformação para modelo interno
5. Sincronização com banco de dados
6. ACK de confirmação

**Exemplo de Mensagem ADT^A04**:

```
MSH|^~\&|EHR|Hospital|Sistema|Clinica|202401151030||ADT^A04|12345|P|2.5
PID|1||123456789||Silva^João^Maria||19800101|M|||Rua X, 123||||||||12345678901
PV1|1|I|ICU^101^1||||123456^Doutor^Oncologista|||||||||12345678901||V||12345678901
```

## FHIR (REST API)

### Recursos FHIR Suportados

#### Patient

**GET /Patient/{id}**

- Buscar dados do paciente

**PUT /Patient/{id}**

- Atualizar dados do paciente

**POST /Patient**

- Criar novo paciente (se necessário)

#### Observation

**POST /Observation**

- Enviar observações coletadas pelo agente WhatsApp
- Mapear dados estruturados para FHIR Observation

**GET /Observation?patient={patientId}**

- Buscar observações do paciente

#### Condition

**GET /Condition?patient={patientId}**

- Buscar condições/diagnósticos do paciente

#### Procedure

**GET /Procedure?patient={patientId}**

- Buscar procedimentos realizados

#### MedicationStatement

**GET /MedicationStatement?patient={patientId}**

- Buscar medicações em uso

### Mapeamento de Dados

#### Patient (EHR → Plataforma)

```typescript
// FHIR Patient → Internal Patient Model
function mapFHIRPatientToInternal(fhirPatient: fhir.Patient): Patient {
  return {
    name: fhirPatient.name?.[0]?.text || '',
    cpf: fhirPatient.identifier?.find(
      (id) => id.system === 'http://www.brazil.gov.br/cpf'
    )?.value,
    birthDate: fhirPatient.birthDate
      ? new Date(fhirPatient.birthDate)
      : undefined,
    phone: fhirPatient.telecom?.find((t) => t.system === 'phone')?.value || '',
    email: fhirPatient.telecom?.find((t) => t.system === 'email')?.value,
    ehrPatientId: fhirPatient.id,
  };
}
```

#### Observation (Plataforma → EHR)

```typescript
// Internal Observation → FHIR Observation
function mapInternalToFHIRObservation(obs: Observation): fhir.Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: obs.code,
          display: obs.display,
        },
      ],
    },
    subject: {
      reference: `Patient/${obs.patientId}`,
    },
    effectiveDateTime: obs.effectiveDateTime.toISOString(),
    valueQuantity: {
      value: obs.value,
      unit: obs.unit,
      system: 'http://unitsofmeasure.org',
    },
  };
}
```

### LOINC Codes para Observações

**Sintomas e Qualidade de Vida:**

- `72514-3`: Pain severity (0-10)
- `8331-1`: Nausea severity
- `8332-9`: Vomiting severity
- `8333-7`: Fatigue severity
- `72522-6`: Dyspnea severity
- `72523-4`: Appetite assessment

**EORTC QLQ-C30:**

- Múltiplos códigos LOINC para cada domínio
- Mapear scores de questionários para Observations individuais

**PRO-CTCAE:**

- Códigos específicos para cada sintoma relacionado ao tratamento

### Sincronização Bidirecional

#### Pull (EHR → Plataforma)

**Cron Job**: Executar a cada 1 hora

1. Buscar pacientes atualizados desde última sincronização
2. Buscar novas observações (exames, resultados)
3. Atualizar banco de dados interno
4. Atualizar scores de priorização

**Webhook**: (se EHR suportar)

- Receber notificações em tempo real de mudanças
- Sincronizar imediatamente

#### Push (Plataforma → EHR)

**Em tempo real**:

1. Agente WhatsApp coleta dados
2. Extrai dados estruturados
3. Cria FHIR Observation
4. POST para FHIR server do EHR
5. Aguarda confirmação

**Batch** (fallback):

- Se push falhar, agendar para batch posterior
- Tentar novamente em 5, 15, 60 minutos

### Autenticação FHIR

**Métodos Suportados**:

- OAuth 2.0 (preferencial)
- Basic Auth (se necessário)
- API Key (se necessário)

**Token Management**:

- Refresh token automático
- Cache de tokens (Redis)
- Retry com refresh se token expirar

### Tratamento de Erros

**Erros Comuns**:

- `404 Not Found`: Paciente não existe no EHR (criar se necessário)
- `409 Conflict`: Recurso já existe (atualizar)
- `401 Unauthorized`: Token expirado (refresh)
- `503 Service Unavailable`: EHR offline (retry depois)

**Estratégia**:

- Retry com exponential backoff
- Dead letter queue para falhas persistentes
- Alertas para erros críticos

## Serviço de Integração

### Arquitetura

```
[EHR System]
    ↓ HL7 v2 MLLP
[MLLP Listener]
    ↓
[HL7 Parser]
    ↓
[Data Transformer]
    ↓
[Database]
    ↓
[FHIR Client]
    ↓ FHIR REST
[EHR System]
```

### Componentes

1. **MLLP Listener**: Escuta mensagens HL7 v2
2. **HL7 Parser**: Parse de mensagens HL7
3. **Data Transformer**: Conversão HL7 → Internal Model → FHIR
4. **FHIR Client**: Cliente HTTP para FHIR API
5. **Sync Scheduler**: Cron jobs para sincronização periódica
6. **Error Handler**: Tratamento de erros e retry

### Configuração por Tenant

```typescript
interface IntegrationConfig {
  tenantId: string;
  ehrSystem: string; // 'epic', 'cerner', 'tasy', 'custom'

  // HL7 v2
  hl7Enabled: boolean;
  hl7MllpHost?: string;
  hl7MllpPort?: number;

  // FHIR
  fhirEnabled: boolean;
  fhirBaseUrl?: string;
  fhirAuthType: 'oauth2' | 'basic' | 'apikey';
  fhirAuthConfig: {
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
    apiKey?: string;
  };

  // Sync
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  syncDirection: 'pull' | 'push' | 'bidirectional';
}
```

## Segurança

### Comunicação

- **HL7 MLLP**: TLS obrigatório
- **FHIR REST**: HTTPS obrigatório (TLS 1.3)

### Validação

- Validar todas as mensagens recebidas
- Sanitizar dados antes de inserir no banco
- Validar FHIR resources antes de enviar

### Logs

- Log de todas as mensagens recebidas/enviadas
- Log de erros de sincronização
- Retenção: 5 anos (LGPD)

## Próximos Passos

1. Implementar MLLP listener básico
2. Implementar parser HL7 v2
3. Implementar cliente FHIR
4. Criar serviço de transformação
5. Testes com EHRs de desenvolvimento
