# 📚 Documentação NeuroOne Platform

Bem-vindo à documentação completa da plataforma NeuroOne - Sistema completo de jogos cognitivos com dashboard administrativo e launcher desktop.

---

## 📖 Índice Geral

### 🚀 Setup e Configuração Inicial
Documentação para configurar o sistema pela primeira vez.

- **[Primeiro Acesso](setup/PRIMEIRO_ACESSO.md)** - Guia completo de primeiro acesso e configuração inicial
- **[Credenciais Admin](setup/CREDENCIAIS_ADMIN.md)** - Credenciais administrativas do sistema
- **[Configuração Supabase](setup/SUPABASE_SETUP.md)** - Como configurar e obter credenciais do Supabase

### 🌐 Deploy e Produção
Guias para fazer deploy dos componentes do sistema.

- **[Guia Completo de Deploy](deploy/GUIA_DEPLOY_PRODUCAO.md)** - Guia completo para deploy em produção
- **[Backend no Render](../biosync-backend/DEPLOY_RENDER.md)** - Deploy da API no Render.com
- **[Admin no Vercel](../biosync-admin/DEPLOY_VERCEL.md)** - Deploy do dashboard no Vercel

### 🔌 API e Integração
Documentação técnica de APIs e integrações.

- **[Integração de Jogos](api/INTEGRACAO_JOGOS.md)** - Como integrar novos jogos na plataforma

### 📜 Histórico e Referências
Documentação histórica e de referência.

- **[Histórico: Migração NeuroGame](migration/HISTORICO_MIGRACAO_NEUROGAME.md)** - Documentação da migração completa do NeuroGame para BioSync/NeuroOne

---

## 🏗️ Arquitetura do Sistema

### Backend (biosync-backend/)
- **Tecnologia:** Node.js + Express + Supabase
- **Autenticação:** JWT com refresh tokens
- **Pagamentos:** Integração Asaas API
- **Features:**
  - Sistema de assinaturas (PIX e Cartão)
  - Sistema de psicólogos e pacientes
  - Sistema de pontuações de jogos
  - Webhooks Asaas
  - RLS (Row Level Security)

### Admin Panel (biosync-admin/)
- **Tecnologia:** React 18 + Material-UI v5
- **Features:**
  - Gestão de jogos
  - Gestão de usuários e assinaturas
  - Dashboard de psicólogos
  - Visualização de pontuações (Recharts)
  - Análise de solicitações de acesso

### Launcher (biosync-launcher/)
- **Tecnologia:** Electron + React 18
- **Features:**
  - Biblioteca de jogos
  - Sistema de autenticação
  - Validação de assinaturas
  - Download e instalação de jogos
  - Proteção de conteúdo
  - Sistema de atualizações

---

## 🗄️ Banco de Dados (Supabase/PostgreSQL)

### Tabelas Principais

#### Usuários e Autenticação
- `users` - Usuários do sistema
- `launcher_sessions` - Sessões ativas do launcher

#### Assinaturas e Pagamentos
- `subscriptions` - Assinaturas dos usuários
- `payments` - Histórico de pagamentos
- `asaas_webhooks` - Webhooks recebidos do Asaas

#### Jogos e Acesso
- `games` - Catálogo de jogos
- `user_game_access` - Controle de acesso por usuário
- `game_requests` - Solicitações de acesso a jogos

#### Sistema de Psicólogos
- `psychologist_patients` - Relacionamento psicólogo-paciente
- `game_scores` - Pontuações dos jogos

---

## 🔐 Segurança

### Autenticação
- JWT tokens com expiração de 24h
- Refresh tokens com expiração de 7 dias
- Tokens armazenados de forma segura no launcher

### RLS (Row Level Security)
- Políticas de acesso em nível de linha
- Separação entre users, admins e psychologists
- Service role para operações do backend

### Proteção de Conteúdo
- Jogos protegidos com tokens de sessão
- Validação de assinatura em tempo real
- Verificação de acesso antes de jogar

---

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta Asaas (para pagamentos)
- Conta Render.com (backend)
- Conta Vercel (admin)

### Setup Local

#### Backend
```bash
cd biosync-backend
npm install
cp .env.example .env
# Configurar variáveis de ambiente
npm run dev
```

#### Admin Panel
```bash
cd biosync-admin
npm install
# Configurar VITE_API_URL no .env
npm run dev
```

#### Launcher
```bash
cd biosync-launcher
npm install
# Configurar API_URL
npm run dev
```

---

## 📞 Suporte

### Problemas Comuns
Ver [setup/PRIMEIRO_ACESSO.md](setup/PRIMEIRO_ACESSO.md) para troubleshooting.

### Logs e Debugging
- **Backend:** Logs no Render.com
- **Admin:** Console do navegador
- **Launcher:** DevTools do Electron (Ctrl+Shift+I)

---

## 📝 Changelog e Versões

### v2.1.0 (Atual) - NeuroOne
- Sistema de psicólogos e pontuações
- Dashboard de análise de pacientes
- Gráficos de evolução (Recharts)
- Validação rigorosa de imagens
- Rebrand completo NeuroGame → NeuroOne

### v2.0.0 - BioSync
- Sistema de assinaturas (PIX + Cartão)
- Integração Asaas completa
- Webhooks automáticos
- Launcher desktop (Electron)
- Admin panel completo

---

## 🤝 Contribuindo

Para contribuir com o projeto:
1. Leia a documentação técnica relevante
2. Siga os padrões de código existentes
3. Teste localmente antes de fazer deploy
4. Documente mudanças significativas

---

## 📄 Licença

© 2025 NeuroOne - Todos os direitos reservados

---

**Última atualização:** 16 de Outubro de 2025
**Versão da documentação:** 2.1.0
