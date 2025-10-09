# NeuroGame Backend API

API REST em Node.js/Express responsável pela autenticação, catálogo de jogos e gestão de assinaturas da plataforma NeuroGame.

## Tecnologias

- Node.js 18+
- Express.js
- Supabase (PostgreSQL gerenciado)
- JWT para autenticação
- Bcrypt para hash de senhas
- Helmet, CORS e rate limiting para segurança

## Pré-requisitos

1. Conta e projeto ativo no [Supabase](https://supabase.com)
2. Node.js 18 ou superior instalado
3. Clonar este repositório e instalar dependências

```bash
npm install
```

## Configuração

1. Copie o arquivo de exemplo e preencha com as credenciais do Supabase e chaves JWT:

```bash
cp .env.example .env
```

2. Abra `.env` e informe:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET` e `JWT_REFRESH_SECRET`
   - Ajuste `CORS_ORIGIN` se necessário (já inclui o dashboard em `http://localhost:3001` e o launcher em `http://localhost:5174`)

3. No painel do Supabase, execute os arquivos `supabase-schema.sql` e `supabase-seeds.sql` (pasta raiz do projeto) usando o SQL Editor para criar tabelas, políticas RLS e dados iniciais (admin, demo, jogos e planos).

## Executando

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

Por padrão o servidor escuta em `http://localhost:3000` e expõe os jogos estáticos via `/games` apontando para `../Jogos`.

## Principais Endpoints

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST   | `/api/v1/auth/login`         | Login de usuário | Não |
| POST   | `/api/v1/auth/refresh-token` | Renovar token    | Não |
| GET    | `/api/v1/auth/profile`       | Perfil do usuário autenticado | JWT |
| GET    | `/api/v1/games`              | Lista de jogos (admin) | JWT |
| GET    | `/api/v1/games/user/games`   | Jogos acessíveis ao usuário atual | JWT |
| GET    | `/api/v1/games/:id/validate` | Valida acesso a um jogo | JWT |
| GET    | `/api/v1/users`              | Gestão de usuários (admin) | JWT + admin |
| GET    | `/api/v1/subscriptions`      | Gestão de assinaturas (admin) | JWT + admin |

A pasta `src/controllers` contém o detalhamento de cada operação.

## Teste rápido da API

```bash
curl http://localhost:3000/api/v1/health
```

Resposta esperada:

```json
{
  "success": true,
  "message": "NeuroGame API is running",
  "timestamp": "2025-10-03T12:34:56.789Z"
}
```

## Scripts disponíveis

- `npm start` – inicia o servidor
- `npm run dev` – inicia com recarga automática via nodemon
- `npm test` – executa testes (placeholder)

## Credenciais de exemplo

As seeds criam dois usuários padrão (lembre-se de trocar em produção):

| Perfil | Usuário | Senha |
|--------|---------|-------|
| Admin  | `admin` | `Admin@123456` |
| Demo   | `demo`  | `Demo@123456`  |

## Estrutura do projeto

```
src/
  config/
    supabase.js
  controllers/
  middleware/
  routes/
  services/
  utils/
server.js
```

- `config/supabase.js` inicializa clientes com service/anon key
- `controllers` concentram a lógica de negócio usando Supabase
- `middleware/auth.js` valida tokens JWT e privilégios de admin

## Segurança

- JWT com expiração (24h) e refresh tokens (7 dias)
- Rate limiting (100 requisições / 15 min)
- Helmet para headers de segurança
- CORS configurável via `.env`
- Criptografia de senha com bcrypt (salt rounds = 10)

## Supabase

Scripts auxiliares na raiz:

- `supabase-schema.sql` – cria tabelas, RLS e funções
- `supabase-seeds.sql` – popula dados iniciais
- `generate-password-hashes.js` / `update-passwords.js` – utilidades para ajustar hashes no Supabase

Execute-os conforme necessário pelo SQL Editor ou via script `node update-passwords.js` após definir as credenciais.

## Licença

MIT
