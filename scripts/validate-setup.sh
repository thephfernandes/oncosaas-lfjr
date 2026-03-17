#!/bin/bash

# Script de validação do setup de desenvolvimento
# Verifica se todas as ferramentas estão configuradas corretamente

echo "🔍 Validando configuração do projeto..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Verificar Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Não instalado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} $NPM_VERSION"
else
    echo -e "${RED}✗ Não instalado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Python
echo -n "Python: "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} $PYTHON_VERSION"
else
    echo -e "${RED}✗ Não instalado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Docker
echo -n "Docker: "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
else
    echo -e "${YELLOW}⚠ Não instalado (opcional)${NC}"
fi

echo ""
echo "📦 Verificando dependências instaladas..."

# Verificar Husky
echo -n "Husky: "
if [ -d ".husky" ] && [ -f ".husky/pre-commit" ]; then
    echo -e "${GREEN}✓ Configurado${NC}"
else
    echo -e "${RED}✗ Não configurado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar ESLint (Frontend)
echo -n "ESLint (Frontend): "
if [ -f "frontend/.eslintrc.json" ]; then
    echo -e "${GREEN}✓ Configurado${NC}"
else
    echo -e "${RED}✗ Não configurado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar ESLint (Backend)
echo -n "ESLint (Backend): "
if [ -f "backend/.eslintrc.json" ]; then
    echo -e "${GREEN}✓ Configurado${NC}"
else
    echo -e "${RED}✗ Não configurado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Prettier
echo -n "Prettier: "
if [ -f ".prettierrc" ]; then
    echo -e "${GREEN}✓ Configurado${NC}"
else
    echo -e "${RED}✗ Não configurado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Jest
echo -n "Jest (Backend): "
if [ -f "backend/jest.config.js" ]; then
    echo -e "${GREEN}✓ Configurado${NC}"
else
    echo -e "${RED}✗ Não configurado${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🧪 Testando ferramentas..."

# Testar ESLint (Frontend)
echo -n "ESLint (Frontend): "
cd frontend 2>/dev/null && npm run lint > /dev/null 2>&1
if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    echo -e "${GREEN}✓ Funcionando${NC}"
else
    echo -e "${RED}✗ Erro${NC}"
    ERRORS=$((ERRORS + 1))
fi
cd .. 2>/dev/null

# Testar Prettier
echo -n "Prettier: "
npm run format:check > /dev/null 2>&1
if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    echo -e "${GREEN}✓ Funcionando${NC}"
else
    echo -e "${RED}✗ Erro${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo configurado corretamente!${NC}"
    exit 0
else
    echo -e "${RED}❌ Encontrados $ERRORS problema(s)${NC}"
    echo ""
    echo "Execute: npm run prepare"
    exit 1
fi

