import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

/**
 * Execute SQL using Supabase REST API
 */
async function executeSql(sql) {
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    throw error;
  }
}

/**
 * Execute migration statements one by one
 */
async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  const migrations = [
    {
      name: 'Add teacher_id column',
      sql: `ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;`
    },
    {
      name: 'Add subject column',
      sql: `ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT;`
    },
    {
      name: 'Create index on teacher_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);`
    },
    {
      name: 'Update existing classes with teacher',
      sql: `UPDATE classes SET teacher_id = created_by WHERE created_by IN (SELECT id FROM users WHERE user_role = 'professor') AND teacher_id IS NULL;`
    },
    {
      name: 'Add comment on teacher_id',
      sql: `COMMENT ON COLUMN classes.teacher_id IS 'Professor responsável pela turma';`
    },
    {
      name: 'Add comment on subject',
      sql: `COMMENT ON COLUMN classes.subject IS 'Matéria ou disciplina da turma (ex: Matemática, Português)';`
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`⏳ ${migration.name}...`);
      await executeSql(migration.sql);
      console.log(`✅ ${migration.name} - SUCCESS\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${migration.name} - FAILED`);
      console.error(`   Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount}/${migrations.length}`);
  console.log(`❌ Errors: ${errorCount}/${migrations.length}`);
  console.log('='.repeat(50));

  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    await verifyMigration();
  } else {
    console.log('\n⚠️  Migration completed with errors. Please check the output above.');
  }
}

/**
 * Verify that the migration was successful
 */
async function verifyMigration() {
  try {
    const verifyUrl = `${supabaseUrl}/rest/v1/classes?select=id,name,teacher_id,subject&limit=1`;

    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Verification successful - new columns are accessible');
      if (data.length > 0) {
        console.log('   Sample record:', {
          id: data[0].id,
          name: data[0].name,
          teacher_id: data[0].teacher_id || 'null',
          subject: data[0].subject || 'null'
        });
      }
    } else {
      console.log('⚠️  Could not verify migration automatically');
    }
  } catch (error) {
    console.log('⚠️  Verification error:', error.message);
  }
}

// Run the migration
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
