# 🧠 NeuroOne Educacional

**Sistema de Neurofeedback Educacional com monitoramento EEG em tempo real**

**Versão:** 2.5.0 | **Status:** 🚀 Pronto para Produção | **Última Atualização:** 18/11/2025

---

## 📖 Sobre o Projeto

NeuroOne é uma plataforma educacional inovadora que utiliza **neurofeedback** baseado em EEG (eletroencefalografia) para auxiliar professores no monitoramento da atenção e relaxamento de alunos durante sessões em sala de aula.

### 🎯 Principais Funcionalidades

- **Dashboard de Direção**: Gestão completa de usuários, turmas e sessões
- **Painel do Professor**: Criação e monitoramento de sessões em tempo real
- **App do Aluno (PWA)**: Conexão Bluetooth com headset EEG, participação em sessões
- **🎮 Jogos Neurofeedback**: Fazendinha 3D + Monitor EEG standalone (Novo v2.5.0!)
- **Monitoramento EEG**: Visualização de ondas cerebrais (Delta, Theta, Alpha, Beta, Gamma)
- **Relatórios em PDF**: Exportação profissional de métricas de sessões
- **WebSocket Real-Time**: Comunicação bidirecional para dados EEG instantâneos

---

## 📚 Documentação Completa

A documentação está organizada na pasta [docs/](docs/):

### 📘 Documentos Principais
- **[00-PROJETO-OVERVIEW.md](docs/00-PROJETO-OVERVIEW.md)** - Visão geral do projeto
- **[START-HERE.md](docs/START-HERE.md)** - Por onde começar
- **[JOGOS.md](JOGOS.md)** - Jogos de neurofeedback integrados

### 🏗️ Arquitetura
- **[03-ARQUITETURA.md](docs/03-ARQUITETURA.md)** - Arquitetura do sistema
- **[04-DATABASE-SCHEMA.md](docs/04-DATABASE-SCHEMA.md)** - Schema do banco de dados
- **[05-API-ENDPOINTS.md](docs/05-API-ENDPOINTS.md)** - Documentação da API REST
- **[06-WEBSOCKET-SPEC.md](docs/06-WEBSOCKET-SPEC.md)** - Especificação WebSocket

### 🔧 Implementação
- **[14-SERVIDOR-PYTHON-EEG.md](docs/14-SERVIDOR-PYTHON-EEG.md)** - Servidor Python para EEG
- **[15-DISPOSITIVO-EEG-TGAM.md](docs/15-DISPOSITIVO-EEG-TGAM.md)** - Integração com TGAM
- **[24-JOGOS-NEUROFEEDBACK.md](docs/24-JOGOS-NEUROFEEDBACK.md)** - Jogos de neurofeedback

### 🚀 Deploy
- **[DEPLOY.md](DEPLOY.md)** - Guia completo de deploy em produção
- **[18-DEPLOY-INFRAESTRUTURA.md](docs/18-DEPLOY-INFRAESTRUTURA.md)** - Infraestrutura e deploy

### 📋 Planejamento
- **[19-CHECKLIST-COMPLETO.md](docs/19-CHECKLIST-COMPLETO.md)** - Checklist de tarefas (89% concluído)
- **[20-CRONOGRAMA.md](docs/20-CRONOGRAMA.md)** - Cronograma detalhado

---

## 🏗️ Arquitetura

```
neuroone-platform/
├── neuroone-frontend/      # React 18 + Vite + Material-UI
│   ├── pages/admin/        # Módulo Direção
│   ├── pages/teacher/      # Módulo Professor
│   ├── pages/student/      # Módulo Aluno (PWA)
│   └── services/           # API client + Supabase
│
├── neuroone-backend/       # Node.js 18 + Express
│   ├── routes/             # REST API endpoints
│   ├── websocket/          # Socket.io server
│   ├── public/games/       # 🎮 Jogos neurofeedback
│   ├── public/monitor/     # 📊 Monitor EEG standalone
│   └── __tests__/          # 29 testes passando
│
└── docs/                   # Documentação completa
```

### Backend (Express + Socket.io)
- **API REST**: Autenticação JWT, CRUD de usuários/turmas/sessões
- **WebSocket**: Transmissão real-time de dados EEG via Socket.io
- **Database**: PostgreSQL 17 no Supabase com RLS policies
- **Deploy Options**: Railway, Render, VPS (PM2)
- **Testes**: 29 testes passando (Jest + Supertest)

### Frontend (React + Vite)
- **React 18**: Functional components, hooks, context API
- **Material-UI v5**: Design system completo
- **Supabase Client**: Queries, Auth, RLS
- **PWA**: Service Worker, Web Bluetooth API
- **Deploy Options**: Vercel, Netlify

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL (ou conta Supabase)
- Git

### 1. Clone o Repositório
```bash
git clone https://github.com/your-org/neuroone.git
cd neuroone
```

### 2. Configure o Backend
```bash
cd neuroone-backend
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

npm run dev
```

