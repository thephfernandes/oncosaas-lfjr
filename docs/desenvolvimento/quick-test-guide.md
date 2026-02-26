# Guia Rápido de Testes da API

## ✅ Login Funcionando!

O login está funcionando corretamente. Use este guia para testar todos os endpoints.

---

## 🔐 Passo 1: Fazer Login

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospitalteste.com",
    "password": "senha123"
  }'
```

**Resposta**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@hospitalteste.com",
    "name": "Administrador",
    "role": "ADMIN",
    "tenantId": "bae0e239-a98e-48dc-b12f-e90bdec6ad81"
  }
}
```

**Salve o `access_token` e o `tenantId` para usar nas próximas requisições!**

---

## 👥 Passo 2: Listar Pacientes

```bash
curl -X GET http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}"
```

**Substitua**:

- `{access_token}` pelo token recebido no login
- `{tenantId}` pelo tenantId do usuário (ex: `bae0e239-a98e-48dc-b12f-e90bdec6ad81`)

**Exemplo completo**:

```bash
curl -X GET http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ODdlZGM3OC1kNjU0LTQ0MzktYjk1My1kMWRiMmI0YjVlNjMiLCJlbWFpbCI6ImFkbWluQGhvc3BpdGFsdGVzdGUuY29tIiwidGVuYW50SWQiOiJiYWUwZTIzOS1hOThlLTQ4ZGMtYjEyZi1lOTBiZGVjNmFkODEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjI5ODk4NTEsImV4cCI6MTc2MzA3NjI1MX0.Z7-A6SG3IEbwUoKtoiOXt1Rtoz-v6C4buty8Gtc8bXw" \
  -H "X-Tenant-Id: bae0e239-a98e-48dc-b12f-e90bdec6ad81"
```

---

## 💬 Passo 3: Listar Mensagens

```bash
curl -X GET http://localhost:3002/api/v1/messages \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}"
```

**Query Parameters opcionais**:

- `?patientId={id}` - Filtrar por paciente
- `?status=PENDING` - Filtrar por status

---

## 🚨 Passo 4: Listar Alertas

```bash
curl -X GET http://localhost:3002/api/v1/alerts \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}"
```

**Query Parameters opcionais**:

- `?status=ACTIVE` - Filtrar por status
- `?severity=CRITICAL` - Filtrar por severidade
- `?patientId={id}` - Filtrar por paciente

---

## 📊 Passo 5: Contar Mensagens Não Assumidas

```bash
curl -X GET http://localhost:3002/api/v1/messages/unassumed/count \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}"
```

---

## 🔍 Passo 6: Obter Paciente por ID

```bash
curl -X GET http://localhost:3002/api/v1/patients/{patient-id} \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}"
```

**Para obter o ID de um paciente**, primeiro liste os pacientes (Passo 2) e copie o `id` de um deles.

---

## 📊 Passo 7: Criar Observação Clínica (FHIR)

```bash
curl -X POST http://localhost:3002/api/v1/observations \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "{patient-id}",
    "code": "72514-3",
    "display": "Pain severity",
    "valueQuantity": 7,
    "unit": "/10",
    "effectiveDateTime": "2025-01-12T10:30:00Z",
    "status": "final"
  }'
```

**LOINC Codes comuns**:

- `72514-3`: Pain severity (0-10)
- `39156-5`: Body mass index (BMI)
- `8480-6`: Systolic blood pressure
- `8462-4`: Diastolic blood pressure
- `8867-4`: Heart rate

**Listar observações não sincronizadas com EHR**:

```bash
curl -X GET http://localhost:3002/api/v1/observations/unsynced \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}"
```

**Marcar observação como sincronizada**:

```bash
curl -X PATCH http://localhost:3002/api/v1/observations/{observation-id}/sync \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}" \
  -H "Content-Type: application/json" \
  -d '{
    "fhirResourceId": "fhir-resource-id-123"
  }'
```

---

## 🆕 Passo 8: Criar Novo Paciente

```bash
curl -X POST http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "birthDate": "1980-01-15",
    "gender": "male",
    "phone": "+5511999999999",
    "email": "joao.silva@email.com",
    "cancerType": "prostate",
    "stage": "II",
    "currentStage": "TREATMENT",
    "status": "IN_TREATMENT"
  }'
```

---

## 🚨 Passo 9: Criar Alerta

```bash
curl -X POST http://localhost:3002/api/v1/alerts \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenantId}" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "{patient-id}",
    "type": "SYMPTOM",
    "severity": "HIGH",
    "title": "Febre alta",
    "description": "Paciente reportou febre de 39°C",
    "source": "WHATSAPP"
  }'
```

---

## 📝 Variáveis de Ambiente para Scripts

Para facilitar os testes, você pode criar variáveis:

```bash
# Após fazer login, salve o token e tenantId
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export TENANT_ID="bae0e239-a98e-48dc-b12f-e90bdec6ad81"

# Agora use nas requisições:
curl -X GET http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

---

## 🛠️ Ferramentas Recomendadas

### Postman

1. Importar collection de endpoints
2. Configurar variáveis de ambiente (`access_token`, `tenant_id`)
3. Testar todos os endpoints facilmente

### Insomnia

Similar ao Postman, com interface moderna

### Thunder Client (VSCode)

Extensão para testar APIs diretamente no editor

---

## ⚠️ Erros Comuns

### 401 Unauthorized

- Token expirado (válido por 24h)
- Token inválido ou malformado
- **Solução**: Fazer login novamente

### 403 Forbidden

- `X-Tenant-Id` incorreto ou ausente
- Usuário não tem permissão (role) para a ação
- **Solução**: Verificar headers e role do usuário

### 404 Not Found

- URL incorreta
- Método HTTP errado (GET vs POST)
- **Solução**: Verificar URL e método

### 500 Internal Server Error

- Erro no servidor
- Banco de dados não conectado
- **Solução**: Verificar logs do servidor e conexão com DB

---

## ✅ Checklist de Testes

- [ ] Login funcionando
- [ ] Listar pacientes
- [ ] Obter paciente por ID
- [ ] Criar novo paciente
- [ ] Listar mensagens
- [ ] Contar mensagens não assumidas
- [ ] Listar alertas
- [ ] Criar alerta
- [ ] Criar observação clínica (FHIR)
- [ ] Listar observações não sincronizadas
- [ ] Marcar observação como sincronizada
- [ ] Atualizar paciente (PATCH)
- [ ] Deletar paciente (DELETE)

---

## 🎯 Próximos Passos

Após validar todos os endpoints:

1. **Criar módulo de Observations** (FHIR-compliant)
2. **Desenvolver frontend dashboard** conectado ao backend
3. **Implementar autenticação no frontend**
4. **Integrar WebSocket** para atualizações em tempo real
