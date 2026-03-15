# Configuração do WhatsApp Embedded Signup

Este documento descreve as variáveis de ambiente e os passos para configurar o **WhatsApp Embedded Signup** no App Meta (Facebook Developers). O projeto usa **apenas** o fluxo Embedded Signup (não usa OAuth redirect manual).

## Variáveis de Ambiente

### Obrigatórias para Embedded Signup

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `META_APP_ID` | ID do app Meta | `1491027039335064` |
| `META_APP_SECRET` | Secret do app Meta | *(valor sensível)* |
| `META_APP_CONFIG_ID` | Configuration ID do Embedded Signup | `955497636833537` |
| `META_EMBEDDED_SIGNUP_REDIRECT_URI` | **URL da página** onde o Embedded Signup roda (ex: `/integrations`). Sem barra final. Deve ser **idêntica** à configurada em "Valid OAuth Redirect URIs" no App Meta. | `https://seu-dominio.com/integrations` |
| `META_EMBEDDED_SIGNUP_USE_REDIRECT_URI` | Se `false`, o backend **não envia** `redirect_uri` na troca de código (fluxo Tech Provider). Padrão: `true`. | `true` ou `false` |

### Frontend (NEXT_PUBLIC_)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_META_APP_ID` | Mesmo valor que `META_APP_ID` |
| `NEXT_PUBLIC_META_CONFIG_ID` | Mesmo valor que `META_APP_CONFIG_ID` |

## Configuração do App Meta (Facebook Login for Business)

### 1. Acessar o App Dashboard

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. Vá em **Facebook Login for Business** > **Settings** > **Client OAuth Settings**

### 2. Habilitar opções obrigatórias

- ✅ **Client OAuth Login**
- ✅ **Web OAuth Login**
- ✅ **Enforce HTTPS**
- ✅ **Embedded Browser OAuth Login**
- ✅ **Strict Mode for redirect URIs** (recomendado pela Meta)
- ✅ **Login with the JavaScript SDK**

### 3. Configurar domínios e redirect URIs

**Allowed domains (domínios permitidos):**

- Adicione o domínio onde o frontend roda (sem `https://`):
  - Dev: `localhost` (se Meta permitir) ou `abc123.ngrok-free.app` (com ngrok)
  - Produção: `seu-dominio.com`

**Valid OAuth Redirect URIs:**

- Adicione a URL **exata** da página do Embedded Signup (com protocolo, domínio e caminho):
  - Dev: `https://localhost:3000/integrations` ou `https://abc123.ngrok-free.app/integrations`
  - Produção: `https://seu-dominio.com/integrations`

⚠️ **Importante:** O valor de `META_EMBEDDED_SIGNUP_REDIRECT_URI` no `.env` **deve ser idêntico** ao cadastrado em **Valid OAuth Redirect URIs**. A Meta exige correspondência exata (incluindo barra final, se houver).

### 4. Configurations (WhatsApp Embedded Signup) — OBRIGATÓRIO

O erro **"Parâmetro inválido: config_id é obrigatório"** ocorre quando o Configuration ID não existe ou não está configurado corretamente.

**Como criar o Configuration ID:**

1. No App Dashboard: **Facebook Login for Business** → **Configuration** (menu lateral)
2. Clique em **Create Configuration** ou edite uma existente
3. Selecione **WhatsApp Embedded Signup** como login variation
4. Adicione as permissões necessárias para o App Review:
   - `business_management`
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `whatsapp_business_manage_events` (eventos webhook)
   - `email` (necessária para `GET /me?fields=email` nos testes)
5. Selecione **WhatsApp Account** como asset (com permissão de gerenciamento)
6. Salve e **copie o Configuration ID** gerado
7. Use esse ID em `NEXT_PUBLIC_META_APP_CONFIG_ID` e `META_APP_CONFIG_ID`

**Verificação:** O `config_id` na URL do diálogo OAuth deve ser **exatamente** o mesmo cadastrado no App Meta. Se o erro persistir, confirme que:
- O Configuration foi criado no mesmo App (App ID deve corresponder)
- O Configuration está ativo e não foi removido
- O App está em modo Development ou Live conforme necessário

### 5. Executar testes do Meta App Review

Para completar as permissões pendentes no App Review (ex: `whatsapp_business_manage_events`, `manage_app_solution`, `email`, `business_management`), o backend dispara as chamadas de API necessárias. É obrigatório ter uma **conexão OAuth (Embedded Signup)** conectada e ativa.

**Via interface (recomendado):**

1. Acesse **Integrações** no dashboard
2. Na conexão **OAuth** conectada, clique em **"Testes App Review"**
3. Aguarde a execução e leia a mensagem de sucesso/erro
4. Aguarde alguns minutos e recarregue a página do App Review no Meta Developers para ver as chamadas registradas

**Via API:**

```bash
POST /api/v1/whatsapp-connections/:id/run-meta-tests
```

**Permissões que podem falhar:**

- `manage_app_solution`: costuma exigir Solution Partner; se o app não for, a falha é esperada e pode ser ignorada para os demais testes.

## Fluxo técnico

