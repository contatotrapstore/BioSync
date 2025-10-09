# NeuroGame Backend API

API REST em Node.js/Express respons�vel pela autentica��o, cat�logo de jogos e gest�o de assinaturas da plataforma NeuroGame.

## Tecnologias

- Node.js 18+
- Express.js
- Supabase (PostgreSQL gerenciado)
- JWT para autentica��o
- Bcrypt para hash de senhas
- Helmet, CORS e rate limiting para seguran�a

## Pr�-requisitos

1. Conta e projeto ativo no [Supabase](https://supabase.com)
2. Node.js 18 ou superior instalado
3. Clonar este reposit�rio e instalar depend�ncias

```bash
npm install
```

## Configura��o

1. Copie o arquivo de exemplo e preencha com as credenciais do Supabase e chaves JWT:

```bash
cp .env.example .env
```

2. Abra `.env` e informe:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET` e `JWT_REFRESH_SECRET`
   - Ajuste `CORS_ORIGIN` se necess�rio (j� inclui o dashboard em `http://localhost:3001` e o launcher em `http://localhost:5174`)

3. No painel do Supabase, execute os arquivos `supabase-schema.sql` e `supabase-seeds.sql` (pasta raiz do projeto) usando o SQL Editor para criar tabelas, pol�ticas RLS e dados iniciais (admin, demo, jogos e planos).

## Executando

### Desenvolvimento

```bash
npm run dev
```

### Produ��o

```bash
npm start
```

Por padr�o o servidor escuta em `http://localhost:3000` e exp�e os jogos est�ticos via `/games` apontando para `../Jogos`.

## Principais Endpoints

| M�todo | Endpoint | Descri��o | Autentica��o |
|--------|----------|-----------|--------------|
| POST   | `/api/v1/auth/login`         | Login de usu�rio | N�o |
| POST   | `/api/v1/auth/refresh-token` | Renovar token    | N�o |
| GET    | `/api/v1/auth/profile`       | Perfil do usu�rio autenticado | JWT |
| GET    | `/api/v1/games`              | Lista de jogos (admin) | JWT |
| GET    | `/api/v1/games/user/games`   | Jogos acess�veis ao usu�rio atual | JWT |
| GET    | `/api/v1/games/:id/validate` | Valida acesso a um jogo | JWT |
| GET    | `/api/v1/users`              | Gest�o de usu�rios (admin) | JWT + admin |
| GET    | `/api/v1/subscriptions`      | Gest�o de assinaturas (admin) | JWT + admin |

A pasta `src/controllers` cont�m o detalhamento de cada opera��o.

## Teste r�pido da API

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

## Scripts dispon�veis

- `npm start` � inicia o servidor
- `npm run dev` � inicia com recarga autom�tica via nodemon
- `npm test` � executa testes (placeholder)

## Credenciais de exemplo

As seeds criam dois usu�rios padr�o (lembre-se de trocar em produ��o):

| Perfil | Usu�rio | Senha |
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
- `controllers` concentram a l�gica de neg�cio usando Supabase
- `middleware/auth.js` valida tokens JWT e privil�gios de admin

## Seguran�a

- JWT com expira��o (24h) e refresh tokens (7 dias)
- Rate limiting (100 requisi��es / 15 min)
- Helmet para headers de seguran�a
- CORS configur�vel via `.env`
- Criptografia de senha com bcrypt (salt rounds = 10)

## Supabase

Scripts auxiliares na raiz:

- `supabase-schema.sql` � cria tabelas, RLS e fun��es
- `supabase-seeds.sql` � popula dados iniciais
- `generate-password-hashes.js` / `update-passwords.js` � utilidades para ajustar hashes no Supabase

Execute-os conforme necess�rio pelo SQL Editor ou via script `node update-passwords.js` ap�s definir as credenciais.

## Licen�a

MIT
