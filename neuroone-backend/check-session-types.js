/**
 * Script para verificar tipos de sessão existentes no banco
 */

import { query } from './src/services/database.js';

async function checkSessionTypes() {
  try {
    console.log('🔍 Verificando tipos de sessão no banco...\n');

    // Consultar todas as sessões e seus tipos
    const result = await query(`
      SELECT
        id,
        title,
        session_type,
        created_at
      FROM sessions
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('✅ Nenhuma sessão encontrada no banco.');
      console.log('   Pode prosseguir com as alterações sem necessidade de migração.\n');
      process.exit(0);
    }

    console.log(`📊 Total de sessões: ${result.rows.length}\n`);

    // Agrupar por tipo
    const typeCount = {};
    result.rows.forEach(row => {
      const type = row.session_type || 'NULL';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    console.log('Distribuição por tipo:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} sessão(ões)`);
    });

    console.log('\n📝 Sessões encontradas:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title} (tipo: ${row.session_type || 'NULL'})`);
    });

    // Verificar se há tipos incompatíveis
    const incompatibleTypes = result.rows.filter(row =>
      !['monitoramento', 'neurogame', 'avaliacao'].includes(row.session_type)
    );

    if (incompatibleTypes.length > 0) {
      console.log('\n⚠️  ATENÇÃO: Sessões com tipos incompatíveis detectadas!');
      console.log('   Será necessário migrar os dados após alterar o constraint.\n');
      incompatibleTypes.forEach(row => {
        console.log(`   - ID ${row.id}: "${row.title}" (tipo: ${row.session_type})`);
      });
    } else {
      console.log('\n✅ Todos os tipos são compatíveis com o novo schema!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar sessões:', error.message);
    process.exit(1);
  }
}

checkSessionTypes();
