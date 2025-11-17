-- Migration 003: LGPD Privacy and Consent Tables
-- Criado em: 2025-11-17
-- Descrição: Tabelas para compliance com LGPD (Lei 13.709/2018)

-- =============================================================================
-- Tabela: privacy_consents
-- Armazena consentimentos LGPD dos usuários
-- =============================================================================

CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Consentimentos específicos
  data_processing_consent BOOLEAN NOT NULL DEFAULT false,
  eeg_data_consent BOOLEAN NOT NULL DEFAULT false,
  research_consent BOOLEAN DEFAULT false,

  -- Metadados
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0', -- Versão do termo aceito
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  user_agent TEXT,

  -- Índices
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_privacy_consents_user_id ON privacy_consents(user_id);
CREATE INDEX idx_privacy_consents_accepted_at ON privacy_consents(accepted_at);

-- Garantir que sempre temos o consentimento mais recente primeiro
CREATE INDEX idx_privacy_consents_user_latest ON privacy_consents(user_id, accepted_at DESC);

COMMENT ON TABLE privacy_consents IS 'Registro de consentimentos LGPD dos usuários';
COMMENT ON COLUMN privacy_consents.data_processing_consent IS 'Consentimento para processamento de dados pessoais';
COMMENT ON COLUMN privacy_consents.eeg_data_consent IS 'Consentimento para coleta de dados sensíveis de EEG';
COMMENT ON COLUMN privacy_consents.research_consent IS 'Consentimento opcional para uso em pesquisas';
COMMENT ON COLUMN privacy_consents.version IS 'Versão do termo de privacidade aceito';

-- =============================================================================
-- Tabela: account_deletion_requests
-- Gerencia solicitações de exclusão de conta (direito ao esquecimento)
-- =============================================================================

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Status da solicitação
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),

  -- Datas importantes
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'), -- 30 dias de período de arrependimento
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Motivo (opcional)
  reason TEXT,

  -- Dados de auditoria
  processed_by UUID REFERENCES users(id), -- Admin que processou
  notes TEXT -- Notas internas
);

-- Índices
CREATE INDEX idx_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX idx_deletion_requests_scheduled ON account_deletion_requests(scheduled_deletion_at) WHERE status = 'pending';

COMMENT ON TABLE account_deletion_requests IS 'Solicitações de exclusão de conta (LGPD Art. 18, VI)';
COMMENT ON COLUMN account_deletion_requests.scheduled_deletion_at IS 'Data agendada para exclusão definitiva (30 dias após solicitação)';
COMMENT ON COLUMN account_deletion_requests.status IS 'pending: aguardando período; processing: em execução; completed: excluído; cancelled: usuário cancelou';

-- =============================================================================
-- Tabela: data_access_logs
-- Auditoria de acesso aos dados pessoais (transparência LGPD)
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tipo de acesso
  access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
    'view_my_data',      -- Visualização de dados pessoais
    'export_data',       -- Exportação de dados
    'update_data',       -- Atualização de dados
    'delete_request',    -- Solicitação de exclusão
    'consent_update'     -- Atualização de consentimento
  )),

  -- Contexto
  accessed_by UUID NOT NULL REFERENCES users(id), -- Quem acessou (pode ser o próprio usuário ou admin)
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Metadados adicionais
  metadata JSONB
);

-- Índices
CREATE INDEX idx_data_access_logs_user_id ON data_access_logs(user_id);
CREATE INDEX idx_data_access_logs_accessed_at ON data_access_logs(accessed_at);
CREATE INDEX idx_data_access_logs_access_type ON data_access_logs(access_type);

COMMENT ON TABLE data_access_logs IS 'Auditoria de acesso a dados pessoais para compliance LGPD';

-- =============================================================================
-- Funções auxiliares
-- =============================================================================

-- Função para verificar se usuário tem consentimento válido
CREATE OR REPLACE FUNCTION has_valid_consent(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_consent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM privacy_consents
    WHERE user_id = p_user_id
      AND data_processing_consent = true
      AND eeg_data_consent = true
      AND accepted_at > (NOW() - INTERVAL '2 years') -- Reconsentimento a cada 2 anos
  ) INTO v_has_consent;

  RETURN v_has_consent;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION has_valid_consent IS 'Verifica se usuário possui consentimento LGPD válido';

-- Função para anonimizar dados de usuário deletado
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Atualizar usuário com dados anonimizados
  UPDATE users
  SET
    email = 'deleted_' || id || '@anonymized.local',
    name = 'Usuário Deletado',
    cpf = NULL,
    birthdate = NULL,
    school = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Manter métricas de EEG mas remover ligação com usuário
  -- (dados agregados para pesquisa, sem identificação pessoal)
  UPDATE session_metrics
  SET student_id = NULL
  WHERE student_id = p_user_id;

  -- Logs de auditoria
  INSERT INTO data_access_logs (user_id, access_type, accessed_by, metadata)
  VALUES (
    p_user_id,
    'delete_request',
    p_user_id,
    jsonb_build_object('action', 'account_anonymized', 'timestamp', NOW())
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION anonymize_user_data IS 'Anonimiza dados do usuário ao invés de deletar (preserva métricas agregadas)';

-- =============================================================================
-- Trigger para registrar acesso a dados
-- =============================================================================

-- Nota: Em produção, implementar triggers ou middleware para registrar acessos

-- =============================================================================
-- RLS (Row Level Security) para proteção adicional
-- =============================================================================

-- Habilitar RLS nas tabelas de privacidade
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários só podem ver seus próprios dados
CREATE POLICY privacy_consents_select_own ON privacy_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY deletion_requests_select_own ON account_deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY access_logs_select_own ON data_access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas de INSERT (apenas o próprio usuário)
CREATE POLICY privacy_consents_insert_own ON privacy_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY deletion_requests_insert_own ON account_deletion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Dados iniciais (opcional)
-- =============================================================================

-- Inserir consentimento inicial para usuários existentes (migração)
-- ATENÇÃO: Em produção, exigir que usuários aceitem termo manualmente

-- INSERT INTO privacy_consents (user_id, data_processing_consent, eeg_data_consent, research_consent, version)
-- SELECT
--   id,
--   false, -- Exigir novo consentimento
--   false,
--   false,
--   '1.0.0'
-- FROM users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM privacy_consents WHERE privacy_consents.user_id = users.id
-- );

-- =============================================================================
-- Verificação final
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 003 concluída: Tabelas LGPD criadas com sucesso';
  RAISE NOTICE 'Tabelas: privacy_consents, account_deletion_requests, data_access_logs';
  RAISE NOTICE 'Funções: has_valid_consent, anonymize_user_data';
  RAISE NOTICE 'RLS: Habilitado em todas as tabelas de privacidade';
END $$;
