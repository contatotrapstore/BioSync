-- NeuroOne Platform - Supabase Schema Snapshot (2025-01)
-- Atualizado para refletir as migrações até 006 (psicólogos e sistema de pontuação)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  phone VARCHAR(30),
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_psychologist BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  access_code VARCHAR(50) UNIQUE,
  asaas_customer_id VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Usuários da plataforma (pacientes, psicólogos e administradores)';
COMMENT ON COLUMN public.users.is_psychologist IS 'Indica se o usuário é psicólogo autorizado';

CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  description TEXT,
  cover_image VARCHAR(255),
  cover_image_local TEXT,
  folder_path VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  supported_platforms VARCHAR(50)[] DEFAULT ARRAY['pc', 'mobile'],
  is_active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  version VARCHAR(50) DEFAULT '1.0.0',
  download_url TEXT,
  file_size BIGINT,
  checksum VARCHAR(255),
  installer_type VARCHAR(50) DEFAULT 'zip',
  minimum_disk_space BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.games IS 'Catálogo de jogos HTML5 disponíveis para o launcher';
COMMENT ON COLUMN public.games.supported_platforms IS 'Array de plataformas suportadas: pc, mobile, web. Utilizado para restringir jogos por launcher.';

CREATE INDEX IF NOT EXISTS idx_games_supported_platforms ON public.games USING GIN (supported_platforms);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asaas_subscription_id VARCHAR(255) UNIQUE,
  asaas_payment_link VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  plan_value NUMERIC(10,2) DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asaas_payment_id VARCHAR(255) UNIQUE,
  asaas_invoice_url TEXT,
  value NUMERIC(10,2) NOT NULL,
  status VARCHAR(50),
  payment_method VARCHAR(50),
  due_date DATE,
  payment_date TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plan_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (plan_id, game_id)
);

CREATE TABLE IF NOT EXISTS public.user_game_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS public.access_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.launcher_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  os_info VARCHAR(255),
  launcher_version VARCHAR(50),
  token_hash VARCHAR(255) NOT NULL,
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  subscription_status_cache VARCHAR(50),
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.asaas_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100),
  asaas_event_id VARCHAR(255),
  user_id UUID REFERENCES public.users(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  payment_id UUID REFERENCES public.payments(id),
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.psychologist_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psychologist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT psychologist_patient_unique UNIQUE (psychologist_id, patient_id),
  CONSTRAINT psychologist_not_patient CHECK (psychologist_id <> patient_id)
);

CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT game_scores_user_game_time_unique UNIQUE (user_id, game_id, created_at)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_psychologist ON public.users(is_psychologist) WHERE is_psychologist = TRUE;

CREATE INDEX IF NOT EXISTS idx_games_slug ON public.games(slug);
CREATE INDEX IF NOT EXISTS idx_games_category ON public.games(category);
CREATE INDEX IF NOT EXISTS idx_games_is_active ON public.games(is_active);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON public.user_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date ON public.subscriptions(next_due_date);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_plan_games_plan_id ON public.plan_games(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_games_game_id ON public.plan_games(game_id);

CREATE INDEX IF NOT EXISTS idx_user_game_access_user_id ON public.user_game_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_access_game_id ON public.user_game_access(game_id);

CREATE INDEX IF NOT EXISTS idx_access_history_user_id ON public.access_history(user_id);
CREATE INDEX IF NOT EXISTS idx_access_history_game_id ON public.access_history(game_id);
CREATE INDEX IF NOT EXISTS idx_access_history_accessed_at ON public.access_history(accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_launcher_sessions_user_id ON public.launcher_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_psychologist_patients_psychologist ON public.psychologist_patients(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_psychologist_patients_patient ON public.psychologist_patients(patient_id);

CREATE INDEX IF NOT EXISTS idx_game_scores_user ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON public.game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_created ON public.game_scores(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_games_updated_at
  BEFORE UPDATE ON public.plan_games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_game_access_updated_at
  BEFORE UPDATE ON public.user_game_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_access_history_updated_at
  BEFORE UPDATE ON public.access_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_psychologist_patients_updated_at
  BEFORE UPDATE ON public.psychologist_patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES
-- ============================================================================

CREATE POLICY games_service_role_full_access
  ON public.games
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY games_select_active
  ON public.games
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY plans_service_role_full_access
  ON public.subscription_plans
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY plans_select_active
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY user_game_access_service_role_full_access
  ON public.user_game_access
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY user_game_access_select_own
  ON public.user_game_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY plan_games_service_role_full_access
  ON public.plan_games
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY plan_games_select_public
  ON public.plan_games
  FOR SELECT
  USING (TRUE);

CREATE POLICY user_subscriptions_service_role
  ON public.user_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY user_subscriptions_select_own
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY access_history_service_role
  ON public.access_history
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY access_history_select_own
  ON public.access_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY psychologist_patients_access
  ON public.psychologist_patients
  FOR SELECT
  USING (psychologist_id = auth.uid() OR patient_id = auth.uid());

CREATE POLICY psychologist_patients_service_role
  ON public.psychologist_patients
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY game_scores_access
  ON public.game_scores
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY game_scores_service_role
  ON public.game_scores
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
