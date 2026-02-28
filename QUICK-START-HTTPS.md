# ⚡ Início Rápido - HTTPS para Embedded Signup

## ✅ Checklist de Configuração

- [x] Certificados SSL gerados em `certs/`
- [x] Variáveis de ambiente atualizadas para HTTPS
- [x] Scripts npm configurados
- [ ] Certificado instalado no Windows (próximo passo)
- [ ] Meta App configurado com URLs HTTPS
- [ ] Servidores iniciados com HTTPS

## 🚀 Passos Finais

### 1. Instalar Certificado no Windows

**PowerShell (como Administrador):**

```powershell
Import-Certificate -FilePath ".\certs\localhost.crt" -CertStoreLocation Cert:\CurrentUser\Root
```

Ou via interface gráfica:

1. Duplo clique em `certs/localhost.crt`
2. Instalar → Usuário Atual → Autoridades de Certificação Raiz Confiáveis

### 2. Configurar Meta App

Acesse: https://developers.facebook.com/apps/980766987152980/settings/basic/

**App Domains:**

```
localhost
```

**Website:**

```
https://localhost:3000
```

**Valid OAuth Redirect URIs:**

```
https://localhost:3000/dashboard/integrations
https://localhost:3002/api/v1/whatsapp-connections/oauth/callback
```

### 3. Iniciar Servidores

```bash
npm run dev:https
```

### 4. Acessar e Testar

- Frontend: **https://localhost:3000**
- Backend: **https://localhost:3002**

⚠️ O navegador mostrará um aviso. Clique em **"Avançado" → "Continuar para localhost"**.

### 5. Testar Embedded Signup

1. Acesse: https://localhost:3000/dashboard/integrations
2. Clique em "Conectar com Meta (Embedded Signup)"
3. O popup do Facebook deve abrir **sem erros de HTTPS** ✅

## 📝 Arquivos Modificados

- ✅ `frontend/.env.local` - URLs atualizadas para HTTPS
- ✅ `backend/.env` - URLs atualizadas para HTTPS + `USE_HTTPS=true`
- ✅ `.env` - URLs atualizadas para HTTPS
- ✅ `frontend/server.js` - Servidor HTTPS customizado
- ✅ `backend/src/main.ts` - Suporte a HTTPS
- ✅ `package.json` - Scripts `dev:https` e `generate-certs`

## 🔍 Verificação

Execute para verificar se tudo está configurado:

```bash
# Verificar certificados
ls certs/

# Verificar variáveis de ambiente
cat frontend/.env.local | grep HTTPS
cat backend/.env | grep HTTPS
```

## ❓ Problemas?

Consulte: [`docs/desenvolvimento/https-setup.md`](docs/desenvolvimento/https-setup.md)