### 3. Configure o Frontend
```bash
cd neuroone-frontend
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com a URL do backend

npm run dev
```

### 4. Acesse o Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **Health Check**: http://localhost:3001/health
- **🎮 Jogo Fazendinha**: http://localhost:3001/games/fazendinha/index.html
- **📊 Monitor EEG**: http://localhost:3001/monitor/eeg-monitor.html

---

## 📊 Progresso do Projeto

```
Fase 1: Fundação            [x] 100% ✅ CONCLUÍDA
Fase 2: Módulo Direção      [x] 100% ✅ CONCLUÍDA
Fase 3: Módulo Professor    [x] 100% ✅ CONCLUÍDA
Fase 4: Módulo Aluno PWA    [x] 100% ✅ IMPLEMENTADA
Fase 5: Relatórios & Deploy [~] 67%  🔄 EM ANDAMENTO
Fase 6: Launcher Desktop    [ ] 0%   ⏳ PENDENTE
Fase 7: Testes & QA         [~] 75%  🔄 29 TESTES PASSANDO

TOTAL: [~] 124/140 tarefas (89%) 🚀 PRONTO PARA PRODUÇÃO
```

Ver [19-CHECKLIST-COMPLETO.md](docs/19-CHECKLIST-COMPLETO.md) para detalhes.

---

## 💾 Database Schema

**Plataforma:** Supabase PostgreSQL 17
**Region:** South America (sa-east-1)

### Tabelas Principais
- **users**: Usuários (direção, professor, aluno)
- **classes**: Turmas escolares
- **class_students**: Relacionamento turma-aluno
- **sessions**: Sessões de neurofeedback
- **session_participants**: Alunos participantes
- **eeg_data**: Dados brutos do EEG (ondas cerebrais)
- **session_metrics**: Métricas agregadas de sessões
- **student_metrics**: Métricas individuais de alunos

Ver [04-DATABASE-SCHEMA.md](docs/04-DATABASE-SCHEMA.md) para schema completo.

---

## 🛠️ Stack Tecnológica

### Backend
- Node.js 18.x
- Express.js 4.x
- Socket.io 4.x
- Supabase (PostgreSQL 17)
- JWT Authentication
- Jest + Supertest

### Frontend
- React 18.x
- Vite 5.x
- Material-UI 5.x
- React Router 6.x
- Supabase Client
- jsPDF (relatórios PDF)
- Recharts (gráficos)

### DevOps
- PM2 (process manager)
- Railway / Render (backend)
- Vercel / Netlify (frontend)
- GitHub Actions (CI/CD)

---

## 🔐 Segurança

- **Autenticação**: JWT tokens com refresh
- **Row Level Security**: Políticas RLS no Supabase
- **CORS**: Configuração restritiva
- **Validação**: Joi schemas em todas as rotas
- **Sanitização**: Proteção contra XSS e SQL injection
- **HTTPS**: TLS 1.3 em produção
- **Rate Limiting**: Proteção contra DDoS

Ver [17-SEGURANCA-LGPD.md](docs/17-SEGURANCA-LGPD.md) para detalhes.

---

## 📦 Deploy em Produção

### Opções de Deploy

#### Backend
- **Railway**: Deploy automático via `railway.json`
- **Render**: Deploy via `render.yaml`
- **VPS**: PM2 cluster mode (2 instâncias)

#### Frontend
- **Vercel**: Deploy automático via `vercel.json`
- **Netlify**: Deploy via `netlify.toml`

### Guias de Deploy
- [DEPLOY.md](DEPLOY.md) - Guia completo de deploy
- [neuroone-backend/.env.example](neuroone-backend/.env.example) - Variáveis backend
- [neuroone-frontend/.env.example](neuroone-frontend/.env.example) - Variáveis frontend

---

## 🧪 Testes

### Backend
```bash
cd neuroone-backend
npm test                    # Rodar todos os testes
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

**Status**: 29/29 testes passando ✅

### Frontend
```bash
cd neuroone-frontend
npm run test
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guidelines.

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📜 Changelog

Ver [docs/CHANGELOG.md](docs/CHANGELOG.md) para histórico completo de versões.

### Última Versão: 2.5.0 (18/11/2025)
- 🎮 Integração de jogos neurofeedback: Fazendinha 3D com controles EEG
- 📊 Monitor EEG standalone para visualização em tempo real
- 🎯 Servidor Express configurado para servir jogos em `/games` e `/monitor`
- 📚 Documentação JOGOS.md com guia completo de jogos
- 🗑️ Limpeza de 13 arquivos .md obsoletos
- ✨ Sistema 100% funcional com neurofeedback via Web Bluetooth API

---

## 📞 Suporte

- **Documentação**: Consulte [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/neuroone/issues)
- **Glossário**: [docs/23-GLOSSARIO.md](docs/23-GLOSSARIO.md)

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- Equipe de desenvolvimento NeuroOne
- Comunidade open-source
- Professores e alunos que participaram dos testes

---

**Desenvolvido com ❤️ e 🧠 pela equipe NeuroOne Educacional**
