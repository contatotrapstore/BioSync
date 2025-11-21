-- Migration: Corrigir tipo de signal_quality de VARCHAR para INTEGER
-- Data: 2025-11-21
-- Descrição: signal_quality deve ser INTEGER (0-100) em vez de VARCHAR

-- 1. Converter valores existentes de VARCHAR para INTEGER
-- Se houver valores não-numéricos, eles serão convertidos para NULL
UPDATE eeg_data
SET signal_quality = CASE
  WHEN signal_quality ~ '^[0-9]+$' THEN signal_quality::INTEGER::VARCHAR
  ELSE '0'
END
WHERE signal_quality IS NOT NULL;

-- 2. Alterar tipo da coluna
ALTER TABLE eeg_data
ALTER COLUMN signal_quality TYPE INTEGER USING signal_quality::INTEGER;

-- 3. Adicionar constraint para valores válidos (0-100)
ALTER TABLE eeg_data
ADD CONSTRAINT eeg_data_signal_quality_range CHECK (signal_quality >= 0 AND signal_quality <= 100);

-- 4. Atualizar comentário da coluna
COMMENT ON COLUMN eeg_data.signal_quality IS 'Signal quality do EEG (0-100, onde 0=poor, 100=excellent)';
