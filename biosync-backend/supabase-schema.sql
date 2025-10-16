-- NeuroOne Platform - Supabase Schema
-- Execute este script no SQL Editor do Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- USERS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9]+$'),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- GAMES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description TEXT,
  cover_image VARCHAR(255),
  folder_path VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- SUBSCRIPTION PLANS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- USER SUBSCRIPTIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- PLAN GAMES (Many-to-Many)
-- =======================
CREATE TABLE IF NOT EXISTS plan_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, game_id)
);

-- =======================
-- USER GAME ACCESS (Individual permissions)
-- =======================
CREATE TABLE IF NOT EXISTS user_game_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- =======================
-- ACCESS HISTORY (Logs)
-- =======================
CREATE TABLE IF NOT EXISTS access_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_duration INTEGER,
  ip_address VARCHAR(45)
);

-- =======================
-- INDEXES
-- =======================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Games
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_games_order ON games("order");

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);

-- Plan Games
CREATE INDEX IF NOT EXISTS idx_plan_games_plan_id ON plan_games(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_games_game_id ON plan_games(game_id);

-- User Game Access
CREATE INDEX IF NOT EXISTS idx_user_game_access_user_id ON user_game_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_access_game_id ON user_game_access(game_id);

-- Access History
CREATE INDEX IF NOT EXISTS idx_access_history_user_id ON access_history(user_id);
CREATE INDEX IF NOT EXISTS idx_access_history_game_id ON access_history(game_id);
CREATE INDEX IF NOT EXISTS idx_access_history_accessed_at ON access_history(accessed_at);

-- =======================
-- TRIGGERS para updated_at
-- =======================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_games_updated_at BEFORE UPDATE ON plan_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_access_updated_at BEFORE UPDATE ON user_game_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ROW LEVEL SECURITY (RLS)
-- =======================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_history ENABLE ROW LEVEL SECURITY;

-- Policies para USERS
-- Service role tem acesso total (bypass RLS)
-- Anon key tem acesso limitado

CREATE POLICY "Service role has full access to users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policies para GAMES
CREATE POLICY "Service role has full access to games"
  ON games FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read active games"
  ON games FOR SELECT
  USING (is_active = true);

-- Policies para SUBSCRIPTION_PLANS
CREATE POLICY "Service role has full access to plans"
  ON subscription_plans FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Policies para USER_SUBSCRIPTIONS
CREATE POLICY "Service role has full access to user subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policies para PLAN_GAMES
CREATE POLICY "Service role has full access to plan_games"
  ON plan_games FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read plan_games"
  ON plan_games FOR SELECT
  USING (true);

-- Policies para USER_GAME_ACCESS
CREATE POLICY "Service role has full access to user_game_access"
  ON user_game_access FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own game access"
  ON user_game_access FOR SELECT
  USING (auth.uid() = user_id);

-- Policies para ACCESS_HISTORY
CREATE POLICY "Service role has full access to access_history"
  ON access_history FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read their own access history"
  ON access_history FOR SELECT
  USING (auth.uid() = user_id);

-- =======================
-- COMENTÁRIOS
-- =======================

COMMENT ON TABLE users IS 'Usuários da plataforma (administradores e jogadores)';
COMMENT ON TABLE games IS 'Catálogo de jogos HTML5 disponíveis';
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura (Básico, Premium, etc)';
COMMENT ON TABLE user_subscriptions IS 'Assinaturas ativas dos usuários';
COMMENT ON TABLE plan_games IS 'Associação entre planos e jogos (many-to-many)';
COMMENT ON TABLE user_game_access IS 'Acesso individual a jogos (fora da assinatura)';
COMMENT ON TABLE access_history IS 'Histórico de acessos aos jogos';

-- =======================
-- CONCLUÍDO
-- =======================
-- Schema criado com sucesso!
-- Próximo passo: Execute o arquivo supabase-seeds.sql para popular com dados iniciais

