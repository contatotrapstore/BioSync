const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function applyMigration(filename) {
  console.log(`\n📄 Aplicando migration: ${filename}`);

  const sql = fs.readFileSync(path.join(__dirname, 'migrations', filename), 'utf8');

  try {
    // Supabase não tem método direto para SQL raw, então vamos usar via API REST
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Erro ao aplicar ${filename}:`, error.message);
      console.log('\n⚠️  Você precisa aplicar esta migration manualmente no Supabase SQL Editor:');
      console.log(`   https://supabase.com/dashboard/project/${process.env.SUPABASE_URL.split('.')[0].split('//')[1]}/sql`);
      return false;
    }

    console.log(`✅ Migration ${filename} aplicada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação de migrations...\n');

  const migrationFile = '003_create_subscription_tables.sql';

  if (!fs.existsSync(path.join(__dirname, 'migrations', migrationFile))) {
    console.error(`❌ Arquivo ${migrationFile} não encontrado!`);
    process.exit(1);
  }

  const success = await applyMigration(migrationFile);

  if (!success) {
    console.log('\n⚠️  AÇÃO NECESSÁRIA:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá em: SQL Editor');
    console.log('3. Cole o conteúdo de: migrations/003_create_subscription_tables.sql');
    console.log('4. Execute o SQL');
  }

  console.log('\n✅ Processo finalizado!');
}

main();
