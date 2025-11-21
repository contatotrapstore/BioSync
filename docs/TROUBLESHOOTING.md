# 🔧 Guia de Resolução de Problemas - NeuroOne Platform

Guia completo para diagnosticar e resolver problemas comuns na plataforma NeuroOne.

---

## 📋 Índice por Componente

- [🖥️ Backend API](#-backend-api)
- [🎨 Admin Panel](#-admin-panel)
- [🎮 Launcher PC](#-launcher-pc)
- [📱 Mobile App](#-mobile-app)
- [🗄️ Banco de Dados](#️-banco-de-dados)
- [🔐 Autenticação](#-autenticação)
- [💳 Pagamentos](#-pagamentos)

---

## 🖥️ Backend API

### ❌ Erro: "Cannot connect to database"

**Sintomas:**
```
Error: Failed to connect to Supabase
```

**Causas possíveis:**
- Credenciais do Supabase incorretas
- URL do Supabase incorreta
- Firewall bloqueando conexão

**Solução:**
1. Verifique o `.env`:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

2. Teste a conexão manualmente:
   ```bash
   curl -I https://seu-projeto.supabase.co
   ```

3. Verifique se as keys estão corretas no dashboard do Supabase:
   - Settings → API → Project URL
   - Settings → API → Project API keys

---

### ❌ Erro: "JWT malformed" ou "Invalid token"

**Sintomas:**
```
JsonWebTokenError: jwt malformed
UnauthorizedError: Invalid token
```

**Causas:**
- Token expirado (> 15 minutos)
- Token corrompido
- Secret key incorreta

**Solução:**
1. Faça logout e login novamente
2. Limpe localStorage/cookies
3. Verifique `JWT_SECRET` no backend `.env`
4. Use refresh token para obter novo access token

---

### ❌ Erro: Deploy falha no Render

**Sintomas:**
```
Build failed
npm ERR! code ELIFECYCLE
```

**Causas:**
- Dependências faltando em `package.json`
- Sintaxe TypeScript em arquivo `.js`
- Variáveis de ambiente não configuradas

**Solução:**
1. Verifique logs do Render
2. Rode `npm install` localmente
3. Teste `npm start` localmente
4. Verifique variáveis de ambiente no dashboard Render
5. Garanta que não há sintaxe TS em arquivos JS:
   ```javascript
   // ❌ Errado em arquivo .js
   let accessType: string | null = null;

   // ✅ Correto
   let accessType = null;
   ```

---

### ❌ Erro: CORS blocked

**Sintomas:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Causas:**
- Origin não está em `ALLOWED_ORIGINS`
- Headers CORS mal configurados

**Solução:**
1. Adicione a origin em `biosync-backend/.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,https://biosync-admin.vercel.app
   ```

2. Reinicie o backend
3. Limpe cache do navegador (Ctrl+Shift+Del)

---

### ❌ Erro: Rate limit exceeded

**Sintomas:**
```
429 Too Many Requests
```

**Causas:**
- Muitas requisições do mesmo IP (> 100 req/15min)

**Solução:**
1. Aguarde 15 minutos
2. Verifique se não há loop de requisições no código
3. Para desenvolvimento, aumente o limite em `middleware/rateLimiter.js`

---

## 🎨 Admin Panel

### ❌ Erro: Página em branco após deploy

**Sintomas:**
- Tela branca
- Console mostra: `Failed to load resource`

**Causas:**
- `base` incorreto no `vite.config.ts`
- Build não completou
- Variáveis de ambiente faltando

**Solução:**
1. Verifique `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: './', // Importante!
     // ...
   });
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Configure `VITE_API_URL` no Vercel:
   - Dashboard → Settings → Environment Variables
   - Adicione `VITE_API_URL=https://sua-api.render.com`

---

### ❌ Erro: "Failed to fetch games"

**Sintomas:**
- Lista de jogos vazia
- Erro 401 Unauthorized

**Causas:**
- Token expirado
- Backend offline
- CORS bloqueado

**Solução:**
1. Verifique se backend está online:
   ```bash
   curl https://biosync-jlfh.onrender.com/api/v1/health
   ```

2. Faça logout e login novamente
3. Verifique Network tab no DevTools (F12)
4. Verifique CORS (ver seção Backend)

---

### ❌ Erro: Upload de jogo falha

**Sintomas:**
```
Error uploading game
413 Payload Too Large
```

**Causas:**
- Arquivo muito grande (> limite do servidor)
- Timeout de upload
- Falta de espaço no storage

**Solução:**
1. Reduza tamanho do arquivo ZIP
2. Aumente timeout no backend:
   ```javascript
   // server.js
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ limit: '50mb', extended: true }));
   ```

3. Verifique espaço disponível no Supabase Storage

---

### ❌ Erro: Imagem não aparece

**Sintomas:**
- Placeholder no lugar da imagem
- 404 Not Found na imagem

**Causas:**
- URL da imagem incorreta
- Permissões do storage
- Imagem não foi uploaded

**Solução:**
1. Verifique URL no banco de dados:
   ```sql
   SELECT cover_image FROM games WHERE slug = 'nome-do-jogo';
   ```

2. Teste URL diretamente no navegador
3. Verifique permissões do Supabase Storage:
   - Storage → Policies → RLS deve permitir leitura pública

---

## 🎮 Launcher PC

### ❌ Erro: "App não abre" ou "Tela preta"

**Sintomas:**
- Launcher não inicia
- Tela preta após logo

**Causas:**
- Falta de dependências
- Antivírus bloqueando
- Porta 5174 em uso

**Solução:**
1. Rode como administrador
2. Adicione exceção no antivírus
3. Verifique logs do Electron:
   - Windows: `%APPDATA%\neuroone-launcher\logs`
   - Linux: `~/.config/neuroone-launcher/logs`

4. Reinstale o launcher

---

### ❌ Erro: "Failed to login"

**Sintomas:**
```
Login failed: Network error
Invalid credentials
```

**Causas:**
- Backend offline
- Credenciais incorretas
- Problema de rede

**Solução:**
1. Teste conexão com backend:
   ```bash
   curl https://biosync-jlfh.onrender.com/api/v1/health
   ```

2. Verifique credenciais:
   - Username: `admin` (não `admin@admin.com`)
   - Password: verificar em `docs/setup/CREDENCIAIS_ADMIN.md`

3. Verifique conexão de internet
4. Desabilite VPN/Proxy temporariamente

---

### ❌ Erro: Jogos não aparecem

**Sintomas:**
- Lista de jogos vazia
- "Nenhum jogo disponível"

**Causas:**
- Assinatura expirada
- Filtro de plataforma errado
- Todos os jogos inativos

**Solução:**
1. Verifique assinatura:
   - Acesse página de perfil/assinatura no launcher

2. Verifique se jogos estão ativos no admin:
   - Admin → Jogos → Verificar `is_active = true`

3. Verifique se jogos suportam plataforma PC:
   - Admin → Editar jogo → Checkbox "PC (Windows/Linux)" marcado

4. Force refresh: Ctrl+R no launcher

---

### ❌ Erro: "Subscription expired"

**Sintomas:**
```
Sua assinatura expirou
Renovar agora
```

**Causas:**
- Assinatura realmente expirada
- Pagamento pendente
- Webhook não processado

**Solução:**
1. Verifique status da assinatura:
   ```sql
   SELECT * FROM user_subscriptions WHERE user_id = 'seu-user-id';
   ```

2. Verifique pagamentos pendentes:
   ```sql
   SELECT * FROM payments WHERE user_id = 'seu-user-id' ORDER BY created_at DESC LIMIT 5;
   ```

3. Processe webhooks manualmente se necessário
4. Renove assinatura via admin ou Asaas

---

### ❌ Erro: Jogo não abre após clicar

**Sintomas:**
- Nada acontece ao clicar "Jogar"
- Erro "Failed to start game"

**Causas:**
- Pasta do jogo não existe
- `index.html` faltando
- Permissões de arquivo

**Solução:**
1. Verifique se pasta do jogo existe:
   - `biosync-launcher/Jogos/{slug-do-jogo}/`

2. Verifique se `index.html` existe na pasta

3. Verifique `folder_path` no banco:
   ```sql
   SELECT folder_path FROM games WHERE slug = 'nome-do-jogo';
   ```

4. Reinstale o jogo via admin (upload novamente)

---

## 📱 Mobile App

### ❌ Erro: Build falha "SDK location not found"

**Sintomas:**
```
SDK location not found. Define location with an ANDROID_HOME environment variable
```

**Causas:**
- Android SDK não instalado
- `ANDROID_HOME` não configurado

**Solução:**
1. Instale Android Studio
2. Configure `ANDROID_HOME`:
   ```bash
   # Windows
   setx ANDROID_HOME "C:\Users\SEU_USER\AppData\Local\Android\Sdk"

   # Linux/Mac
   export ANDROID_HOME=~/Android/Sdk
   echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
   ```

3. Verifique:
   ```bash
   echo $ANDROID_HOME
   ```

4. Restart terminal e tente novamente

---

### ❌ Erro: "Installed Build Tools revision X is corrupted"

**Sintomas:**
```
Installed Build Tools revision 34.0.0 is corrupted
```

**Causas:**
- Build Tools corrompido
- Instalação incompleta

**Solução:**
1. Abra Android Studio
2. Tools → SDK Manager → SDK Tools
3. Desmarque "Android SDK Build-Tools"
4. Apply → OK (desinstala)
5. Marque novamente
6. Apply → OK (reinstala)

---

### ❌ Erro: App não conecta à API

**Sintomas:**
- Login falha
- Jogos não carregam
- Timeout errors

**Causas:**
- `VITE_API_URL` incorreta
- Backend offline
- Sem acesso à internet

**Solução:**
1. Verifique `.env`:
   ```env
   VITE_API_URL=https://biosync-jlfh.onrender.com/api/v1
   ```

2. Rebuild app:
   ```bash
   npm run build
   npx cap sync android
   ```

3. Teste backend:
   ```bash
   curl https://biosync-jlfh.onrender.com/api/v1/health
   ```

4. Verifique conexão de internet do dispositivo
5. Desabilite modo avião

---

### ❌ Erro: Jogos não carregam após download

**Sintomas:**
- Download completa
- Jogo não abre
- Tela branca

**Causas:**
- ZIP corrompido
- Estrutura do jogo inválida
- Permissões de armazenamento

**Solução:**
1. Delete e baixe novamente
2. Verifique estrutura do ZIP:
   ```
   jogo.zip
   ├── index.html (obrigatório)
   ├── assets/
   └── manifest.json
   ```

3. Conceda permissões de armazenamento:
   - Settings → Apps → NeuroOne → Permissions → Storage

4. Verifique logs no Logcat:
   ```bash
   adb logcat | grep -i "Capacitor\|NeuroGame"
   ```

---

### ❌ Erro: Tela branca após build de produção

**Sintomas:**
- App mostra tela branca
- Console vazio

**Causas:**
- `base` incorreto no `vite.config.ts`
- Assets não encontrados

**Solução:**
1. Verifique `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: './', // Importante para paths relativos!
     // ...
   });
   ```

2. Rebuild completo:
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

---

## 🗄️ Banco de Dados

### ❌ Erro: "relation does not exist"

**Sintomas:**
```
error: relation "public.games" does not exist
```

**Causas:**
- Tabela não foi criada
- Schema incorreto
- Migration não aplicada

**Solução:**
1. Verifique se tabelas existem:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

2. Aplique migrations faltantes:
   - Supabase Dashboard → SQL Editor
   - Rode scripts em `biosync-backend/migrations/`

3. Verifique schema correto (`public`, não `auth`)

---

### ❌ Erro: RLS policy violation

**Sintomas:**
```
new row violates row-level security policy
```

**Causas:**
- RLS bloqueando operação
- Service role key não usado
- Policy incorreta

**Solução:**
1. Use service role key para operações admin:
   ```javascript
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   ```

2. Verifique policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';
   ```

3. Temporariamente desabilite RLS (apenas dev):
   ```sql
   ALTER TABLE nome_tabela DISABLE ROW LEVEL SECURITY;
   ```

---

### ❌ Erro: Query lenta (> 2s)

**Sintomas:**
- Queries demoram muito
- Timeout errors

**Causas:**
- Falta de índices
- Tabelas muito grandes sem paginação
- Query N+1

**Solução:**
1. Crie índices:
   ```sql
   CREATE INDEX idx_games_slug ON games(slug);
   CREATE INDEX idx_users_email ON users(email);
   ```

2. Use paginação:
   ```javascript
   const { data } = await supabase
     .from('games')
     .select('*')
     .range(0, 9); // Primeiros 10 itens
   ```

3. Use `explain analyze`:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM games WHERE supported_platforms @> ARRAY['pc'];
   ```

---

## 🔐 Autenticação

### ❌ Erro: "Username vs Email" confusion

**Sintomas:**
```
Login failed with email
Login works with username
```

**Causa:**
- Sistema usa `username`, não `email` para login

**Solução:**
- Use `username` no campo de login:
  - ✅ Correto: `admin`
  - ❌ Errado: `admin@admin.com`

---

### ❌ Erro: Senha incorreta mas está certa

**Sintomas:**
```
Invalid credentials
```
- Senha digitada está correta visualmente

**Causas:**
- Hash de senha incorreto no banco
- Espaços extras na senha
- Case sensitivity

**Solução:**
1. Resete senha via SQL:
   ```sql
   UPDATE users
   SET password = '$2a$10$hashedpassword'  -- Use bcrypt hash
   WHERE username = 'admin';
   ```

2. Ou use endpoint de reset de senha (se implementado)

3. Verifique se não há espaços:
   ```javascript
   const trimmedPassword = password.trim();
   ```

---

### ❌ Erro: Token expira muito rápido

**Sintomas:**
- Precisa fazer login a cada 15 minutos

**Causas:**
- Access token com TTL curto (15min é normal)
- Refresh token não está sendo usado

**Solução:**
1. Implemente refresh token automático:
   ```javascript
   // No interceptor Axios
   if (error.response?.status === 401) {
     const newToken = await refreshAccessToken();
     // Retry request com novo token
   }
   ```

2. Ou aumente TTL do access token (não recomendado):
   ```javascript
   // backend/config/jwt.js
   const accessToken = jwt.sign(payload, secret, { expiresIn: '1h' });
   ```

---

## 💳 Pagamentos

### ❌ Erro: Webhook não processa

**Sintomas:**
- Pagamento confirmado no Asaas
- Status não atualiza no sistema

**Causas:**
- Webhook URL incorreta
- Signature validation falha
- Endpoint retorna erro

**Solução:**
1. Verifique webhook URL no Asaas:
   - `https://seu-backend.com/api/v1/webhooks/asaas`

2. Teste endpoint manualmente:
   ```bash
   curl -X POST https://seu-backend.com/api/v1/webhooks/asaas \
     -H "Content-Type: application/json" \
     -d '{"event": "PAYMENT_CONFIRMED", "payment": {...}}'
   ```

3. Verifique logs do backend para erros

4. Valide signature:
   ```javascript
   const signature = req.headers['asaas-signature'];
   // Valide contra ASAAS_WEBHOOK_SECRET
   ```

---

### ❌ Erro: PIX QR Code não aparece

**Sintomas:**
- Pagamento criado
- QR Code não exibido

**Causas:**
- Resposta do Asaas sem campo `encodedImage`
- Erro no frontend ao exibir

**Solução:**
1. Verifique resposta da API Asaas:
   ```javascript
   console.log(paymentResponse.encodedImage); // Deve existir
   ```

2. Verifique se está decodificando base64 corretamente:
   ```jsx
   <img src={`data:image/png;base64,${encodedImage}`} />
   ```

3. Teste com Postman/Insomnia primeiro

---

## 🔍 Debugging Geral

### Como Habilitar Logs Detalhados

#### Backend
```javascript
// server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

#### Admin Panel
```javascript
// vite.config.ts
export default defineConfig({
  logLevel: 'info',
  // ...
});
```

#### Launcher PC
- DevTools: Ctrl+Shift+I
- Console tab para JavaScript logs
- Network tab para API calls

#### Mobile App
- Chrome DevTools: `chrome://inspect`
- Android Logcat: `adb logcat | grep Capacitor`

---

## 📞 Suporte

Se o problema persistir após tentar as soluções acima:

1. **Verifique documentação específica:**
   - [Backend](../biosync-backend/README.md)
   - [Admin](../biosync-admin/README.md)
   - [Launcher PC](../biosync-launcher/README.md)
   - [Mobile App](../neuroone-mobile/README.md)

2. **Verifique issues conhecidos:**
   - [Mobile Launcher Review](mobile-launcher-review.md)

3. **Colete informações:**
   - Logs completos do erro
   - Versão do componente
   - Steps para reproduzir
   - Screenshots se aplicável

4. **Entre em contato:**
   - Email: suporte@neuroone.com.br
   - GitHub Issues (se open source)

---

**Última atualização**: 2025-11-04
**Versão**: 2.3.0
**Plataforma**: NeuroOne
