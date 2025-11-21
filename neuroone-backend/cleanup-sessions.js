/**
 * Script para limpar todas as sessões e dados relacionados
 */

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function deleteAllData() {
  console.log('🗑️  Iniciando limpeza de dados...\n');

  try {
    // 1. Deletar dados EEG
    console.log('1️⃣  Deletando dados EEG...');
    const eegResponse = await fetch(`${SUPABASE_URL}/rest/v1/eeg_data?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (eegResponse.ok) {
      const deleted = await eegResponse.json();
      console.log(`   ✅ ${deleted.length} registros EEG deletados`);
    } else {
      const error = await eegResponse.text();
      console.log(`   ⚠️  Erro ao deletar EEG: ${eegResponse.status} - ${error}`);
    }

    // 2. Deletar métricas de alunos
    console.log('\n2️⃣  Deletando métricas de alunos...');
    const metricsResponse = await fetch(`${SUPABASE_URL}/rest/v1/student_metrics?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (metricsResponse.ok) {
      const deleted = await metricsResponse.json();
      console.log(`   ✅ ${deleted.length} métricas deletadas`);
    } else {
      const error = await metricsResponse.text();
      console.log(`   ⚠️  Erro ao deletar métricas: ${metricsResponse.status} - ${error}`);
    }

    // 3. Deletar participantes de sessão
    console.log('\n3️⃣  Deletando participantes de sessão...');
    const participantsResponse = await fetch(`${SUPABASE_URL}/rest/v1/session_participants?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (participantsResponse.ok) {
      const deleted = await participantsResponse.json();
      console.log(`   ✅ ${deleted.length} participantes deletados`);
    } else {
      const error = await participantsResponse.text();
      console.log(`   ⚠️  Erro ao deletar participantes: ${participantsResponse.status} - ${error}`);
    }

    // 4. Deletar sessões
    console.log('\n4️⃣  Deletando sessões...');
    const sessionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (sessionsResponse.ok) {
      const deleted = await sessionsResponse.json();
      console.log(`   ✅ ${deleted.length} sessões deletadas`);
    } else {
      const error = await sessionsResponse.text();
      console.log(`   ⚠️  Erro ao deletar sessões: ${sessionsResponse.status} - ${error}`);
    }

    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('🔄 Agora você pode criar uma nova sessão para testar.');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
    process.exit(1);
  }
}

deleteAllData();
