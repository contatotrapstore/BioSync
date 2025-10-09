/**
 * Script para gerar hashes de senha para o Supabase
 * Execute: node generate-password-hashes.js
 */

const bcrypt = require('bcrypt');

const passwords = {
  admin: 'Admin@123456',
  demo: 'Demo@123456'
};

console.log('🔐 Gerando hashes de senha para Supabase...\n');

async function generateHashes() {
  for (const [user, password] of Object.entries(passwords)) {
    try {
      const hash = await bcrypt.hash(password, 10);
      console.log(`✅ ${user.toUpperCase()}:`);
      console.log(`   Senha: ${password}`);
      console.log(`   Hash: ${hash}\n`);
    } catch (error) {
      console.error(`❌ Erro ao gerar hash para ${user}:`, error.message);
    }
  }

  console.log('📋 Copie os hashes acima e cole no arquivo supabase-seeds.sql');
  console.log('   Substitua os placeholders nas linhas de INSERT INTO users\n');
}

generateHashes().catch(console.error);
