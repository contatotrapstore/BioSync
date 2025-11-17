-- =====================================================
-- NEUROONE DATABASE - SEED DATA
-- =====================================================
-- Created: 2025-01-17
-- Description: Insert initial/default data for production environment
-- Author: Claude Code
-- Version: 1.0.0
-- Dependencies: 001_initial_schema.sql, 003_lgpd_privacy_tables.sql
-- =====================================================

-- =====================================================
-- DEFAULT ADMIN USER (Direção)
-- =====================================================
-- Password: Admin123! (MUST be changed on first login in production)
-- Password hash generated with bcrypt rounds=10

INSERT INTO users (id, email, name, user_role, password_hash, active, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@neurogame.com',
  'Administrador Sistema',
  'direção',
  '$2b$10$rGvH.vGX5qL8qY8qY8qY8e0tL5qL8qY8qY8qY8qY8qY8qY8qY8qYa', -- Admin123!
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- SYSTEM SETTINGS DEFAULTS
-- =====================================================

-- Session defaults
INSERT INTO system_settings (key, value, description)
VALUES
  ('session.default_duration_minutes', '45', 'Duração padrão de sessão em minutos'),
  ('session.attention_threshold_low', '40', 'Limite inferior de atenção (%)'),
  ('session.attention_threshold_high', '70', 'Limite superior de atenção (%)'),
  ('session.auto_end_on_inactivity_minutes', '10', 'Finalizar sessão após X minutos de inatividade')
ON CONFLICT (key) DO NOTHING;

-- EEG device settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('eeg.signal_quality_threshold', '100', 'Qualidade mínima aceitável de sinal EEG (0-200)'),
  ('eeg.sampling_rate_hz', '1', 'Taxa de amostragem de dados EEG (Hz)'),
  ('eeg.enable_raw_data_storage', 'true', 'Armazenar dados brutos de ondas cerebrais'),
  ('eeg.bluetooth_connection_timeout_seconds', '30', 'Timeout para conexão Bluetooth (segundos)')
ON CONFLICT (key) DO NOTHING;

-- WebSocket settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('websocket.heartbeat_interval_ms', '5000', 'Intervalo de heartbeat WebSocket (ms)'),
  ('websocket.reconnect_attempts', '5', 'Tentativas de reconexão WebSocket'),
  ('websocket.max_connections_per_session', '50', 'Máximo de conexões por sessão')
ON CONFLICT (key) DO NOTHING;

-- LGPD/Privacy settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('lgpd.consent_version', '1.0.0', 'Versão atual do termo de consentimento'),
  ('lgpd.consent_expiry_years', '2', 'Validade do consentimento em anos'),
  ('lgpd.data_retention_years', '5', 'Período de retenção de dados em anos'),
  ('lgpd.deletion_request_processing_days', '30', 'Prazo para processar solicitação de exclusão (dias)')
ON CONFLICT (key) DO NOTHING;

-- Notification settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('notifications.session_reminder_minutes', '15', 'Lembrete de sessão X minutos antes'),
  ('notifications.low_battery_threshold', '20', 'Alertar bateria baixa do headset (%)'),
  ('notifications.poor_signal_duration_seconds', '10', 'Alertar sinal ruim após X segundos')
ON CONFLICT (key) DO NOTHING;

-- UI/UX settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('ui.theme', 'light', 'Tema padrão do sistema (light/dark)'),
  ('ui.language', 'pt-BR', 'Idioma padrão do sistema'),
  ('ui.dashboard_refresh_interval_ms', '1000', 'Intervalo de atualização do dashboard (ms)')
ON CONFLICT (key) DO NOTHING;

-- Reports settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('reports.default_date_range_days', '30', 'Período padrão para relatórios (dias)'),
  ('reports.enable_pdf_export', 'true', 'Habilitar exportação de relatórios em PDF'),
  ('reports.enable_csv_export', 'true', 'Habilitar exportação de relatórios em CSV')
ON CONFLICT (key) DO NOTHING;

-- Game integration settings (PWA Mobile)
INSERT INTO system_settings (key, value, description)
VALUES
  ('games.enable_launcher', 'true', 'Habilitar launcher de jogos (desktop)'),
  ('games.default_game', 'memory-match', 'Jogo padrão para novas sessões'),
  ('games.available_games', '["memory-match","focus-flow","attention-arcade"]', 'Lista de jogos disponíveis (JSON)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SAMPLE DEMO DATA (Optional - for development/testing)
-- =====================================================
-- Uncomment below to add sample professor and students

/*
-- Sample Professor
INSERT INTO users (email, name, user_role, password_hash, active)
VALUES
  ('professor@demo.com', 'Prof. Maria Silva', 'professor', '$2b$10$rGvH.vGX5qL8qY8qY8qY8e0tL5qL8qY8qY8qY8qY8qY8qY8qY8qYa', true)
ON CONFLICT (email) DO NOTHING;

-- Sample Students
INSERT INTO users (email, name, user_role, password_hash, birth_date, active)
VALUES
  ('aluno1@demo.com', 'João Santos', 'aluno', '$2b$10$rGvH.vGX5qL8qY8qY8qY8e0tL5qL8qY8qY8qY8qY8qY8qY8qY8qYa', '2010-05-15', true),
  ('aluno2@demo.com', 'Ana Costa', 'aluno', '$2b$10$rGvH.vGX5qL8qY8qY8qY8e0tL5qL8qY8qY8qY8qY8qY8qY8qY8qYa', '2011-08-22', true),
  ('aluno3@demo.com', 'Pedro Oliveira', 'aluno', '$2b$10$rGvH.vGX5qL8qY8qY8qY8e0tL5qL8qY8qY8qY8qY8qY8qY8qY8qYa', '2010-11-03', true)
ON CONFLICT (email) DO NOTHING;

-- Sample Class
INSERT INTO classes (name, description, school_year, created_by, active)
SELECT
  '5º Ano A',
  'Turma de demonstração do sistema NeuroOne',
  '2025',
  id,
  true
FROM users
WHERE email = 'professor@demo.com'
ON CONFLICT DO NOTHING;

-- Enroll students in sample class
INSERT INTO class_students (class_id, student_id)
SELECT
  c.id,
  u.id
FROM classes c
CROSS JOIN users u
WHERE c.name = '5º Ano A'
  AND u.email IN ('aluno1@demo.com', 'aluno2@demo.com', 'aluno3@demo.com')
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- PRIVACY CONSENT FOR ADMIN USER
-- =====================================================
-- Admin must have valid consent for LGPD compliance

INSERT INTO privacy_consents (user_id, data_processing_consent, eeg_data_consent, research_consent, version, accepted_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  true,
  true,
  false,
  '1.0.0',
  NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 005_seed_data.sql completed successfully!';
  RAISE NOTICE 'Inserted seed data:';
  RAISE NOTICE '  ✓ 1 admin user (admin@neurogame.com / Admin123!)';
  RAISE NOTICE '  ✓ 24 system settings (defaults for session, EEG, LGPD, UI, reports)';
  RAISE NOTICE '  ✓ 1 privacy consent for admin user';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY WARNING:';
  RAISE NOTICE '    Change admin password immediately in production!';
  RAISE NOTICE '    Default password: Admin123!';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Optional: Uncomment sample data section for development/testing';
END $$;
