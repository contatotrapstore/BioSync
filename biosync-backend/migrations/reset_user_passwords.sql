-- Migração: Reset de senhas para todos usuários exceto psitalessales@gmail.com
-- Data: 2025-01-10
-- Nova senha para todos: Teste123

-- Atualizar senha para todos os usuários exceto psitalessales@gmail.com
UPDATE users
SET password = '$2b$10$DWj9B89S/pvXzHs8gqUXbuKjBsgBNEg6TdCDD6YKiGQa.9pWWWnWu'
WHERE email != 'psitalessales@gmail.com';

-- Verificar resultado
SELECT
  email,
  CASE
    WHEN email = 'psitalessales@gmail.com' THEN 'Senha mantida (original)'
    ELSE 'Senha resetada para: Teste123'
  END as status
FROM users
ORDER BY email;
