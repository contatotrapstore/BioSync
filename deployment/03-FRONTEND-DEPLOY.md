# Guia de Deploy: Frontend React (Vercel)

Este guia detalha o processo de deploy do frontend NeuroOne (React + Vite + MUI) na plataforma Vercel.

## 🎯 Por que Vercel?

- ✅ **Gratuito** para projetos pessoais/educacionais (largura de banda ilimitada)
- ✅ **CDN global** (edge network) - baixa latência mundial
- ✅ **HTTPS automático** (SSL gratuito)
- ✅ **Deploy automático** via Git (CI/CD integrado)
- ✅ **Preview deployments** (cada PR gera URL de preview)
- ✅ **Otimizado para React/Vite** (zero config)

**Alternativas**: Netlify, Cloudflare Pages, GitHub Pages

---

## 📦 Passo 1: Preparar Projeto para Deploy

### 1.1 Verificar package.json

Certifique-se que `neuroone-frontend/package.json` tem os scripts corretos:

```json
{
  "name": "neuroone-frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.2 Criar/Verificar vercel.json

Crie `neuroone-frontend/vercel.json` para configurar rotas SPA:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

⚠️ **Importante**: Isso garante que rotas React (`/teacher`, `/admin`, etc.) funcionem corretamente (não retornem 404).

### 1.3 Atualizar .gitignore

Certifique-se que `dist/` e `.env` estão no `.gitignore`:

```gitignore
# neuroone-frontend/.gitignore
node_modules/
dist/
.env
.env.local
.env.production
```

### 1.4 Testar Build Local

```bash
cd neuroone-frontend

# Build de produção
npm run build

# Verificar que dist/ foi criado
ls dist/

# Testar build localmente
npm run preview
# Abra http://localhost:4173
```

Se houver erros de build, corrija antes de prosseguir.

---

## 🚀 Passo 2: Deploy no Vercel

### 2.1 Criar Conta Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (recomendado) ou email

### 2.2 Importar Projeto do GitHub

**Opção A: Via Dashboard (Recomendado)**

1. No Vercel Dashboard, clique em **"Add New..." > "Project"**
2. Conecte sua conta GitHub (autorize o Vercel)
3. Selecione o repositório `neuroone`
4. Clique em **"Import"**

**Opção B: Via Vercel CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Navegar para o projeto
cd neuroone-frontend

# Deploy
vercel
```

### 2.3 Configurar Projeto

Na tela de configuração:

- **Project Name**: `neuroone-frontend` (ou nome de sua preferência)
- **Framework Preset**: Vite (deve detectar automaticamente)
- **Root Directory**: `neuroone-frontend` (se projeto está em subpasta do repo)
- **Build Command**: `npm run build` (autodetectado)
- **Output Directory**: `dist` (autodetectado)
- **Install Command**: `npm install` (autodetectado)

### 2.4 Configurar Variáveis de Ambiente

⚠️ **CRÍTICO**: Configure as variáveis ANTES do primeiro deploy!

Clique em **"Environment Variables"** e adicione:

```env
# Supabase (apenas anon key - seguro expor no frontend)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API (URL do backend deployado no Railway/Render)
VITE_API_URL=https://neuroone-backend.onrender.com
VITE_WS_URL=wss://neuroone-backend.onrender.com
```

**Importante**:
- Variáveis com prefixo `VITE_` são expostas no bundle final (Vite requirement)
- NÃO adicione `SUPABASE_SERVICE_KEY` aqui (apenas backend)
- Use **Production**, **Preview**, e **Development** environments (ou apenas Production para começar)

### 2.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (1-3 minutos)
3. Acompanhe logs em tempo real
4. Após sucesso, Vercel mostrará a URL de produção:
   ```
   https://neuroone-frontend.vercel.app
   ```

---

## 🌐 Passo 3: Configurar Domínio Customizado (Opcional)

### 3.1 Adicionar Domínio

1. Vá em **"Settings" > "Domains"**
2. Clique em **"Add"**
3. Digite seu domínio (ex: `app.seudominio.com`)
4. Escolha o tipo:
   - **Production**: Domínio principal
   - **Redirect to Production**: Redireciona para domínio principal

### 3.2 Configurar DNS

Se você gerencia DNS externamente (não no Vercel):

1. Acesse seu provedor de DNS (Cloudflare, GoDaddy, etc.)
2. Adicione um registro **CNAME**:
   ```
   Tipo: CNAME
   Nome: app
   Valor: cname.vercel-dns.com
   TTL: Auto ou 3600
   ```
