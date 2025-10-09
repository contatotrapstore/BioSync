# 🎮 BioSync - Plataforma de Distribuição de Jogos Educacionais

**Versão:** 1.0.0 | **Status:** 🚧 Em Configuração | **Data:** 09/10/2025

Sistema completo de distribuição e gerenciamento de jogos educacionais com launcher desktop, painel administrativo e backend robusto.

---

## 📦 Estrutura do Projeto

```
biosync/
├── biosync-launcher/     # Launcher Desktop (Electron + React)
├── biosync-admin/        # Painel Admin (React + Material-UI)
├── biosync-backend/      # API Backend (Node.js + Express)
├── Jogos/                # Jogos HTML5 (13 jogos)
└── SUPABASE_SETUP_INSTRUCTIONS.md
```

---

## 🚀 Quick Start

### 1. Configurar Supabase
Siga as instruções em: [SUPABASE_SETUP_INSTRUCTIONS.md](./SUPABASE_SETUP_INSTRUCTIONS.md)

### 2. Backend
```bash
cd biosync-backend
cp .env.example .env
# Edite .env com suas credenciais Supabase
npm install
npm run dev
```

### 3. Admin Panel
```bash
cd biosync-admin
cp .env.example .env
# Configure VITE_API_URL
npm install
npm run dev
```

### 4. Launcher
```bash
cd biosync-launcher
npm install
npm run dev
```

---

## 🎮 Catálogo de Jogos (13)

| # | Jogo | Categoria | Tamanho |
|---|------|-----------|---------|
| 1 | Autorama | Corrida | 19.1 MB |
| 2 | Balão | Aventura | 11.3 MB |
| 3 | Batalha de Tanques | Ação | 8.9 MB |
| 4 | Correndo pelos Trilhos | Corrida | 39.9 MB |
| 5 | Desafio Aéreo | Simulação | 40.3 MB |
| 6 | Desafio Automotivo | Corrida | 23.3 MB |
| 7 | Desafio nas Alturas | Aventura | 45.7 MB |
| 8 | Fazendinha | Simulação | 8.7 MB |
| 9 | Labirinto | Puzzle | 2.2 MB |
| 10 | Missão Espacial | Aventura | 16.3 MB |
| 11 | Resgate em Chamas | Ação | 3.8 MB |
| 12 | Taxi City | Simulação | 19.4 MB |
| 13 | Tesouro do Mar | Aventura | 21.7 MB |

**Total:** ~268 MB

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT com refresh tokens
- **Pagamentos:** Asaas API
- **Deploy:** Render.com

### Admin Panel
- **Framework:** React 18 + Vite
- **UI:** Material-UI (MUI)
- **Estado:** React Query
- **Deploy:** Vercel

### Launcher
- **Desktop:** Electron 29
- **Frontend:** React 18 + Material-UI
- **Auto-update:** electron-builder
- **Storage:** electron-store

---

## 🔐 Credenciais Padrão

### Admin Panel
- Email: `admin@biosync.com`
- Senha: `Admin123`

### Demo User
- Email: `demo@biosync.com`
- Senha: `Demo@123456`

⚠️ **Altere as senhas em produção!**

---

## 📊 Configuração de Deploy

### Render (Backend)
```yaml
services:
  - type: web
    name: biosync-backend
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Vercel (Admin)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 🔄 Sistema de Assinaturas

### Planos Disponíveis
- **Básico:** R$ 19,90/mês - 5 jogos
- **Premium:** R$ 39,90/mês - Todos os jogos
- **Educacional:** R$ 99,90/3 meses - Personalizado

### Integração Asaas
- PIX instantâneo
- Cartão de crédito
- Webhooks automáticos
- Renovação recorrente

---

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
SUPABASE_URL=https://uszmhhukjohjarplnlmp.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
ASAAS_API_KEY=...
PORT=10000
```

### Admin (.env)
```env
VITE_API_URL=https://biosync-backend.onrender.com
```

---

## 🧪 Testes e Validação

### Backend
```bash
npm test
npm run test:coverage
```

### Build do Launcher
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📚 Documentação Adicional

- [Configuração Supabase](./SUPABASE_SETUP_INSTRUCTIONS.md)
- [Deploy Backend](./biosync-backend/DEPLOY_RENDER.md)
- [Deploy Admin](./biosync-admin/DEPLOY_VERCEL.md)
- [Changelog](./CHANGELOG.md)

---

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard/project/uszmhhukjohjarplnlmp
- **Asaas Docs:** https://docs.asaas.com
- **Render Dashboard:** https://dashboard.render.com

---

**Desenvolvido com ❤️ pela equipe BioSync**
