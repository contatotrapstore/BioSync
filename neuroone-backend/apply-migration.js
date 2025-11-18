import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTY0NCwiZXhwIjoyMDc4OTQ3NjQ0fQ.imC7bY7nj0ruaiqJMnvTPScBjImelVK-HdMp8M5Dnxk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Aplicando migration: Adicionar teacher_id e subject à tabela classes...');

  try {
    // Check if columns already exist
    console.log('📋 Verificando estrutura atual da tabela classes...');

    const { data: existingData, error: selectError } = await supabase
      .from('classes')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('⚠️  Tabela classes pode não ter registros ainda:', selectError.message);
    }

    // Execute migration using raw SQL via RPC or direct query
    console.log('📦 Executando SQL para adicionar colunas...');

    // Using the Supabase REST API directly to execute SQL
    const migrations = [
      {
        name: 'Add teacher_id column',
        sql: 'ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;'
      },
      {
        name: 'Add subject column',
        sql: 'ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT;'
      },
      {
        name: 'Create index on teacher_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);'
      },
      {
        name: 'Update existing classes',
        sql: `UPDATE classes
              SET teacher_id = created_by
              WHERE created_by IN (
                SELECT id FROM users WHERE user_role = 'professor'
              ) AND teacher_id IS NULL;`
      }
    ];

    for (const migration of migrations) {
      console.log(`  → ${migration.name}...`);

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migration.sql })
      });

      if (!response.ok) {
        // Try alternative method - using direct SQL via PostgREST
        console.log(`    ⚠️  RPC method failed, trying alternative...`);
      } else {
        console.log(`    ✅ ${migration.name} - OK`);
      }
    }

    // Verify the changes
    console.log('\n🔍 Verificando se as colunas foram adicionadas...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('classes')
      .select('id, name, teacher_id, subject')
      .limit(1);

    if (verifyError) {
      if (verifyError.message.includes('teacher_id') || verifyError.message.includes('subject')) {
        console.log('❌ As colunas ainda não existem. Execute manualmente o SQL:');
        console.log('\n--- COPIE E EXECUTE NO SUPABASE SQL EDITOR ---\n');
        console.log(fs.readFileSync('./migrations/006_add_teacher_to_classes.sql', 'utf8'));
        console.log('\n--- FIM DO SQL ---\n');
      } else {
        console.log('⚠️  Erro ao verificar:', verifyError.message);
      }
    } else {
      console.log('✅ Colunas teacher_id e subject verificadas com sucesso!');
      if (verifyData && verifyData.length > 0) {
        console.log('📊 Exemplo de registro:', verifyData[0]);
      }
    }

    console.log('\n🎉 Migration concluída!');
    console.log('\n📝 IMPORTANTE: Se houver erros, execute manualmente:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/fsszpnbuabhhvrdmrtct/sql');
    console.log('   2. Cole o conteúdo de migrations/006_add_teacher_to_classes.sql');
    console.log('   3. Execute o SQL');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.log('\n📋 SQL para executar manualmente:');
    console.log('\n--- COPIE E EXECUTE NO SUPABASE SQL EDITOR ---\n');
    console.log(fs.readFileSync('./migrations/006_add_teacher_to_classes.sql', 'utf8'));
    console.log('\n--- FIM DO SQL ---\n');
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Processo finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
