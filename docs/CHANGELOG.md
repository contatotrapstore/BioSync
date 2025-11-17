# 📝 Changelog - NeuroOne Platform

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [2.4.0] - 2025-11-17 🚀 PRODUÇÃO

### ✨ Adicionado

#### Sistema de Exportação PDF
- **Utils**: `pdfExport.js` com funções de geração de relatórios profissionais
  - `generateSessionReport()`: Relatório individual de sessão com métricas EEG
  - `generateStudentSummary()`: Resumo consolidado de múltiplas sessões
- **Features**: Interpretação automática de métricas (atenção, relaxamento)
- **Design**: Layout profissional com cores NeuroOne e tabelas formatadas
- **Biblioteca**: jspdf + jspdf-autotable para PDFs de alta qualidade

#### Página de Histórico do Aluno
- **StudentHistory.jsx**: Página completa com 375 linhas de código
  - Cards de estatísticas: Total de sessões, atenção média, relaxamento médio, pontuação total
  - Filtros temporais: Todos, Último Mês, Última Semana
  - Grid responsivo de sessões com Material-UI
  - Botões de exportação individual e em lote
  - Integração com Supabase (queries com joins e filtros)

#### Configurações de Deploy
- **Backend**:
  - `.env.example` (98 linhas) com documentação completa
  - `railway.json` para Railway.app
  - `render.yaml` para Render.com
  - `ecosystem.config.js` para PM2 (cluster mode, 2 instâncias)
- **Frontend**:
  - `.env.example` (61 linhas) com variáveis VITE_
  - `vercel.json` para Vercel
  - `netlify.toml` para Netlify

#### Testes Backend
- 29 testes passando (100% do implementado)
- Suporte cross-platform com `cross-env`

### 🎨 Alterado
- **Documentação**: Fases 1-4 marcadas como "✅ CONCLUÍDA"
- **Checklist**: Progresso atualizado para 89% (124/140 tasks)
- **Cronograma**: Nota sobre conclusão antecipada

### 🗑️ Removido
- 28 arquivos de documentação redundantes:
  - 10 arquivos de progresso diário (DIA-*.md)
  - 4 arquivos de checklist e credenciais de teste
  - 8 arquivos de implementação CRUD
  - 6 arquivos de consolidação de sprints

### 📦 Dependências
- **Frontend**: `jspdf@^2.5.2`, `jspdf-autotable@^3.8.4`

### 🚀 Deploy Ready
- ✅ Backend configurado para: Railway, Render, VPS (PM2)
- ✅ Frontend configurado para: Vercel, Netlify
- ✅ Variáveis de ambiente documentadas
- ✅ Health checks configurados
- ✅ 29 testes backend passando

---

## [2.3.0] - 2025-11-04

### ✨ Adicionado

#### Sistema de Distribuição Multiplataforma
- **Admin Panel**: Checkboxes para seleção de plataformas (PC/Mobile) ao criar/editar jogos
- **Backend**: Filtragem automática de jogos por query parameter `?platform=pc|mobile`
- **Database**: Campo `supported_platforms` (VARCHAR[] array) na tabela `games`
- **Database**: Índice GIN `idx_games_platforms` para performance otimizada
- **Launcher PC**: Filtra jogos apenas com `supported_platforms` contendo 'pc'
- **Mobile App**: Filtra jogos apenas com `supported_platforms` contendo 'mobile'

#### Mobile App Android
- Aplicativo mobile completo (React + TypeScript + Capacitor 7)
- Build APK release funcional (3.5MB)
- Autenticação JWT
- Download e execução de jogos
- Sistema de pontuação
- Interface Material-UI responsiva

#### Documentação
- `neuroone-mobile/README.md` - Documentação completa do app mobile
- `docs/ARCHITECTURE.md` - Arquitetura técnica do sistema
- `docs/CHANGELOG.md` - Histórico de versões
- `docs/TROUBLESHOOTING.md` - Guia de resolução de problemas

### 🎨 Alterado

#### Rebrand Visual NeuroWork → NeuroOne
- **Launcher PC**: Telas de carregamento dos 13 jogos
  - Antes: Gradiente azul → verde (`#4A90E2` → `#7ED321`)
  - Depois: Gradiente escuro → dourado (`#0a0d1a` → `#ffd913`)
- **PaymentAlert**: Botão hover verde → dourado escuro (`#1a7340` → `#c7a300`)
- **GameLibrary**: Acento radial verde → amarelo (rgba(82, 202, 126) → rgba(255, 217, 19))

#### Nomes de Projeto
- `docs/deploy/GUIA_DEPLOY_PRODUCAO.md`: "NeuroGame" → "NeuroOne"
- Referências de pastas: `neurogame-*` → `biosync-*`
- URLs de exemplo atualizadas

#### Documentação Atualizada
- `docs/README.md`: Adicionado seção Mobile App e sistema de plataformas
- `docs/README.md`: Changelog atualizado para v2.3.0
- `docs/deploy/GUIA_DEPLOY_PRODUCAO.md`: Nova seção "Sistema de Distribuição Multiplataforma"

### 🐛 Corrigido
- **Backend**: Removida sintaxe TypeScript inválida em `gameController.js:230`
  - Erro: `let accessType: string | null = null;`
  - Fix: `let accessType = null;`
- **Deploy**: Corrigido erro de build no Render.com

