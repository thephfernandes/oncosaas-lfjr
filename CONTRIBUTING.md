# Guia de Contribuição

## Como Contribuir

### 1. Setup do Ambiente

Siga o guia em `docs/desenvolvimento/setup-desenvolvimento.md`

### 2. Estrutura de Branches

- `main`: Produção
- `develop`: Desenvolvimento
- `feature/*`: Novas features
- `fix/*`: Correções de bugs
- `docs/*`: Documentação

### 3. Commits

Use mensagens claras e descritivas:

```
feat: adiciona endpoint de priorização de pacientes
fix: corrige bug na detecção de sintomas críticos
docs: atualiza documentação da API
```

### 4. Pull Requests

- Crie PRs para `develop`
- Descreva claramente as mudanças
- Inclua testes quando aplicável
- Atualize documentação se necessário

## Padrões de Código

### Frontend (TypeScript/React)

- Use TypeScript strict mode
- Componentes funcionais com hooks
- Nomes de componentes em PascalCase
- Pastas em lowercase com hífens

### Backend (NestJS/TypeScript)

- Seguir padrões NestJS (modules, services, controllers)
- DTOs para validação de entrada
- Guards para autenticação/autorização
- Interceptors para logging

### AI Service (Python)

- Type hints obrigatórios
- Docstrings em todas as funções
- Seguir PEP 8
- Testes unitários com pytest

## Testes

- Frontend: Jest + React Testing Library
- Backend: Jest
- AI Service: pytest

Execute testes antes de fazer PR:

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test

# AI Service
cd ai-service && pytest
```
