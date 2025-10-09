-- Migration: Adicionar campos de download e versionamento à tabela games
-- Data: 2025-10-06
-- Descrição: Adiciona campos necessários para sistema de downloads e atualizações

-- Adicionar novos campos
ALTER TABLE games
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS download_url TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS checksum VARCHAR(64),
ADD COLUMN IF NOT EXISTS installer_type VARCHAR(20) DEFAULT 'exe',
ADD COLUMN IF NOT EXISTS minimum_disk_space BIGINT,
ADD COLUMN IF NOT EXISTS cover_image_local TEXT;

-- Criar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_games_version ON games(version);
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);

-- Adicionar comentários para documentação
COMMENT ON COLUMN games.version IS 'Versão semântica do jogo (ex: 1.0.0)';
COMMENT ON COLUMN games.download_url IS 'URL completa para download do instalador';
COMMENT ON COLUMN games.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN games.checksum IS 'SHA256 do arquivo para validação de integridade';
COMMENT ON COLUMN games.installer_type IS 'Tipo de instalador (exe, msi, zip)';
COMMENT ON COLUMN games.minimum_disk_space IS 'Espaço mínimo em disco necessário (bytes)';
COMMENT ON COLUMN games.cover_image_local IS 'Caminho local da capa no launcher (assets/covers/...)';

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_game_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS games_updated_at ON games;
CREATE TRIGGER games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_game_timestamp();
