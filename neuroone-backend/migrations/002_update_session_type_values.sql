-- Migration: Atualizar valores permitidos para session_type
-- Data: 2025-11-20
-- Descrição: Padronizar session_type para usar valores em português consistentes

-- Remove o constraint antigo
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_session_type_check;

-- Adiciona novo constraint com valores padronizados
ALTER TABLE sessions
ADD CONSTRAINT sessions_session_type_check
CHECK (session_type IN ('monitoramento', 'neurogame', 'avaliacao'));

-- Atualiza default value
ALTER TABLE sessions
ALTER COLUMN session_type SET DEFAULT 'monitoramento';

-- Opcional: Migrar dados existentes (se houver)
-- UPDATE sessions SET session_type = 'neurogame' WHERE session_type IN ('neurofeedback', 'training', 'treinamento');
-- UPDATE sessions SET session_type = 'avaliacao' WHERE session_type IN ('assessment', 'avaliacao');
-- UPDATE sessions SET session_type = 'monitoramento' WHERE session_type NOT IN ('neurogame', 'avaliacao');

COMMENT ON COLUMN sessions.session_type IS 'Tipo de sessão: monitoramento (aula tradicional), neurogame (jogo de neurofeedback), avaliacao (avaliação)';
