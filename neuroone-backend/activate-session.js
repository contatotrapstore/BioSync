/**
 * Script para ativar a sessão de teste
 */

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function activateSession() {
  console.log('🚀 Ativando sessão...\n');

  try {
    // 1. Buscar sessão com status 'scheduled'
    const sessionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/sessions?status=eq.scheduled&select=id,title`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    const sessions = await sessionsResponse.json();

    if (sessions.length === 0) {
      console.log('⚠️  Nenhuma sessão agendada encontrada');
      return;
    }

    const session = sessions[0];
    console.log(`📌 Sessão encontrada: "${session.title}" (ID: ${session.id})`);

    // 2. Atualizar status para 'active' e definir start_time
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${session.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'active',
        start_time: new Date().toISOString()
      })
    });

    if (updateResponse.ok) {
      const updated = await updateResponse.json();
      console.log(`\n✅ Sessão "${session.title}" ativada com sucesso!`);
      console.log(`   Status: scheduled → active`);
      console.log(`   Horário de início: ${new Date().toLocaleString('pt-BR')}`);
      console.log('\n🎓 Agora o aluno pode ver a sessão no dashboard!');
    } else {
      const error = await updateResponse.text();
      console.error(`❌ Erro ao ativar sessão: ${updateResponse.status} - ${error}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

activateSession();
