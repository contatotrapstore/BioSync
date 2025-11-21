import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTY0NCwiZXhwIjoyMDc4OTQ3NjQ0fQ.imC7bY7nj0ruaiqJMnvTPScBjImelVK-HdMp8M5Dnxk';

async function supabaseQuery(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function checkSessions() {
  console.log('🔍 Verificando sessões ativas...\n');

  try {
    // 1. Verificar sessões ativas
    const sessions = await supabaseQuery(`${SUPABASE_URL}/rest/v1/sessions?select=*,classes(name,school_year),users!sessions_teacher_id_fkey(name)&status=eq.active`);

    console.log('📊 Sessões Ativas:');
    console.log(`   Total: ${sessions.length}\n`);

    if (sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.title}`);
        console.log(`      ID: ${session.id}`);
        console.log(`      Status: ${session.status}`);
        console.log(`      Turma: ${session.classes?.name} (${session.classes?.school_year})`);
        console.log(`      Professor: ${session.users?.name}`);
        console.log(`      Início: ${session.start_time}`);
        console.log('');
      });
    }

    // 2. Verificar turmas
    const classes = await supabaseQuery(`${SUPABASE_URL}/rest/v1/classes?select=*`);
    console.log(`📚 Total de Turmas: ${classes.length}\n`);

    // 3. Verificar matrículas
    const enrollments = await supabaseQuery(`${SUPABASE_URL}/rest/v1/class_students?select=*,users!class_students_student_id_fkey(name,email)`);
    console.log(`👥 Total de Matrículas: ${enrollments.length}`);

    if (enrollments.length > 0) {
      console.log('\n   Alunos matriculados:');
      enrollments.forEach((enroll, index) => {
        console.log(`   ${index + 1}. ${enroll.users?.name} (${enroll.users?.email})`);
        console.log(`      Turma ID: ${enroll.class_id}`);
      });
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkSessions();
