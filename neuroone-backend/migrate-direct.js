import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Supabase PostgreSQL connection
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL ||
  `postgresql://postgres.fsszpnbuabhhvrdmrtct:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL\n');

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

    for (const migration of migrations) {
      try {
        console.log(`⏳ ${migration.name}...`);
        await client.query(migration.sql);
        console.log(`✅ ${migration.name} - SUCCESS\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${migration.name} - FAILED`);
        console.error(`   Error: ${error.message}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log(`✅ Migration completed: ${successCount}/${migrations.length} successful`);
    console.log('='.repeat(60));

    // Verify
    console.log('\n🔍 Verifying migration...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'classes'
      AND column_name IN ('teacher_id', 'subject')
      ORDER BY column_name;
    `);

    if (result.rows.length === 2) {
      console.log('✅ Verification successful!');
      console.log('   Columns added:', result.rows.map(r => r.column_name).join(', '));
    } else {
      console.log('⚠️  Some columns may be missing');
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('   1. Add SUPABASE_DB_PASSWORD to .env file');
    console.error('   2. Set DATABASE_URL with full connection string');
    console.error('   3. Execute SQL manually in Supabase SQL Editor:');
    console.error('      https://supabase.com/dashboard/project/fsszpnbuabhhvrdmrtct/sql');
  } finally {
    await client.end();
    console.log('\n🔒 Connection closed');
  }
}

runMigration();