### 📦 Build
- Launcher PC v2.2.0 compilado com novas cores NeuroOne
- Mobile App v2.3.0 APK gerado: `BioSync-Mobile-v2.3.0-platform-filter-20250104.apk`

---

## [2.2.0] - 2025-10-16

### ✨ Adicionado

#### Sistema de Psicólogos e Pacientes
- Tabela `psychologist_patients` para relacionamento psicólogo-paciente
- RLS policies para psicólogos visualizarem dados de pacientes
- Dashboard de psicólogos no admin panel

#### Sistema de Pontuações
- Tabela `game_scores` para armazenar pontuações de jogos
- Endpoints para criar e visualizar scores
- Gráficos de evolução com Recharts
- Filtros por jogo, usuário e período

#### Features Admin
- Dashboard de análise de pacientes
- Gráficos de evolução de pontuações
- Visualização de progresso por jogo

### 🎨 Alterado
- Rebrand completo: **NeuroGame → NeuroOne**
- Logo atualizada em todos os componentes
- Cores primárias ajustadas

### 📚 Documentação
- Migração completa documentada em `docs/migration/HISTORICO_MIGRACAO_NEUROGAME.md`

---

## [2.1.0] - 2025-10-09

### ✨ Adicionado

#### Integração de Pagamentos
- Sistema de assinaturas completo
- Integração Asaas API
- Suporte a PIX e Cartão de Crédito
- Webhooks para notificações automáticas

#### Tabelas de Pagamento
- `subscription_plans` - Planos de assinatura
- `user_subscriptions` - Assinaturas ativas
- `payments` - Histórico de pagamentos
- `asaas_webhooks` - Log de webhooks

#### Features Backend
- Endpoint `/api/v1/payments/create` - Criar pagamento
- Endpoint `/api/v1/webhooks/asaas` - Receber webhooks
- Validação de assinatura ativa antes de jogar

### 🔒 Segurança
- Webhook signature validation
- Rate limiting em endpoints sensíveis

---

## [2.0.0] - 2025-10-09

### ✨ Adicionado - Versão Inicial BioSync

#### Backend API
- Node.js + Express + Supabase
- Autenticação JWT com refresh tokens
- CRUD completo de usuários
- CRUD completo de jogos
- Sistema de sessões do launcher
- Validação com express-validator
- Middleware de autenticação
- CORS configurado

#### Admin Panel
- React 18 + Material-UI v5
- Dashboard administrativo
- Gestão de usuários
- Gestão de jogos (upload de arquivos)
- Gestão de assinaturas
- Visualização de métricas

#### Launcher Desktop
- Electron + React 18
- Sistema de autenticação
- Biblioteca de jogos
- Download e instalação de jogos
- Proteção de conteúdo (session tokens)
- Sistema de auto-atualização
- 13 jogos integrados:
  - Autorama
  - Balão
  - Batalha de Tanques
  - Correndo pelos Trilhos
  - Desafio Aéreo
  - Desafio Automotivo
  - Desafio nas Alturas
  - Fazendinha
  - Labirinto
  - Missão Espacial
  - Resgate em Chamas
  - Taxi City
  - Tesouro do Mar

#### Database (Supabase)
- PostgreSQL 15
- Row Level Security (RLS)
- Tabelas principais:
  - `users` - Usuários
  - `games` - Jogos
  - `launcher_sessions` - Sessões
  - `user_game_access` - Acessos individuais
  - `access_history` - Histórico de acessos

#### Documentação
- README completo
- Guias de setup
- Documentação de API
- Guias de deploy

### 🔒 Segurança Inicial
- JWT com secrets fortes
- CORS restrito
- RLS em todas as tabelas
- Passwords com bcrypt
- SQL injection protection

---

## 📋 Tipos de Mudanças

- `✨ Adicionado` - Para novas funcionalidades
- `🎨 Alterado` - Para mudanças em funcionalidades existentes
- `🗑️ Depreciado` - Para funcionalidades que serão removidas
- `🐛 Corrigido` - Para correção de bugs
- `🔒 Segurança` - Para correções de vulnerabilidades
- `📦 Build` - Para mudanças no sistema de build
- `📚 Documentação` - Para mudanças na documentação
- `♻️ Refatoração` - Para refatorações de código

---

## 🔮 Roadmap (Próximas Versões)

### [2.4.0] - Planejado
- [ ] iOS support para mobile app
- [ ] Sistema de achievements/conquistas
- [ ] Multiplayer básico (WebSockets)
- [ ] Notificações push (mobile)
- [ ] Dark mode no admin panel
- [ ] Cache Redis para performance

### [2.5.0] - Planejado
- [ ] Analytics dashboard
- [ ] A/B testing de jogos
- [ ] Sistema de recomendações
- [ ] Export de relatórios (PDF/Excel)
- [ ] API GraphQL alternativa
- [ ] Internacionalização (i18n)

### [3.0.0] - Futuro
- [ ] Migração para microserviços
- [ ] Kubernetes deployment
- [ ] Machine Learning para recomendações
- [ ] VR/AR support
- [ ] Blockchain integration (NFTs de conquistas)

---

**Formato do Changelog**: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
**Versionamento**: [Semantic Versioning](https://semver.org/lang/pt-BR/)

**Última atualização**: 2025-11-04
**Versão atual**: 2.3.0
**Plataforma**: NeuroOne
