-- BioSync Platform - Complete Supabase Schema
-- Execute este script no SQL Editor do Supabase para criar todas as tabelas

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- USERS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  access_code VARCHAR(50) UNIQUE,
  asaas_customer_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Usuários da plataforma (administradores e jogadores)';
COMMENT ON COLUMN users.access_code IS 'Código único permanente para login no launcher (formato: BIO-XXXX-XXXX)';
COMMENT ON COLUMN users.username IS 'Nome de usuário único para login alternativo ao email';

-- =======================
-- GAMES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description TEXT,
  cover_image VARCHAR(255),
  folder_path VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  version VARCHAR(50) DEFAULT '1.0.0',
  download_url TEXT,
  file_size BIGINT,
  checksum VARCHAR(255),
  installer_type VARCHAR(50) DEFAULT 'exe',
  minimum_disk_space BIGINT,
  cover_image_local TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE games IS 'Catálogo de jogos HTML5 disponíveis';
COMMENT ON COLUMN games.version IS 'Versão semântica do jogo (ex: 1.0.0)';
COMMENT ON COLUMN games.download_url IS 'URL completa para download do instalador';
COMMENT ON COLUMN games.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN games.checksum IS 'SHA256 do arquivo para validação de integridade';
COMMENT ON COLUMN games.installer_type IS 'Tipo de instalador (exe, msi, zip)';
COMMENT ON COLUMN games.minimum_disk_space IS 'Espaço mínimo em disco necessário (bytes)';
COMMENT ON COLUMN games.cover_image_local IS 'Caminho local da capa no launcher (assets/covers/...)';

-- =======================
-- SUBSCRIPTION_PLANS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE subscription_plans IS 'Planos de assinatura (Básico, Premium, etc)';

-- =======================
-- USER_SUBSCRIPTIONS TABLE
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

COMMENT ON TABLE user_subscriptions IS 'Assinaturas ativas dos usuários';

-- =======================
-- SUBSCRIPTIONS TABLE (Asaas Integration)
-- =======================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asaas_subscription_id VARCHAR(255) UNIQUE,
  asaas_payment_link VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  plan_value NUMERIC(10,2) DEFAULT 149.90,
  billing_cycle VARCHAR(50) DEFAULT 'MONTHLY',
  started_at TIMESTAMP,
  next_due_date DATE,
  cancelled_at TIMESTAMP,
  payment_method VARCHAR(50),
  last_payment_date TIMESTAMP,
  last_payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- PAYMENTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  asaas_payment_id VARCHAR(255) UNIQUE,
  asaas_invoice_url VARCHAR(500),
  value NUMERIC(10,2) NOT NULL,
  status VARCHAR(50),
  payment_method VARCHAR(50),
  due_date DATE,
  payment_date TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- LAUNCHER_SESSIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS launcher_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  os_info VARCHAR(255),
  launcher_version VARCHAR(50),
  token_hash VARCHAR(255) NOT NULL,
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  subscription_status_cache VARCHAR(50),
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- =======================
-- ASAAS_WEBHOOKS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100),
  asaas_event_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  payment_id UUID REFERENCES payments(id),
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- PLAN_GAMES TABLE (Many-to-Many)
-- =======================
CREATE TABLE IF NOT EXISTS plan_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, game_id)
);

COMMENT ON TABLE plan_games IS 'Associação entre planos e jogos (many-to-many)';

-- =======================
-- USER_GAME_ACCESS TABLE (Individual permissions)
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

COMMENT ON TABLE user_game_access IS 'Acesso individual a jogos (fora da assinatura)';

-- =======================
-- ACCESS_HISTORY TABLE (Logs)
-- =======================
CREATE TABLE IF NOT EXISTS access_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_duration INTEGER,
  ip_address VARCHAR(45)
);

COMMENT ON TABLE access_history IS 'Histórico de acessos aos jogos';

-- =======================
-- GAME_REQUESTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS game_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  admin_response TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE game_requests IS 'Requisições de acesso a jogos feitas pelos usuários';

-- =======================
-- INDEXES
-- =======================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code);
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer_id ON users(asaas_customer_id);

-- Games
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_games_order ON games("order");

-- Subscriptions (Asaas)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_subscription_id ON subscriptions(asaas_subscription_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id);

-- Launcher Sessions
CREATE INDEX IF NOT EXISTS idx_launcher_sessions_user_id ON launcher_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_launcher_sessions_device_id ON launcher_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_launcher_sessions_is_active ON launcher_sessions(is_active);

-- Asaas Webhooks
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);

-- User Subscriptions
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

-- Game Requests
CREATE INDEX IF NOT EXISTS idx_game_requests_user_id ON game_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_game_requests_game_id ON game_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_game_requests_status ON game_requests(status);

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

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_games_updated_at BEFORE UPDATE ON plan_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_access_updated_at BEFORE UPDATE ON user_game_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_requests_updated_at BEFORE UPDATE ON game_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ROW LEVEL SECURITY (RLS)
-- =======================

-- Habilitar RLS em tabelas públicas
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_history ENABLE ROW LEVEL SECURITY;

-- Users não tem RLS (backend usa service_role)
-- Subscriptions não tem RLS (backend usa service_role)
-- Payments não tem RLS (backend usa service_role)
-- Launcher_sessions não tem RLS (backend usa service_role)
-- User_game_access não tem RLS (backend usa service_role)
-- Game_requests não tem RLS (backend usa service_role)
-- Asaas_webhooks não tem RLS (backend usa service_role)

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

-- Policies para PLAN_GAMES
CREATE POLICY "Service role has full access to plan_games"
  ON plan_games FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read plan_games"
  ON plan_games FOR SELECT
  USING (true);

-- Policies para ACCESS_HISTORY
CREATE POLICY "Service role has full access to access_history"
  ON access_history FOR ALL
  USING (auth.role() = 'service_role');

-- =======================
-- CONCLUÍDO
-- =======================
-- Schema criado com sucesso!
-- Próximo passo: Execute o arquivo supabase-seeds.sql para popular com dados iniciais
