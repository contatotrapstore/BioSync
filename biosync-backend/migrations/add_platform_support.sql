-- Migration: Add platform support to games
-- Created: 2025-01-04
-- Description: Adds supported_platforms column to allow games to specify if they run on PC, Mobile, or both

-- Add the supported_platforms column
ALTER TABLE games
ADD COLUMN supported_platforms VARCHAR(50)[] DEFAULT ARRAY['pc', 'mobile'];

-- Create GIN index for efficient platform filtering
CREATE INDEX idx_games_platforms ON games USING GIN (supported_platforms);

-- Add column comment for documentation
COMMENT ON COLUMN games.supported_platforms IS 'Array of supported platforms: pc, mobile, web. Allows filtering games by launcher type.';

-- Update existing games to have both platforms (retrocompatibility)
UPDATE games
SET supported_platforms = ARRAY['pc', 'mobile']
WHERE supported_platforms IS NULL;
