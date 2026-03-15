#!/bin/bash

# Script de teste da API ONCONAV
# Uso: ./scripts/test-api.sh

BASE_URL="http://localhost:3002/api/v1"
TENANT_ID=""
ACCESS_TOKEN=""

echo "🧪 Testando API ONCONAV"
echo "========================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer login e obter token
login() {
  echo "🔐 Testando Login..."
  RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@hospitalteste.com",
      "password": "senha123"
    }')
  
  ACCESS_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  TENANT_ID=$(echo $RESPONSE | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Login falhou${NC}"
    echo "Resposta: $RESPONSE"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Login bem-sucedido${NC}"
  echo "Token: ${ACCESS_TOKEN:0:50}..."
  echo "Tenant ID: $TENANT_ID"
  echo ""
}

# Função para testar endpoint
test_endpoint() {
  local METHOD=$1
  local ENDPOINT=$2
  local DATA=$3
  local DESCRIPTION=$4
  
  echo "📡 Testando: $DESCRIPTION"
  echo "   $METHOD $ENDPOINT"
  
  if [ -z "$DATA" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "$BASE_URL$ENDPOINT" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "X-Tenant-Id: $TENANT_ID")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "$BASE_URL$ENDPOINT" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "X-Tenant-Id: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "$DATA")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}✅ Sucesso (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  else
    echo -e "${RED}❌ Erro (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
  fi
  echo ""
}

# Executar testes
login

echo "📋 Testando Endpoints..."
echo ""

# Teste 1: Listar pacientes
test_endpoint "GET" "/patients" "" "Listar Pacientes"

# Teste 2: Obter primeiro paciente (se existir)
PATIENT_ID=$(curl -s -X GET "$BASE_URL/patients" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID" | jq -r '.[0].id' 2>/dev/null)

if [ -n "$PATIENT_ID" ] && [ "$PATIENT_ID" != "null" ]; then
  test_endpoint "GET" "/patients/$PATIENT_ID" "" "Obter Paciente por ID"
  
  # Teste 3: Criar observação para o paciente
  OBSERVATION_DATA="{
    \"patientId\": \"$PATIENT_ID\",
    \"code\": \"72514-3\",
    \"display\": \"Pain severity\",
    \"valueQuantity\": 7,
    \"unit\": \"/10\",
    \"effectiveDateTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"status\": \"final\"
  }"
  test_endpoint "POST" "/observations" "$OBSERVATION_DATA" "Criar Observação Clínica"
  
  # Teste 4: Listar observações
  test_endpoint "GET" "/observations?patientId=$PATIENT_ID" "" "Listar Observações do Paciente"
  
  # Teste 5: Listar observações não sincronizadas
  test_endpoint "GET" "/observations/unsynced" "" "Listar Observações Não Sincronizadas"
  
  # Teste 6: Criar alerta para o paciente
  ALERT_DATA="{
    \"patientId\": \"$PATIENT_ID\",
    \"type\": \"CRITICAL_SYMPTOM\",
    \"severity\": \"HIGH\",
    \"message\": \"Teste de alerta - febre alta\",
    \"context\": {
      \"symptoms\": [\"febre\", \"mal-estar\"],
      \"temperature\": 38.5
    }
  }"
  test_endpoint "POST" "/alerts" "$ALERT_DATA" "Criar Alerta"
else
  echo -e "${YELLOW}⚠️  Nenhum paciente encontrado. Pulando testes que dependem de paciente.${NC}"
  echo ""
fi

# Teste 7: Listar mensagens
test_endpoint "GET" "/messages" "" "Listar Mensagens"

# Teste 8: Contar mensagens não assumidas
test_endpoint "GET" "/messages/unassumed/count" "" "Contar Mensagens Não Assumidas"

# Teste 9: Listar alertas
test_endpoint "GET" "/alerts" "" "Listar Alertas"

# Teste 10: Health check
test_endpoint "GET" "/health" "" "Health Check"

echo "========================"
echo -e "${GREEN}✅ Testes concluídos!${NC}"