3. Aguarde propagação DNS (pode levar até 48h, geralmente 5-30min)

Se você usa Vercel Nameservers:
1. Vercel fornecerá nameservers personalizados
2. Configure no seu registrar de domínio (ex: GoDaddy, Namecheap)

### 3.3 Verificar SSL

Vercel provisiona SSL automaticamente via Let's Encrypt:
- HTTPS será habilitado em 1-5 minutos após DNS propagar
- Acesse `https://app.seudominio.com` para testar

---

## 🔄 Passo 4: Configurar Deploy Automático (CI/CD)

### 4.1 GitHub Integration (Já Configurado)

Se você importou via GitHub, deploys automáticos já estão ativos:

- ✅ **Push para `main`**: Deploy automático para produção
- ✅ **Pull Request**: Gera preview deployment (URL única por PR)
- ✅ **Comentários no PR**: Vercel comenta com link do preview

### 4.2 Configurar Branch de Deploy

1. Vá em **"Settings" > "Git"**
2. Configure **Production Branch**: `main` ou `master`
3. Habilite **Preview Deployments** para todos os branches

### 4.3 Proteger Build de Erros

Para evitar deploy com erros:

Edite `neuroone-frontend/package.json`:

```json
{
  "scripts": {
    "build": "npm run lint && vite build",
    "lint": "eslint src --ext .js,.jsx"
  }
}
```

Agora o build falhará se houver erros de linting.

---

## ✅ Passo 5: Validação Pós-Deploy

### 5.1 Testar Aplicação

Acesse a URL do Vercel (ex: `https://neuroone-frontend.vercel.app`) e teste:

1. **Página de Login**:
   - Acesse `/login`
   - Tente fazer login com `admin@neurogame.com` / sua senha

2. **Dashboard Direção**:
   - Após login, deve redirecionar para `/admin`
   - Verifique que widgets carregam

3. **Dashboard Professor**:
   - Crie um usuário professor no admin
   - Faça logout e login como professor
   - Deve redirecionar para `/teacher`

4. **Verificar Conexão com Backend**:
   - Abra DevTools (F12) > Console
   - Procure por erros de CORS ou conexão
   - Verifique chamadas à API em Network tab

### 5.2 Testar WebSocket

1. Professor cria uma sessão e inicia
2. Aluno conecta via PWA mobile (ou navegador)
3. Verificar se dados EEG aparecem em tempo real no dashboard do professor

### 5.3 Verificar Variáveis de Ambiente

Adicione debug temporário em `src/main.jsx`:

```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
```

Após verificar, remova o console.log e faça novo deploy.

---

## 🔧 Configurações Avançadas

### Performance Optimizations

#### 1. Habilitar SWR Cache (React Query)

Edite `src/App.jsx`:

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

#### 2. Code Splitting por Rota

Edite `src/App.jsx`:

```javascript
import { lazy, Suspense } from 'react';

const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

#### 3. Otimizar Build Size

Analise bundle size:

```bash
npm run build
npx vite-bundle-visualizer
```

Reduza imports desnecessários de MUI:

```javascript
// ❌ Ruim (importa tudo)
import { Button, TextField } from '@mui/material';

// ✅ Bom (tree-shaking)
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
```

### Analytics e Monitoramento

#### Vercel Analytics (Gratuito)

1. Vá em **"Analytics"** no Vercel Dashboard
2. Clique em **"Enable"**
3. Adicione snippet no `index.html`:

```html
<head>
  <script defer src="/_vercel/insights/script.js"></script>
</head>
```

#### Google Analytics 4

```javascript
// src/utils/analytics.js
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize('G-XXXXXXXXXX'); // Seu ID
};

export const logPageView = () => {
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
};
```

Chame no `App.jsx`:

```javascript
import { initGA, logPageView } from './utils/analytics';

