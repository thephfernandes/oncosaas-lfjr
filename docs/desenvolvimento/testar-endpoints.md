# Como Testar os Endpoints da API

## 🔐 Autenticação

### 1. Login

**Endpoint**: `POST http://localhost:3002/api/v1/auth/login`

**Body (JSON)**:

```json
{
  "email": "admin@hospitalteste.com",
  "password": "senha123"
}
```

**Resposta esperada**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@hospitalteste.com",
    "name": "Admin User",
    "role": "ADMIN",
    "tenantId": "...",
    "tenant": {
      "id": "...",
      "name": "Hospital Teste"
    }
  }
}
```

### 2. Register

**Endpoint**: `POST http://localhost:3002/api/v1/auth/register`

**Body (JSON)**:

```json
{
  "email": "novo@hospitalteste.com",
  "password": "senha123",
  "name": "Novo Usuário",
  "role": "NURSE",
  "tenantId": "tenant-id-aqui"
}
```

---

## 👥 Pacientes

### Listar Pacientes

**Endpoint**: `GET http://localhost:3002/api/v1/patients`

**Headers**:

```
Authorization: Bearer {access_token}
X-Tenant-Id: {tenant-id}
```

**Resposta esperada**:

```json
{
  "data": [
    {
      "id": "...",
      "name": "Ana Paula Costa",
      "cancerType": "breast",
      "stage": "IIIA",
      "status": "IN_TREATMENT",
      "priority": "HIGH",
      "priorityScore": 75
    }
  ]
}
```

### Obter Paciente por ID

**Endpoint**: `GET http://localhost:3002/api/v1/patients/{id}`

**Headers**: Mesmos do listar

---

## 💬 Mensagens

### Listar Mensagens

**Endpoint**: `GET http://localhost:3002/api/v1/messages`

**Headers**: Mesmos do pacientes

**Query Parameters**:

- `patientId` (opcional): Filtrar por paciente
- `status` (opcional): `PENDING`, `PROCESSED`, `ERROR`

### Contar Mensagens Não Assumidas

**Endpoint**: `GET http://localhost:3002/api/v1/messages/unassumed/count`

---

## 🚨 Alertas

### Listar Alertas

**Endpoint**: `GET http://localhost:3002/api/v1/alerts`

**Headers**: Mesmos do pacientes

**Query Parameters**:

- `status` (opcional): `ACTIVE`, `RESOLVED`, `DISMISSED`
- `severity` (opcional): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `patientId` (opcional): Filtrar por paciente

### Criar Alerta

**Endpoint**: `POST http://localhost:3002/api/v1/alerts`

**Body (JSON)**:

```json
{
  "patientId": "patient-id",
  "type": "SYMPTOM",
  "severity": "HIGH",
  "title": "Febre alta",
  "description": "Paciente relatou febre de 39°C",
  "source": "WHATSAPP"
}
```

---

## 🧪 Usuários de Teste (Seed Data)

Após executar `npm run prisma:seed`, você terá:

| Email                           | Senha      | Role        |
| ------------------------------- | ---------- | ----------- |
| `admin@hospitalteste.com`       | `senha123` | ADMIN       |
| `oncologista@hospitalteste.com` | `senha123` | ONCOLOGIST  |
| `enfermeira@hospitalteste.com`  | `senha123` | NURSE       |
| `coordenador@hospitalteste.com` | `senha123` | COORDINATOR |

**⚠️ IMPORTANTE**: Todos os usuários de teste usam a mesma senha: `senha123`

**Tenant ID**: Use o ID do tenant criado no seed (verificar no Prisma Studio)

---

## 📝 Exemplo com cURL

### Login:

```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospitalteste.com",
    "password": "senha123"
  }'
```

### Listar Pacientes:

```bash
curl -X GET http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Tenant-Id: {tenant-id}"
```

---

## 🛠️ Ferramentas Recomendadas

- **Postman**: Importar collection de endpoints
- **Insomnia**: Similar ao Postman
- **Thunder Client** (VSCode): Extensão para testar APIs diretamente no editor
- **cURL**: Linha de comando

---

## ⚠️ Erros Comuns

### 401 Unauthorized

- Verificar se o token JWT está correto
- Verificar se o token não expirou (24h por padrão)

### 403 Forbidden

- Verificar se o `X-Tenant-Id` está correto
- Verificar se o usuário tem permissão (role) para a ação

### 404 Not Found

- Verificar se o método HTTP está correto (GET vs POST)
- Verificar se a URL está correta (`/api/v1/...`)
- Verificar se o servidor está rodando (`npm run start:dev`)

### 500 Internal Server Error

- Verificar logs do servidor
- Verificar se o banco de dados está rodando (`docker-compose up -d`)
- Verificar se as migrations foram aplicadas (`npm run prisma:migrate`)
