-- ===================================================================
-- MIGRATION 007: Corrigir URLs de Imagens dos Jogos
-- Atualiza cover_image para usar URLs do Supabase Storage
-- Data: 2025-01-16
-- ===================================================================

-- IMPORTANTE: Substitua {SUA_URL_SUPABASE} pela URL do seu projeto
-- Exemplo: https://btsarxzpiroprpdcrpcx.supabase.co

-- ===================================================================
-- 1. LIMPAR URLs INVÁLIDAS
-- ===================================================================

-- Remover caminhos locais inválidos (começam com / ou C:)
UPDATE public.games
SET cover_image = NULL
WHERE cover_image LIKE '/%'
   OR cover_image LIKE 'C:%'
   OR cover_image LIKE 'c:%'
   OR cover_image LIKE 'file://%'
   OR cover_image LIKE './%'
   OR cover_image LIKE '../%';

-- Remover URLs vazias ou apenas espaços
UPDATE public.games
SET cover_image = NULL
WHERE cover_image IS NOT NULL
  AND TRIM(cover_image) = '';

-- ===================================================================
-- 2. ATUALIZAR URLs PARA SUPABASE STORAGE (MANUAL)
-- ===================================================================

-- ATENÇÃO: Você precisa substituir {SUA_URL_SUPABASE} manualmente!
-- Execute este comando DEPOIS de fazer upload das imagens

-- Exemplo de atualização (descomente e ajuste):
/*
UPDATE public.games
SET cover_image = 'https://{SUA_URL_SUPABASE}.supabase.co/storage/v1/object/public/games/covers/' || slug || '-cover.png'
WHERE cover_image IS NULL
   OR cover_image NOT LIKE 'https://%';
*/

-- ===================================================================
-- 3. ATUALIZAR JOGOS ESPECÍFICOS (EXEMPLOS)
-- ===================================================================

-- Exemplo de atualização individual (ajuste conforme necessário):
/*
UPDATE public.games
SET cover_image = 'https://{SUA_URL_SUPABASE}.supabase.co/storage/v1/object/public/games/covers/labirinto-cover.png'
WHERE slug = 'labirinto';

UPDATE public.games
SET cover_image = 'https://{SUA_URL_SUPABASE}.supabase.co/storage/v1/object/public/games/covers/memoria-cover.png'
WHERE slug = 'memoria';
*/

-- ===================================================================
-- 4. VERIFICAR RESULTADO
-- ===================================================================

-- Ver jogos sem imagem
SELECT slug, name, cover_image
FROM public.games
WHERE cover_image IS NULL
ORDER BY slug;

-- Ver todos os jogos com suas imagens
SELECT slug, name,
  CASE
    WHEN cover_image IS NULL THEN '❌ SEM IMAGEM'
    WHEN cover_image LIKE 'https://%' THEN '✅ URL VÁLIDA'
    ELSE '⚠️  URL SUSPEITA'
  END AS status,
  cover_image
FROM public.games
ORDER BY slug;

-- ===================================================================
-- 5. ESTATÍSTICAS
-- ===================================================================

DO $$
DECLARE
  total_games INTEGER;
  with_image INTEGER;
  without_image INTEGER;
  invalid_image INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_games FROM public.games;
  SELECT COUNT(*) INTO with_image FROM public.games WHERE cover_image IS NOT NULL AND cover_image LIKE 'https://%';
  SELECT COUNT(*) INTO without_image FROM public.games WHERE cover_image IS NULL;
  SELECT COUNT(*) INTO invalid_image FROM public.games WHERE cover_image IS NOT NULL AND cover_image NOT LIKE 'https://%';

  RAISE NOTICE '';
  RAISE NOTICE '===================================================================';
  RAISE NOTICE 'ESTATÍSTICAS DE IMAGENS DOS JOGOS';
  RAISE NOTICE '===================================================================';
  RAISE NOTICE 'Total de jogos:           %', total_games;
  RAISE NOTICE 'Com imagem válida (https): %', with_image;
  RAISE NOTICE 'Sem imagem (NULL):        %', without_image;
  RAISE NOTICE 'Com URL inválida:         %', invalid_image;
  RAISE NOTICE '';

  IF invalid_image > 0 THEN
    RAISE WARNING 'Ainda existem % jogos com URLs inválidas!', invalid_image;
  END IF;

  IF without_image > 0 THEN
    RAISE NOTICE 'Há % jogos sem imagem. Recomenda-se fazer upload das capas.', without_image;
  END IF;

  IF with_image = total_games THEN
    RAISE NOTICE '✅ Todos os jogos têm imagens válidas!';
  END IF;

  RAISE NOTICE '===================================================================';
END $$;

-- ===================================================================
-- 6. TEMPLATE PARA ATUALIZAÇÃO EM MASSA
-- ===================================================================

-- Use este template para criar seu próprio script de atualização:
/*
-- Salve este SQL em um arquivo separado e execute após configurar

-- Substitua pela sua URL do Supabase
\set SUPABASE_URL 'https://seu-projeto.supabase.co'

UPDATE public.games SET cover_image = :'SUPABASE_URL' || '/storage/v1/object/public/games/covers/' || slug || '-cover.png'
WHERE slug IN (
  'jogo1',
  'jogo2',
  'jogo3'
);
*/

-- ===================================================================
-- CONCLUÍDO
-- ===================================================================
-- Migration 007: Limpeza de URLs de imagens concluída
-- Próximo passo: Fazer upload das imagens e atualizar URLs manualmente
-- ===================================================================