A Meta oferece dois modos de retorno do `code`:

### Modo 1: Callback do SDK (popup/modal)
1. **Frontend** (`/integrations`): O usuário clica em "Conectar com Meta (Embedded Signup)"
2. **FB.login** é chamado com `config_id`, `response_type: 'code'`, `override_default_response_type: true` e **`fallback_redirect_uri`** (URL da página atual)
3. O popup da Meta retorna um `code` no callback `response.authResponse.code`
4. **Frontend** envia o `code` e o mesmo `redirect_uri` para `POST /api/v1/whatsapp-connections/embedded-signup/process`
5. **Backend** troca o `code` por token via chamada servidor-para-servidor (usando o `redirect_uri` recebido)

### Modo 2: Redirecionamento (redirect)
1. O usuário conclui o flow do diálogo de login
2. A Meta **redireciona** para `redirect_uri?code=XXX` (ex: `https://seu-dominio.com/integrations?code=ABC123`)
3. **Frontend** detecta o `code` na URL ao carregar a página
4. **Frontend** envia o `code` para `POST /api/v1/whatsapp-connections/embedded-signup/process`
5. **Backend** troca o `code` por token via chamada servidor-para-servidor
6. Após processar, o frontend remove o `code` da URL (segurança: código de uso único)

### Troca de código por token (backend)
O backend chama `https://graph.facebook.com/{version}/oauth/access_token` com:
- `client_id`, `client_secret`, `code`
- **`redirect_uri`**: valor de `META_EMBEDDED_SIGNUP_REDIRECT_URI` (deve ser **idêntico** ao usado no OAuth)

## Erro: "config_id é obrigatório"

Se aparecer:

> "Parâmetro inválido: config_id é obrigatório"

**Causa:** O Configuration ID não existe no App Meta ou não foi criado corretamente em Facebook Login for Business → Configuration.

**Solução:** Siga a seção **"4. Configurations (WhatsApp Embedded Signup)"** acima para criar o Configuration e obter o ID correto. O valor em `NEXT_PUBLIC_META_APP_CONFIG_ID` deve ser o ID exibido na dashboard após criar a configuração.

---

## Erro comum: "redirect_uri is identical"

Se aparecer:

> "Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request"

**Causa:** O `redirect_uri` enviado na troca de código não corresponde ao usado no diálogo OAuth. Com `FB.login`, o SDK usa internamente um `redirect_uri`; se não for definido explicitamente, a troca falha.

**Solução (fluxo FB.login / callback):**

1. **Adicione `fallback_redirect_uri`** na chamada `FB.login` com a URL exata da página (ex: `https://localhost:3000/integrations`)
2. **Passe o mesmo valor** ao trocar o código no backend (`processEmbeddedSignup`)
3. O frontend usa `window.location.origin + window.location.pathname` para obter a URL automaticamente
4. Confirme que essa URL está em **Valid OAuth Redirect URIs** no App Meta

**Solução (fluxo redirect):**

1. Confirme que `META_EMBEDDED_SIGNUP_REDIRECT_URI` está definida no `backend/.env`
2. Confirme que a URL é **exatamente** igual à cadastrada em **Valid OAuth Redirect URIs**

---

## Histórico de tentativas de correção (erro 36008)

Registro das correções já aplicadas para o erro *"Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request"* (code 36008). Útil para evitar retrabalho em futuras investigações.

