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

async function cleanupOldData() {
  console.log('🧹 Iniciando limpeza de dados antigos...\n');

  try {
    // 1. Listar todas as sessões
    console.log('📋 Buscando sessões...');
    const sessions = await supabaseQuery(`${SUPABASE_URL}/rest/v1/sessions?select=*`);
    console.log(`   Encontradas ${sessions.length} sessões\n`);

    // 2. Deletar dados EEG de todas as sessões
    console.log('🗑️  Deletando dados EEG...');
    if (sessions.length > 0) {
      for (const session of sessions) {
        await supabaseQuery(`${SUPABASE_URL}/rest/v1/eeg_data?session_id=eq.${session.id}`, {
          method: 'DELETE'
        });
      }
    }
    console.log(`   ✅ Dados EEG deletados\n`);

    // 3. Deletar todas as sessões
    console.log('🗑️  Deletando sessões...');
    for (const session of sessions) {
      await supabaseQuery(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${session.id}`, {
        method: 'DELETE'
      });
    }
    console.log(`   ✅ ${sessions.length} sessões deletadas\n`);

    // 4. Listar turmas
    console.log('📋 Buscando turmas...');
    const classes = await supabaseQuery(`${SUPABASE_URL}/rest/v1/classes?select=*`);
    console.log(`   Encontradas ${classes.length} turmas\n`);

    // 5. Deletar matrículas de alunos
    console.log('🗑️  Deletando matrículas...');
    for (const cls of classes) {
      await supabaseQuery(`${SUPABASE_URL}/rest/v1/class_students?class_id=eq.${cls.id}`, {
        method: 'DELETE'
      });
    }
    console.log(`   ✅ Matrículas deletadas\n`);

    // 6. Deletar turmas
    console.log('🗑️  Deletando turmas...');
    for (const cls of classes) {
      await supabaseQuery(`${SUPABASE_URL}/rest/v1/classes?id=eq.${cls.id}`, {
        method: 'DELETE'
      });
    }
    console.log(`   ✅ ${classes.length} turmas deletadas\n`);

    console.log('✨ Limpeza concluída com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   - ${sessions.length} sessões deletadas`);
    console.log(`   - Dados EEG deletados`);
    console.log(`   - ${classes.length} turmas deletadas`);
    console.log(`   - Matrículas deletadas\n`);

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    process.exit(1);
  }
}

cleanupOldData();
