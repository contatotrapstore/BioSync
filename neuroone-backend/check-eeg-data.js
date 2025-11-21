/**
 * Script para verificar dados EEG salvos no banco
 */

import { query } from './src/services/database.js';

async function checkEEGData() {
  try {
    console.log('🔍 Verificando dados EEG no banco...\n');

    // Consultar últimas sessões
    const sessions = await query(`
      SELECT id, title, session_type, status, created_at, end_time
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`📊 Últimas ${sessions.rows.length} sessões:\n`);
    sessions.rows.forEach((session, i) => {
      console.log(`${i + 1}. ${session.title}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Tipo: ${session.session_type}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Criada: ${session.created_at}`);
      console.log(`   Finalizada: ${session.end_time || 'N/A'}`);
      console.log('');
    });

    // Para cada sessão, verificar quantos dados EEG existem
    for (const session of sessions.rows) {
      const eegCount = await query(`
        SELECT COUNT(*) as count
        FROM eeg_data
        WHERE session_id = $1
      `, [session.id]);

      console.log(`📈 Sessão "${session.title}": ${eegCount.rows[0].count} registros EEG`);

      if (eegCount.rows[0].count > 0) {
        // Buscar uma amostra de dados
        const sample = await query(`
          SELECT
            attention,
            relaxation,
            delta,
            theta,
            alpha,
            beta,
            gamma,
            low_alpha,
            high_alpha,
            low_beta,
            high_beta,
            low_gamma,
            mid_gamma,
            signal_quality,
            timestamp
          FROM eeg_data
          WHERE session_id = $1
          ORDER BY timestamp DESC
          LIMIT 3
        `, [session.id]);

        console.log(`\n   Amostra de dados (últimos 3 registros):`);
        sample.rows.forEach((row, i) => {
          console.log(`\n   Registro ${i + 1}:`);
          console.log(`   - Attention: ${row.attention}`);
          console.log(`   - Relaxation: ${row.relaxation}`);
          console.log(`   - Signal Quality: ${row.signal_quality}`);
          console.log(`   - Delta: ${row.delta}`);
          console.log(`   - Theta: ${row.theta}`);
          console.log(`   - Alpha: ${row.alpha || 'NULL'}`);
          console.log(`   - Beta: ${row.beta || 'NULL'}`);
          console.log(`   - Gamma: ${row.gamma || 'NULL'}`);
          console.log(`   - Low Alpha: ${row.low_alpha || 'NULL'}`);
          console.log(`   - High Alpha: ${row.high_alpha || 'NULL'}`);
          console.log(`   - Low Beta: ${row.low_beta || 'NULL'}`);
          console.log(`   - High Beta: ${row.high_beta || 'NULL'}`);
          console.log(`   - Low Gamma: ${row.low_gamma || 'NULL'}`);
          console.log(`   - Mid Gamma: ${row.mid_gamma || 'NULL'}`);
          console.log(`   - Timestamp: ${row.timestamp}`);
        });

        // Calcular médias
        const avg = await query(`
          SELECT
            AVG(attention) as avg_attention,
            AVG(relaxation) as avg_relaxation,
            AVG(signal_quality) as avg_signal
          FROM eeg_data
          WHERE session_id = $1
        `, [session.id]);

        console.log(`\n   📊 Médias calculadas:`);
        console.log(`   - Atenção Média: ${parseFloat(avg.rows[0].avg_attention || 0).toFixed(2)}%`);
        console.log(`   - Relaxamento Médio: ${parseFloat(avg.rows[0].avg_relaxation || 0).toFixed(2)}%`);
        console.log(`   - Qualidade Sinal: ${parseFloat(avg.rows[0].avg_signal || 0).toFixed(2)}`);
      }

      console.log('\n' + '='.repeat(70) + '\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar dados EEG:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkEEGData();
