# Estrutura de Dados - Plataforma Oncológica

## Modelo de Dados Principal

### Core Entities

#### Tenant (Hospital/Clínica)

```typescript
interface Tenant {
  id: string; // UUID
  name: string;
  schemaName: string; // nome do schema PostgreSQL
  settings: {
    features: string[];
    integrations: IntegrationConfig[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Patient (Paciente)

```typescript
interface Patient {
  id: string; // UUID
  tenantId: string;
  // Dados básicos (do EHR)
  name: string;
  cpf?: string;
  birthDate: Date;
  phone: string; // WhatsApp
  email?: string;

  // Dados oncológicos
  cancerType: string;
  stage: string; // TNM ou estágio
  diagnosisDate: Date;
  performanceStatus?: number; // ECOG, Karnofsky

  // Jornada
  currentStage: 'rastreio' | 'diagnostico' | 'tratamento' | 'seguimento';
  currentSpecialty?: string; // oncologia, cirurgia, radioterapia

  // Priorização
  priorityScore: number; // 0-100 (calculado pelo modelo)
  priorityCategory: 'critico' | 'alto' | 'medio' | 'baixo';
  priorityReason?: string; // explicação do score

  // Integração EHR
  ehrPatientId?: string; // ID no sistema externo
  lastSyncAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

#### Conversation (Conversa WhatsApp)

```typescript
interface Conversation {
  id: string; // UUID
  tenantId: string;
  patientId: string;
  whatsappMessageId: string; // ID da mensagem no WhatsApp
  type: 'text' | 'audio' | 'image';
  direction: 'inbound' | 'outbound';
  content: string; // texto ou transcrição do áudio
  audioUrl?: string; // URL do áudio (S3)

  // Processamento IA
  processedBy: 'agent' | 'nursing'; // quem processou
  structuredData?: {
    symptoms: Symptom[];
    scales: {
      eortc?: number;
      proctcae?: number;
      esas?: number;
    };
  };

  // Detecção de urgência
  criticalSymptomsDetected?: string[];
  alertTriggered: boolean;

  timestamp: Date;
  createdAt: Date;
}
```

#### Alert (Alerta)

```typescript
interface Alert {
  id: string; // UUID
  tenantId: string;
  patientId: string;
  type:
    | 'critical_symptom'
    | 'no_response'
    | 'delayed_appointment'
    | 'score_change';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  context?: {
    conversationId?: string;
    symptom?: string;
    previousScore?: number;
    currentScore?: number;
  };

  // Status
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string; // userId
  acknowledgedAt?: Date;
  resolvedAt?: Date;

  createdAt: Date;
}
```

#### PatientJourney (Jornada do Paciente)

```typescript
interface PatientJourney {
  id: string; // UUID
  tenantId: string;
  patientId: string;

  // Rastreio
  screeningDate?: Date;
  screeningResult?: string;

  // Diagnóstico
  diagnosisDate?: Date;
  diagnosisConfirmed: boolean;
  pathologyReport?: string;
  stagingDate?: Date;

  // Tratamento
  treatmentStartDate?: Date;
  treatmentType?: 'quimioterapia' | 'radioterapia' | 'cirurgia' | 'combinado';
  treatmentProtocol?: string;
  currentCycle?: number;
  totalCycles?: number;

  // Seguimento
  lastFollowUpDate?: Date;
  nextFollowUpDate?: Date;

  // Navegação
  currentStep: string; // etapa atual
  nextStep?: string; // próxima etapa
  blockers?: string[]; // bloqueios/atrasos

  updatedAt: Date;
}
```

#### Observation (Dados Estruturados - FHIR)

```typescript
interface Observation {
  id: string; // UUID
  tenantId: string;
  patientId: string;
  conversationId?: string; // origem da observação

  // FHIR Resource
  code: string; // LOINC code
  display: string; // descrição legível
  value: number | string; // valor
  unit?: string;

  // Metadados
  effectiveDateTime: Date; // quando foi coletado
  status: 'final';

  // Para FHIR
  fhirResourceId?: string; // ID no FHIR server
  syncedToEHR: boolean;
  syncedAt?: Date;
}
```

### Relacionamentos

```
Tenant
  ├─→ Patient (1:N)
  │   ├─→ Conversation (1:N)
  │   ├─→ Alert (1:N)
  │   ├─→ PatientJourney (1:1)
  │   └─→ Observation (1:N)
```

## Schema PostgreSQL

### Schema por Tenant

```sql
-- Schema: tenant_{tenant_id}

CREATE SCHEMA tenant_hospital_1;

-- Tabela de Pacientes
CREATE TABLE tenant_hospital_1.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11),
  birth_date DATE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),

  -- Dados oncológicos
  cancer_type VARCHAR(100),
  stage VARCHAR(50),
  diagnosis_date DATE,
  performance_status INTEGER,

  -- Jornada
  current_stage VARCHAR(50),
  current_specialty VARCHAR(100),

  -- Priorização
  priority_score INTEGER DEFAULT 0,
  priority_category VARCHAR(20),
  priority_reason TEXT,

  -- EHR
  ehr_patient_id VARCHAR(255),
  last_sync_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_patients_tenant ON tenant_hospital_1.patients(tenant_id);
CREATE INDEX idx_patients_priority ON tenant_hospital_1.patients(priority_score DESC);
CREATE INDEX idx_patients_stage ON tenant_hospital_1.patients(current_stage);
CREATE INDEX idx_patients_ehr_id ON tenant_hospital_1.patients(ehr_patient_id);

-- Tabela de Conversas
CREATE TABLE tenant_hospital_1.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id),
  patient_id UUID NOT NULL REFERENCES tenant_hospital_1.patients(id),
  whatsapp_message_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,

  processed_by VARCHAR(20),
  structured_data JSONB,
  critical_symptoms_detected TEXT[],
  alert_triggered BOOLEAN DEFAULT FALSE,

  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_patient ON tenant_hospital_1.conversations(patient_id);
CREATE INDEX idx_conversations_timestamp ON tenant_hospital_1.conversations(timestamp DESC);
CREATE INDEX idx_conversations_alert ON tenant_hospital_1.conversations(alert_triggered) WHERE alert_triggered = TRUE;

-- Tabela de Alertas
CREATE TABLE tenant_hospital_1.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id),
  patient_id UUID NOT NULL REFERENCES tenant_hospital_1.patients(id),
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  context JSONB,

  status VARCHAR(20) DEFAULT 'pending',
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_status ON tenant_hospital_1.alerts(status) WHERE status = 'pending';
CREATE INDEX idx_alerts_patient ON tenant_hospital_1.alerts(patient_id);
CREATE INDEX idx_alerts_severity ON tenant_hospital_1.alerts(severity, created_at DESC);

-- Tabela de Jornada
CREATE TABLE tenant_hospital_1.patient_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id),
  patient_id UUID NOT NULL UNIQUE REFERENCES tenant_hospital_1.patients(id),

  screening_date DATE,
  screening_result TEXT,
  diagnosis_date DATE,
  diagnosis_confirmed BOOLEAN DEFAULT FALSE,
  pathology_report TEXT,
  staging_date DATE,

  treatment_start_date DATE,
  treatment_type VARCHAR(50),
  treatment_protocol TEXT,
  current_cycle INTEGER,
  total_cycles INTEGER,

  last_follow_up_date DATE,
  next_follow_up_date DATE,

  current_step VARCHAR(100),
  next_step VARCHAR(100),
  blockers TEXT[],

  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Observações (FHIR)
CREATE TABLE tenant_hospital_1.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES shared.tenants(id),
  patient_id UUID NOT NULL REFERENCES tenant_hospital_1.patients(id),
  conversation_id UUID REFERENCES tenant_hospital_1.conversations(id),

  code VARCHAR(50) NOT NULL, -- LOINC
  display VARCHAR(255) NOT NULL,
  value NUMERIC,
  value_string TEXT,
  unit VARCHAR(50),

  effective_date_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'final',

  fhir_resource_id VARCHAR(255),
  synced_to_ehr BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_observations_patient ON tenant_hospital_1.observations(patient_id);
CREATE INDEX idx_observations_code ON tenant_hospital_1.observations(code);
CREATE INDEX idx_observations_sync ON tenant_hospital_1.observations(synced_to_ehr) WHERE synced_to_ehr = FALSE;
```

## Integração com FHIR

### Mapeamento de Dados

**Patient → FHIR Patient Resource:**

```json
{
  "resourceType": "Patient",
  "id": "patient-123",
  "identifier": [
    {
      "system": "http://hospital.com/patients",
      "value": "ehr-patient-id"
    }
  ],
  "name": [{ "text": "Nome do Paciente" }],
  "telecom": [{ "system": "phone", "value": "+5511999999999" }],
  "birthDate": "1980-01-01"
}
```

**Conversation → FHIR Observation Resource:**

```json
{
  "resourceType": "Observation",
  "id": "obs-123",
  "status": "final",
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "72514-3", // Pain severity
        "display": "Pain severity"
      }
    ]
  },
  "subject": {
    "reference": "Patient/patient-123"
  },
  "effectiveDateTime": "2024-01-15T10:30:00Z",
  "valueQuantity": {
    "value": 7,
    "unit": "score",
    "system": "http://unitsofmeasure.org"
  }
}
```

## Criptografia de Dados Sensíveis

### Campos Criptografados

- `patients.cpf` (CPF)
- `patients.phone` (telefone)
- `conversations.content` (conteúdo de conversas)
- `conversations.audio_url` (URL de áudios)

### Implementação

- Usar PostgreSQL `pgcrypto` extension
- Criptografia AES-256
- Chave mestra por tenant (rotacionada periodicamente)

```sql
-- Exemplo
CREATE EXTENSION pgcrypto;

-- Criptografar
UPDATE patients SET cpf = pgp_sym_encrypt(cpf, 'encryption_key');

-- Descriptografar
SELECT pgp_sym_decrypt(cpf, 'encryption_key') FROM patients;
```

## Auditoria

### Tabela de Logs de Auditoria

```sql
CREATE TABLE tenant_hospital_1.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW
  resource_type VARCHAR(50) NOT NULL, -- patient, conversation, alert
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON tenant_hospital_1.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON tenant_hospital_1.audit_logs(resource_type, resource_id);
```

**Retenção**: 5 anos (LGPD)

## Backup e Disaster Recovery

### Estratégia

- **Backup Incremental**: Diário (RDS automated backups)
- **Backup Completo**: Semanal
- **Georedundância**: Backup em múltiplas regiões AWS
- **Teste de Restore**: Mensal
- **Retenção**: 7 anos (compliance)

### Backup de Conversas WhatsApp

- Conversas armazenadas em S3 (criptografadas)
- Versionamento habilitado
- Lifecycle policy: mover para Glacier após 90 dias