| # | Tentativa | Onde aplicada | Resultado | Referência |
|---|-----------|---------------|-----------|------------|
| 1 | **Omitir `redirect_uri`** (não enviar parâmetro) | Backend: `exchangeCodeForBusinessToken` | Implementada como 1ª tentativa | [Fórum Meta](https://developers.facebook.com/community/threads/597333095976937/) — Eduardo, Hitesh |
| 2 | **`redirect_uri=""`** (string vazia) | Backend: fallback 2ª tentativa | Implementada | [Stack Overflow 77555576](https://stackoverflow.com/questions/77555576) — HubertBlu |
| 3 | **`xd_arbiter`** — `https://staticxx.facebook.com/x/connect/xd_arbiter/` | Backend: fallbacks 3ª–6ª | Implementada | Boris (Fórum Meta): popup usa este URI |
| 4 | **`xd_arbiter` variantes** — `?version=45`, `?version=46`, `?version=50` | Backend: fallbacks | Implementada | `JSSDKXDConfig.XXdUrl` no sdk.js usa `?version=46` |
| 5 | **URL do app** (ex: `https://localhost:3000/integrations`) | Backend: última tentativa se `USE_REDIRECT_URI=true` | Implementada | Para fluxo redirect (não popup) |
| 6 | **`fallback_redirect_uri`** na chamada `FB.login` | Frontend: `embedded-signup.tsx` | Implementada | Documentação Meta |
| 7 | **Normalização** — remover barra final do `redirect_uri` | Frontend + Backend | Implementada | Evitar divergência `…/integrations` vs `…/integrations/` |
| 8 | **`META_EMBEDDED_SIGNUP_USE_REDIRECT_URI=false`** | `.env` do backend | Recomendado para popup | Prioriza omit/""/xd_arbiter antes da URL do app |
| 9 | **Valid OAuth Redirect URIs** — conferir URL exata no app Meta | Meta Developers Dashboard | Verificado | Incluído `https://localhost:3000/integrations` |
| 10 | **Allowed domains** — domínio da página | Meta Developers Dashboard | Verificado | Incluído `localhost` para dev |
| 11 | **Ordem de tentativas** — trocar URL do app por omit como 1ª | Backend | Implementada | Fórum Meta: omit funciona para maioria |

**Ordem atual de tentativas no backend (em sequência até sucesso):**

1. `null` (omitir)  
2. `""`  
3. `https://staticxx.facebook.com/x/connect/xd_arbiter/?version=46`  
4. `https://staticxx.facebook.com/x/connect/xd_arbiter/`  
5. `https://staticxx.facebook.com/x/connect/xd_arbiter/?version=50`  
6. `https://staticxx.facebook.com/x/connect/xd_arbiter/?version=45`  
7. URL da app (apenas se `META_EMBEDDED_SIGNUP_USE_REDIRECT_URI=true`)

**Tentativas implementadas (13/03/2026):**

- Trocar **GET** por **POST** na chamada `oauth/access_token` — implementado: tenta POST primeiro, se 36008 tenta GET
- **redirect_uri do frontend primeiro** — prioridade: `https://...`, `https://.../`, null, "", xd_arbiter
- Variante com barra final (`/integrations` vs `/integrations/`)

**Tentativas ainda não implementadas (possíveis próximos passos):**

- Inspecionar URL real do popup (F12 → Network) ao concluir o fluxo e extrair `redirect_uri` exato
- Adicionar mais versões do xd_arbiter (ex: 47, 48, 51) se 45/46/50 falharem
- Fluxo **OAuth manual** com `window.location.replace()` em vez de `FB.login` (controle total do `redirect_uri`, mas fora do padrão recomendado pela Meta)

---

## Troubleshooting

### Verificação de Valid OAuth Redirect URIs

Se a troca de código falhar com erro OAuth (ex: `code 36008`), verifique:

1. Acesse **Facebook Login for Business** > **Settings** > **Client OAuth Settings**
2. Em **Valid OAuth Redirect URIs**, adicione exatamente:
   - Dev: `https://localhost:3000/integrations` (sem barra final)
   - Produção: `https://seu-dominio.com/integrations` (sem barra final)
3. Em **Allowed domains**, adicione: `localhost` (dev) ou `seu-dominio.com` (produção)
4. O backend e o frontend normalizam automaticamente o `redirect_uri` removendo a barra final para evitar divergência

### Fluxo popup (FB.login) — ordem de tentativas

No fluxo com popup, o SDK usa `redirect_uri` interno (`staticxx.facebook.com/x/connect/xd_arbiter/?version=46` — ver `JSSDKXDConfig.XXdUrl` no sdk.js). O **backend tenta na ordem abaixo** até obter sucesso:

1. **Omitir** `redirect_uri` — [Fórum Meta 597333095976937](https://developers.facebook.com/community/threads/597333095976937/): "no need to send, facebook handle that now"
2. **String vazia** `""` — [Stack Overflow 77555576](https://stackoverflow.com/questions/77555576)
3. **xd_arbiter** `?version=46` — valor do SDK (JSSDKXDConfig)
4. **xd_arbiter** base e variantes `?version=45`, `?version=50`
5. **Nossa URL** (ex: `https://localhost:3000/integrations`) — apenas se `META_EMBEDDED_SIGNUP_USE_REDIRECT_URI=true`

**Recomendação:** Para fluxo popup, defina `META_EMBEDDED_SIGNUP_USE_REDIRECT_URI=false` no `.env` do backend. Assim, as tentativas 1–4 cobrem a maioria dos casos e a URL da app só é tentada se ainda existir `redirect_uri` em uso.

### Fluxo Solution Partner (sem redirect_uri)

A documentação [Onboarding as a Solution Partner](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-customers-as-a-solution-partner) mostra que apps **registrados como Solution Partner** podem trocar o código usando apenas `client_id`, `client_secret` e `code` (sem `redirect_uri`).

Se o app **não** for Solution Partner, a Meta exige `redirect_uri` e retornará erro: *"Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request"*.

Para tentar o fluxo sem `redirect_uri` (apenas se o app for Solution Partner):

1. Defina no `backend/.env`:
   ```
   META_EMBEDDED_SIGNUP_USE_REDIRECT_URI=false
   ```
2. Reinicie o backend
3. Se a Meta retornar erro pedindo `redirect_uri`, o app não é Solution Partner — remova a variável e use o fluxo padrão com `redirect_uri`

## Desenvolvimento local com HTTPS

O Embedded Signup requer HTTPS em produção. Para desenvolvimento local, use um túnel (ngrok, Cloudflare Tunnel):

- Ver: [docs/desenvolvimento/https-local-embedded-signup.md](./https-local-embedded-signup.md)

## Referências

- [Meta - WhatsApp Embedded Signup Implementation](https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation)
- [Meta - Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/business)
