-- Migration: Refatorar sistema para assinatura independente via Asaas
-- Data: 2025-10-03

-- 1. Modificar tabela users (simplificar para email/senha)
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);

-- Tornar email obrigatório e único
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Recriar tabela subscriptions para Asaas
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Asaas Integration
  asaas_subscription_id VARCHAR(255) UNIQUE,
  asaas_payment_link VARCHAR(500),

  -- Subscription Details
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, past_due, cancelled
  plan_value DECIMAL(10,2) DEFAULT 149.90,
  billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',

  -- Dates
  started_at TIMESTAMP,
  next_due_date DATE,
  cancelled_at TIMESTAMP,

  -- Payment Info
  payment_method VARCHAR(50), -- CREDIT_CARD, PIX, BOLETO
  last_payment_date TIMESTAMP,
  last_payment_status VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_asaas_id ON subscriptions(asaas_subscription_id);

-- 3. Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Asaas Data
  asaas_payment_id VARCHAR(255) UNIQUE,
  asaas_invoice_url VARCHAR(500),

  -- Payment Details
  value DECIMAL(10,2) NOT NULL,
  status VARCHAR(50), -- PENDING, CONFIRMED, RECEIVED, OVERDUE, REFUNDED
  payment_method VARCHAR(50),
  due_date DATE,
  payment_date TIMESTAMP,

  -- Metadata
  description TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_asaas_id ON payments(asaas_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 4. Criar tabela de sessões do launcher
CREATE TABLE IF NOT EXISTS launcher_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Device Info
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  os_info VARCHAR(255),
  launcher_version VARCHAR(50),

  -- Session Control
  token_hash VARCHAR(255) NOT NULL,
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  subscription_status_cache VARCHAR(50),

  -- Security
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_launcher_sessions_user_id ON launcher_sessions(user_id);
CREATE INDEX idx_launcher_sessions_device_id ON launcher_sessions(device_id);
CREATE INDEX idx_launcher_sessions_active ON launcher_sessions(is_active);

-- 5. Criar tabela de webhooks do Asaas
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  asaas_event_id VARCHAR(255),

  -- Related Entities
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  payment_id UUID REFERENCES payments(id),

  -- Payload
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asaas_webhooks_event_type ON asaas_webhooks(event_type);
CREATE INDEX idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX idx_asaas_webhooks_user_id ON asaas_webhooks(user_id);

-- 6. Remover tabelas antigas não utilizadas
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS game_requests CASCADE;
DROP TABLE IF EXISTS user_game_access CASCADE;

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserir configurações padrão
INSERT INTO games (name, description, slug, category, folder_path, is_active, created_at)
VALUES
  ('Bem-vindo ao biosync', 'Tutorial inicial', 'tutorial', 'Tutorial', 'tutorial', true, NOW())
ON CONFLICT (slug) DO NOTHING;

COMMIT;
