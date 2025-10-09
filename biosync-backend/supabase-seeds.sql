-- BioSync Platform - Supabase Seeds
-- Execute este script após executar supabase-schema-complete.sql

-- =======================
-- SEED: GAMES
-- =======================

INSERT INTO games (name, slug, description, folder_path, category, "order") VALUES
('Autorama', 'autorama', 'Jogo de corrida emocionante em pista de autorama. Controle seu carro e vença a corrida!', 'Jogos/autorama', 'Corrida', 1),
('Balão', 'balao', 'Controle um balão de ar quente e navegue pelos céus evitando obstáculos.', 'Jogos/balao', 'Aventura', 2),
('Batalha de Tanques', 'batalhadetanques', 'Combate estratégico com tanques. Destrua seus oponentes e domine o campo de batalha!', 'Jogos/batalhadetanques', 'Ação', 3),
('Correndo pelos Trilhos', 'correndopelostrilhos', 'Conduza um trem pelos trilhos, colete itens e evite obstáculos.', 'Jogos/correndopelostrilhos', 'Corrida', 4),
('Desafio Aéreo', 'desafioaereo', 'Pilote um avião em missões desafiadoras pelos céus.', 'Jogos/desafioaereo', 'Simulação', 5),
('Desafio Automotivo', 'desafioautomotivo', 'Corrida automotiva com veículos variados. Mostre suas habilidades de pilotagem!', 'Jogos/desafioautomotivo', 'Corrida', 6),
('Desafio nas Alturas', 'desafionasalturas', 'Escale montanhas e supere desafios em grandes alturas.', 'Jogos/desafionasalturas', 'Aventura', 7),
('Fazendinha', 'fazendinha', 'Gerencie sua própria fazenda, plante, colha e cuide dos animais.', 'Jogos/fazendinha', 'Simulação', 8),
('Labirinto', 'labirinto', 'Navegue por labirintos complexos e encontre a saída.', 'Jogos/labirinto', 'Puzzle', 9),
('Missão Espacial', 'missaoespacial', 'Explore o espaço sideral em missões emocionantes entre planetas e galáxias.', 'Jogos/missaoespacial', 'Aventura', 10),
('Resgate em Chamas', 'resgateemchamas', 'Missão heroica de resgate em situações de emergência com fogo.', 'Jogos/resgateemchamas', 'Ação', 11),
('Taxi City', 'taxicity', 'Seja um motorista de táxi e transporte passageiros pela cidade.', 'Jogos/taxicity', 'Simulação', 12),
('Tesouro do Mar', 'tesourodomar', 'Aventura submarina em busca de tesouros perdidos nas profundezas do oceano.', 'Jogos/tesourodomar', 'Aventura', 13)
ON CONFLICT (slug) DO NOTHING;

-- =======================
-- SEED: SUBSCRIPTION PLANS
-- =======================

INSERT INTO subscription_plans (name, description, price, duration_days, features) VALUES
(
  'Plano Básico',
  'Acesso a 5 jogos selecionados - ideal para começar!',
  19.90,
  30,
  '["5 jogos inclusos", "Atualizações automáticas", "Suporte por email"]'::jsonb
),
(
  'Plano Premium',
  'Acesso completo a todos os jogos da plataforma!',
  39.90,
  30,
  '["Todos os jogos inclusos", "Atualizações automáticas", "Suporte prioritário", "Novos jogos incluídos automaticamente"]'::jsonb
),
(
  'Plano Educacional',
  'Plano personalizado para instituições de ensino',
  99.90,
  90,
  '["Acesso personalizado", "Gestão de múltiplos usuários", "Relatórios de uso", "Suporte dedicado"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- =======================
-- SEED: PLAN_GAMES (Associações)
-- =======================

-- Plano Básico - Primeiros 5 jogos
INSERT INTO plan_games (plan_id, game_id)
SELECT
  (SELECT id FROM subscription_plans WHERE name = 'Plano Básico'),
  id
FROM games
WHERE slug IN ('autorama', 'balao', 'batalhadetanques', 'correndopelostrilhos', 'desafioaereo')
ON CONFLICT DO NOTHING;

-- Plano Premium - Todos os jogos
INSERT INTO plan_games (plan_id, game_id)
SELECT
  (SELECT id FROM subscription_plans WHERE name = 'Plano Premium'),
  id
FROM games
ON CONFLICT DO NOTHING;

-- Plano Educacional - Jogos educativos (Simulação e Puzzle)
INSERT INTO plan_games (plan_id, game_id)
SELECT
  (SELECT id FROM subscription_plans WHERE name = 'Plano Educacional'),
  id
FROM games
WHERE category IN ('Simulação', 'Puzzle')
ON CONFLICT DO NOTHING;

-- =======================
-- SEED: ADMIN USER
-- =======================

-- IMPORTANTE: A senha aqui é "Admin@123456" já hasheada com bcrypt (10 rounds)
-- Você deve gerar um novo hash em produção usando bcrypt.hash('SuaSenha', 10)

INSERT INTO users (username, email, password, full_name, is_admin, is_active) VALUES
(
  'admin',
  'admin@biosync.com',
  '$2b$10$rKvVXz8YQZ5m5fY5.5QXPeJ5vZJ5kZJ5lZJ5mZJ5nZJ5oZJ5pZJ5q', -- Placeholder: substitua com hash real
  'Administrator',
  true,
  true
)
ON CONFLICT (username) DO NOTHING;

-- =======================
-- SEED: DEMO USER
-- =======================

-- Senha: "Demo@123456" (substitua com hash real)
INSERT INTO users (username, email, password, full_name, is_admin, is_active) VALUES
(
  'demo',
  'demo@biosync.com',
  '$2b$10$rKvVXz8YQZ5m5fY5.5QXPeJ5vZJ5kZJ5lZJ5mZJ5nZJ5oZJ5pZJ5q', -- Placeholder: substitua com hash real
  'Demo User',
  false,
  true
)
ON CONFLICT (username) DO NOTHING;

-- =======================
-- VERIFICAÇÃO
-- =======================

-- Verificar quantos registros foram inseridos
SELECT 'Games' as table_name, COUNT(*) as count FROM games
UNION ALL
SELECT 'Subscription Plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'Plan-Game Associations', COUNT(*) FROM plan_games
UNION ALL
SELECT 'Users', COUNT(*) FROM users;

-- =======================
-- CONCLUÍDO
-- =======================

-- ✅ Seeds inseridos com sucesso!
--
-- PRÓXIMOS PASSOS:
-- 1. Gere hashes bcrypt reais para as senhas dos usuários:
--    - Admin: Admin@123456
--    - Demo: Demo@123456
-- 2. Atualize os registros na tabela users com os hashes corretos
-- 3. Configure as variáveis de ambiente no backend (.env)
-- 4. Execute npm install no backend
-- 5. Inicie o backend: npm run dev
