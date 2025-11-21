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

async function testCreateActiveSession() {
  console.log('🧪 Testando criação de sessão ATIVA...\n');

  try {
    // 1. Buscar uma turma existente
    console.log('📋 Buscando turmas...');
    const classes = await supabaseQuery(`${SUPABASE_URL}/rest/v1/classes?select=*&limit=1`);

    if (classes.length === 0) {
      console.log('❌ Nenhuma turma encontrada. Crie uma turma primeiro.');
      return;
    }

    const testClass = classes[0];
    console.log(`   ✅ Turma encontrada: ${testClass.name} (ID: ${testClass.id})\n`);

    // 2. Buscar um professor
    console.log('👨‍🏫 Buscando professores...');
    const teachers = await supabaseQuery(`${SUPABASE_URL}/rest/v1/users?select=*&user_role=eq.professor&active=eq.true&limit=1`);

    if (teachers.length === 0) {
      console.log('❌ Nenhum professor encontrado.');
      return;
    }

    const teacher = teachers[0];
    console.log(`   ✅ Professor encontrado: ${teacher.name} (ID: ${teacher.id})\n`);

    // 3. Criar sessão com status ACTIVE
    console.log('🎯 Criando sessão com status ACTIVE...');
    const newSession = await supabaseQuery(`${SUPABASE_URL}/rest/v1/sessions`, {
      method: 'POST',
      body: {
        teacher_id: teacher.id,
        class_id: testClass.id,
        title: 'Teste Sessão Ativa',
        description: 'Sessão de teste criada automaticamente',
        session_type: 'monitoramento',
        status: 'active',
        start_time: new Date().toISOString(),
        duration_minutes: 30
      }
    });

    const session = Array.isArray(newSession) ? newSession[0] : newSession;
    console.log(`   ✅ Sessão criada com ID: ${session.id}`);
    console.log(`   📊 Status: ${session.status}`);
    console.log(`   📝 Título: ${session.title}\n`);

    // 4. Verificar se a sessão aparece na query de sessões ativas
    console.log('🔍 Verificando se a sessão aparece como ATIVA...');
    const activeSessions = await supabaseQuery(`${SUPABASE_URL}/rest/v1/sessions?select=*&status=eq.active`);

    const foundSession = activeSessions.find(s => s.id === session.id);

    if (foundSession) {
      console.log(`   ✅ SUCESSO! Sessão encontrada na query de sessões ativas`);
      console.log(`   📊 Total de sessões ativas: ${activeSessions.length}\n`);
    } else {
      console.log(`   ❌ ERRO! Sessão NÃO encontrada na query de sessões ativas\n`);
    }

    // 5. Mostrar detalhes para teste manual
    console.log('📱 Para testar no frontend:');
    console.log(`   1. Faça login como aluno da turma "${testClass.name}"`);
    console.log(`   2. Acesse o dashboard do aluno`);
    console.log(`   3. A sessão "${session.title}" deve aparecer automaticamente\n`);

    console.log('✨ Teste concluído!');
    console.log('💡 Dica: Execute check-sessions.js para ver todas as sessões ativas\n');

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    process.exit(1);
  }
}

testCreateActiveSession();