function App() {
  useEffect(() => {
    initGA();
    logPageView();
  }, []);
}
```

---

## 🐛 Troubleshooting

### Problema: Build falha com "Module not found"

**Causa**: Dependência faltando.

**Solução**:
```bash
npm install
npm run build
```

Se o erro persistir, limpe cache:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: 404 nas rotas React

**Causa**: `vercel.json` não configurado ou incorreto.

**Solução**: Verifique que `vercel.json` tem a configuração de fallback para `/index.html` (ver Passo 1.2).

### Problema: Variáveis de ambiente `undefined`

**Causa**: Variáveis não têm prefixo `VITE_` ou não foram adicionadas no Vercel.

**Solução**:
1. Todas as variáveis no frontend devem começar com `VITE_`
2. Vá em Vercel **Settings > Environment Variables** e adicione
3. **Redeploy** (variáveis não afetam builds anteriores)

### Problema: CORS error ao chamar backend

**Causa**: Backend não permite origem do frontend.

**Solução**: Configure `WS_CORS_ORIGIN` no backend (ver [02-BACKEND-DEPLOY.md](02-BACKEND-DEPLOY.md)):

```env
# No backend (Railway/Render)
WS_CORS_ORIGIN=https://neuroone-frontend.vercel.app
```

Ou permita múltiplos:
```javascript
// backend/src/server.js
app.use(cors({
  origin: [
    'https://neuroone-frontend.vercel.app',
    'https://app.seudominio.com',
    'http://localhost:5173' // dev
  ],
  credentials: true
}));
```

### Problema: WebSocket não conecta

**Causa**: URL incorreta ou protocolo errado.

**Solução**: Verifique `VITE_WS_URL`:
- Use `wss://` (não `ws://`) para HTTPS
- Verifique que backend suporta WebSocket upgrades
- Teste conexão manualmente:
  ```bash
  wscat -c wss://neuroone-backend.onrender.com
  ```

---

## 🔐 Segurança Best Practices

### Checklist de Segurança

- [ ] **Não commitou** `.env` no Git (.gitignore configurado)
- [ ] **Não expôs** `SUPABASE_SERVICE_KEY` no frontend (apenas backend)
- [ ] **Configurou** `Content-Security-Policy` headers:
  ```json
  // vercel.json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://seu-backend.com wss://seu-backend.com https://seu-projeto.supabase.co"
          }
        ]
      }
    ]
  }
  ```
- [ ] **Habilitou** HTTPS-only (Vercel faz automaticamente)
- [ ] **Validou** inputs no frontend antes de enviar ao backend
- [ ] **Sanitizou** dados exibidos (proteção contra XSS)

### Rate Limiting no Frontend

Para evitar spam de requisições:

```javascript
// src/utils/rateLimit.js
let lastRequest = 0;
const MIN_INTERVAL = 1000; // 1 segundo

export const throttle = (fn) => {
  return (...args) => {
    const now = Date.now();
    if (now - lastRequest >= MIN_INTERVAL) {
      lastRequest = now;
      return fn(...args);
    }
  };
};

// Uso:
const handleSubmit = throttle(async (data) => {
  await api.post('/endpoint', data);
});
```

---

## 📊 Monitoramento de Produção

### Vercel Logs

1. Acesse **"Deployments"** > clique no deploy
2. Vá em **"Functions"** (se usar Serverless Functions)
3. Ou vá em **"Logs"** para ver erros em tempo real

### Error Boundary

Adicione error boundary para capturar erros React:

```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Envie para Sentry ou similar
  }

  render() {
    if (this.state.hasError) {
      return <h1>Algo deu errado. Tente recarregar a página.</h1>;
    }
    return this.props.children;
  }
}

// Uso no App.jsx:
<ErrorBoundary>
  <Router />
</ErrorBoundary>
```

---

## 🎯 Checklist Final

Antes de considerar deploy completo:

- [ ] Build local funciona sem erros
- [ ] Deploy no Vercel bem-sucedido
- [ ] URL de produção acessível
- [ ] Login funciona (admin e professor)
- [ ] Dashboards carregam corretamente
- [ ] Chamadas à API funcionam (sem CORS errors)
- [ ] WebSocket conecta e transmite dados
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio customizado configurado (opcional)
- [ ] HTTPS habilitado
- [ ] Analytics habilitado (opcional)
- [ ] Error tracking configurado (opcional)

---

## 🎉 Próximos Passos

Após concluir o deploy do frontend:

1. ✅ Teste fluxo completo end-to-end:
   - Direção cria professor e turma
   - Professor cria sessão
   - Aluno acessa via PWA e conecta headset
   - Dados EEG são transmitidos e visualizados
   - Sessão é finalizada e relatório gerado

2. ➡️ Implementar **Web Bluetooth API** para conexão com headsets (ver próximo guia)

3. ➡️ Configurar **servidor Python EEG** (opcional, se não usar Web Bluetooth)

4. ➡️ Executar **testes de integração** completos

5. ➡️ Lançar **piloto com usuários reais**

---

**Última atualização**: 2025-01-17
**Versão**: 1.0.0
**Autor**: Claude Code
