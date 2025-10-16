-- ===================================================================
-- MIGRATION 006: Sistema de Psicólogos e Pontuações
-- Migração do NeuroGame para BioSync
-- Data: 2025-01-16
-- ===================================================================

-- ===================================================================
-- 1. ADICIONAR COLUNA: is_psychologist na tabela users
-- ===================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_psychologist BOOLEAN DEFAULT FALSE;

-- Índice para buscar psicólogos rapidamente
CREATE INDEX IF NOT EXISTS idx_users_is_psychologist
  ON public.users(is_psychologist) WHERE is_psychologist = TRUE;

COMMENT ON COLUMN public.users.is_psychologist IS 'Indica se o usuário é um psicólogo autorizado';

-- ===================================================================
-- 2. TABELA: psychologist_patients
-- Relaciona psicólogos com seus pacientes
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.psychologist_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psychologist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT psychologist_patient_unique UNIQUE (psychologist_id, patient_id),
  CONSTRAINT psychologist_not_patient CHECK (psychologist_id != patient_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_psychologist_patients_psychologist
  ON public.psychologist_patients(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_psychologist_patients_patient
  ON public.psychologist_patients(patient_id);

-- Trigger para updated_at
CREATE TRIGGER update_psychologist_patients_updated_at
  BEFORE UPDATE ON public.psychologist_patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.psychologist_patients IS 'Relacionamento entre psicólogos e seus pacientes';
COMMENT ON COLUMN public.psychologist_patients.psychologist_id IS 'ID do psicólogo';
COMMENT ON COLUMN public.psychologist_patients.patient_id IS 'ID do paciente';

-- ===================================================================
-- 3. TABELA: game_scores
-- Armazena pontuações dos jogos
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint para evitar duplicatas exatas
  CONSTRAINT game_scores_user_game_time_unique UNIQUE (user_id, game_id, created_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON public.game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_created ON public.game_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_game ON public.game_scores(user_id, game_id);

COMMENT ON TABLE public.game_scores IS 'Pontuações dos jogos registradas pelos usuários';
COMMENT ON COLUMN public.game_scores.score IS 'Pontuação obtida no jogo (inteiro não-negativo)';
COMMENT ON COLUMN public.game_scores.metadata IS 'Dados adicionais (tempo de jogo, nível, etc)';
COMMENT ON COLUMN public.game_scores.idempotency_key IS 'Chave para prevenir duplicação de pontuações';

-- ===================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.psychologist_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- POLICIES: psychologist_patients
-- ===================================================================

-- Psicólogos podem ver seus próprios pacientes
CREATE POLICY "psychologists_view_own_patients"
  ON public.psychologist_patients
  FOR SELECT
  USING (
    psychologist_id = auth.uid() OR
    patient_id = auth.uid()
  );

-- Admins podem gerenciar todas as relações
CREATE POLICY "admins_manage_relationships"
  ON public.psychologist_patients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Service role tem acesso total (para backend)
CREATE POLICY "service_role_full_access_psychologist_patients"
  ON public.psychologist_patients
  FOR ALL
  USING (auth.role() = 'service_role');

-- ===================================================================
-- POLICIES: game_scores
-- ===================================================================

-- Usuários podem criar suas próprias pontuações
CREATE POLICY "users_create_own_scores"
  ON public.game_scores
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuários podem ver suas próprias pontuações
CREATE POLICY "users_view_own_scores"
  ON public.game_scores
  FOR SELECT
  USING (user_id = auth.uid());

-- Psicólogos podem ver pontuações de seus pacientes
CREATE POLICY "psychologists_view_patient_scores"
  ON public.game_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.psychologist_patients
      WHERE psychologist_id = auth.uid()
        AND patient_id = game_scores.user_id
    )
  );

-- Admins podem ver todas as pontuações
CREATE POLICY "admins_view_all_scores"
  ON public.game_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Service role tem acesso total (para backend)
CREATE POLICY "service_role_full_access_game_scores"
  ON public.game_scores
  FOR ALL
  USING (auth.role() = 'service_role');

-- ===================================================================
-- 5. FUNÇÕES AUXILIARES
-- ===================================================================

-- Função para obter estatísticas de um paciente
CREATE OR REPLACE FUNCTION get_patient_stats(patient_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  avg_score NUMERIC,
  best_score INTEGER,
  total_games INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    ROUND(AVG(score), 2) as avg_score,
    MAX(score) as best_score,
    COUNT(DISTINCT game_id)::INTEGER as total_games
  FROM public.game_scores
  WHERE user_id = patient_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_patient_stats IS 'Calcula estatísticas de pontuação de um paciente';

-- ===================================================================
-- 6. SEED DATA (OPCIONAL - Para testes)
-- ===================================================================

-- Criar um usuário psicólogo de teste (descomente se necessário)
/*
INSERT INTO public.users (email, password, full_name, is_active, is_admin, is_psychologist)
VALUES (
  'psicologo@teste.com',
  '$2b$10$YourHashedPasswordHere',
  'Dr. Psicólogo Teste',
  TRUE,
  FALSE,
  TRUE
)
ON CONFLICT (email) DO NOTHING;
*/

-- ===================================================================
-- 7. VERIFICAÇÃO E LIMPEZA
-- ===================================================================

-- Verificar se as tabelas foram criadas
DO $$
DECLARE
  tables_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('psychologist_patients', 'game_scores');

  IF tables_count = 2 THEN
    RAISE NOTICE '✅ Migration 006 concluída com sucesso!';
    RAISE NOTICE '   - Tabela psychologist_patients criada';
    RAISE NOTICE '   - Tabela game_scores criada';
    RAISE NOTICE '   - Coluna is_psychologist adicionada em users';
    RAISE NOTICE '   - RLS policies aplicadas';
    RAISE NOTICE '   - Índices criados';
  ELSE
    RAISE WARNING '⚠️  Algumas tabelas podem não ter sido criadas corretamente';
  END IF;
END $$;

-- ===================================================================
-- CONCLUÍDO
-- ===================================================================
-- Migration 006: Sistema de Psicólogos e Pontuações
-- Próximo passo: Executar no SQL Editor do Supabase
-- ===================================================================
