# 🚀 Configuração HTTPS para Embedded Signup

## ⚡ Início Rápido

### 1. Gerar Certificados SSL

```bash
npm run generate-certs
```

### 2. Instalar Certificado no Windows

**Opção A - Interface Gráfica:**

1. Abra `certs/localhost.crt` (duplo clique)
2. Clique em "Instalar Certificado"
3. Selecione "Usuário Atual"
4. Selecione "Colocar todos os certificados no seguinte repositório"
5. Navegue até "Repositório de Autoridades de Certificação Raiz Confiáveis"
6. Clique em "Concluir"

**Opção B - PowerShell (como Administrador):**

```powershell
Import-Certificate -FilePath ".\certs\localhost.crt" -CertStoreLocation Cert:\CurrentUser\Root
```

### 3. Iniciar Servidores com HTTPS

```bash
npm run dev:https
```

### 4. Acessar a Aplicação

- **Frontend:** https://localhost:3000
- **Backend:** https://localhost:3002

⚠️ O navegador mostrará um aviso sobre o certificado. Clique em **"Avançado" → "Continuar para localhost"**.

## 📋 Configuração do Meta App

No [Meta App Dashboard](https://developers.facebook.com/apps/980766987152980/settings/basic/):

1. **App Domains:** Adicione `localhost`
2. **Website:** Adicione `https://localhost:3000`
3. **Valid OAuth Redirect URIs:** Adicione:
   - `https://localhost:3000/dashboard/integrations`
   - `https://localhost:3002/api/v1/whatsapp-connections/oauth/callback`

## 🔧 Comandos Disponíveis

```bash
# Gerar certificados SSL
npm run generate-certs

# Iniciar servidores com HTTPS
npm run dev:https

# Iniciar apenas frontend com HTTPS
cd frontend && npm run dev:https

# Iniciar apenas backend com HTTPS
cd backend && npm run start:dev:https
```

## 📚 Documentação Completa

Para mais detalhes, consulte: [`docs/desenvolvimento/https-setup.md`](docs/desenvolvimento/https-setup.md)

## ❓ Troubleshooting

### Erro: "Certificados SSL não encontrados"

- Execute: `npm run generate-certs`
- Verifique se os arquivos existem em `certs/`

### Erro: "NET::ERR_CERT_AUTHORITY_INVALID"

- Instale o certificado no Windows (veja passo 2 acima)

### Erro: "ERR_SSL_PROTOCOL_ERROR"

- Verifique se os servidores estão rodando com HTTPS
- Use `npm run dev:https` em vez de `npm run dev`

### Facebook ainda mostra erro de HTTPS

- Verifique se está acessando via `https://` (não `http://`)
- Verifique se o certificado está instalado como confiável
- Limpe o cache do navegador
