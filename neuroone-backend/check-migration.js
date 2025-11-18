import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function checkMigration() {
  try {
    console.log('🔍 Checking if migration is needed...\n');

    // Try to fetch classes with new columns
    const url = `${supabaseUrl}/rest/v1/classes?select=id,name,teacher_id,subject&limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Migration already applied!');
      console.log('   Columns teacher_id and subject exist in classes table');

      if (data.length > 0) {
        console.log('\n📊 Sample class:');
        console.log('   ID:', data[0].id);
        console.log('   Name:', data[0].name);
        console.log('   Teacher ID:', data[0].teacher_id || '(null)');
        console.log('   Subject:', data[0].subject || '(null)');
      }

      console.log('\n🎉 Database is ready! You can now:');
      console.log('   1. Reload the frontend (Ctrl+F5)');
      console.log('   2. Create a new class with teacher and subject fields');

      return true;
    } else {
      const error = await response.text();
      console.log('❌ Migration NOT applied');
      console.log('   Error:', error);

      console.log('\n📝 To apply migration, execute this SQL in Supabase:');
      console.log('   https://supabase.com/dashboard/project/fsszpnbuabhhvrdmrtct/sql');
      console.log('\nSQL to execute:');
      console.log('─'.repeat(60));
      console.log(`
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS subject TEXT;

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

UPDATE classes
SET teacher_id = created_by
WHERE created_by IN (SELECT id FROM users WHERE user_role = 'professor')
AND teacher_id IS NULL;

COMMENT ON COLUMN classes.teacher_id IS 'Professor responsável pela turma';
COMMENT ON COLUMN classes.subject IS 'Matéria ou disciplina da turma (ex: Matemática, Português)';
      `.trim());
      console.log('─'.repeat(60));

      return false;
    }
  } catch (error) {
    console.error('❌ Error checking migration:', error.message);
    return false;
  }
}

checkMigration();
