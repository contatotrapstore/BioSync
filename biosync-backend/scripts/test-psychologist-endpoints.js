/**
 * Script para testar endpoints do sistema de psicólogos e pontuações
 *
 * Uso:
 *   node test-psychologist-endpoints.js
 *
 * Configuração:
 *   Edite as variáveis API_URL, EMAIL e PASSWORD abaixo
 */

const axios = require('axios');

// ===================================================================
// CONFIGURAÇÃO - AJUSTAR CONFORME NECESSÁRIO
// ===================================================================
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const PSYCHOLOGIST_EMAIL = process.env.PSYCHOLOGIST_EMAIL || 'psicologo@teste.com';
const PSYCHOLOGIST_PASSWORD = process.env.PSYCHOLOGIST_PASSWORD || 'senha123';
const PATIENT_ID = process.env.PATIENT_ID || null; // Opcional
const GAME_SLUG = 'labirinto'; // Slug de um jogo existente para testar pontuação

// ===================================================================
// VARIÁVEIS GLOBAIS
// ===================================================================
let TOKEN = null;
let PATIENT_TEST_ID = null;

// ===================================================================
// FUNÇÕES DE TESTE
// ===================================================================

/**
 * 1. Testar login de psicólogo
 */
async function testLogin() {
  console.log('\n🔐 1️⃣ Testando Login de Psicólogo...');
  console.log(`   Email: ${PSYCHOLOGIST_EMAIL}`);

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: PSYCHOLOGIST_EMAIL,
      password: PSYCHOLOGIST_PASSWORD
    });

    if (response.data.success) {
      TOKEN = response.data.data.token;
      const user = response.data.data.user;

      console.log('   ✅ Login bem-sucedido!');
      console.log(`   Token: ${TOKEN.substring(0, 30)}...`);
      console.log(`   Usuário: ${user.fullName || user.email}`);
      console.log(`   É Psicólogo: ${user.isPsychologist ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`   É Admin: ${user.isAdmin ? 'SIM' : 'NÃO'}`);

      if (!user.isPsychologist) {
        console.log('   ⚠️  AVISO: Usuário não é psicólogo! Os próximos testes falharão.');
      }

      return true;
    }
  } catch (error) {
    console.log('   ❌ Erro no login');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Erro: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 2. Testar GET /psychologists/patients
 */
async function testGetPatients() {
  console.log('\n👥 2️⃣ Testando GET /psychologists/patients...');

  try {
    const response = await axios.get(`${API_URL}/psychologists/patients`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (response.data.success) {
      const patients = response.data.data;
      console.log(`   ✅ Pacientes recuperados com sucesso!`);
      console.log(`   Total: ${patients.length} paciente(s)`);

      if (patients.length > 0) {
        console.log('\n   📋 Lista de Pacientes:');
        patients.forEach((p, index) => {
          console.log(`   ${index + 1}. ${p.name} (${p.email})`);
          console.log(`      Sessões: ${p.stats.totalSessions}`);
          console.log(`      Média: ${p.stats.avgScore}`);
          console.log(`      Melhor: ${p.stats.bestScore}`);
          console.log(`      Jogos: ${p.stats.totalGames}`);
        });

        // Salvar ID do primeiro paciente para testes futuros
        PATIENT_TEST_ID = patients[0].id;
      } else {
        console.log('   ℹ️  Nenhum paciente atribuído ainda');
        console.log('   💡 Dica: Use o admin panel para atribuir pacientes a este psicólogo');
      }

      return true;
    }
  } catch (error) {
    console.log('   ❌ Erro ao buscar pacientes');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Erro: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 3. Testar GET /psychologists/patients/:id/scores
 */
async function testGetPatientScores() {
  const patientId = PATIENT_ID || PATIENT_TEST_ID;

  if (!patientId) {
    console.log('\n📊 3️⃣ Testando GET /psychologists/patients/:id/scores...');
    console.log('   ⏭️  PULADO: Nenhum ID de paciente disponível');
    return true;
  }

  console.log(`\n📊 3️⃣ Testando GET /psychologists/patients/${patientId}/scores...`);

  try {
    const response = await axios.get(
      `${API_URL}/psychologists/patients/${patientId}/scores`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (response.data.success) {
      const data = response.data.data;
      const { patient, stats, scores } = data;

      console.log('   ✅ Pontuações recuperadas com sucesso!');
      console.log(`\n   👤 Paciente: ${patient.name} (${patient.email})`);
      console.log(`\n   📈 Estatísticas:`);
      console.log(`      Total de Sessões: ${stats.totalSessions}`);
      console.log(`      Pontuação Média: ${stats.avgScore}`);
      console.log(`      Melhor Pontuação: ${stats.bestScore}`);
      console.log(`      Total de Jogos: ${stats.totalGames}`);

      if (scores.length > 0) {
        console.log(`\n   🎮 Últimas 5 Sessões:`);
        scores.slice(0, 5).forEach((score, index) => {
          const date = new Date(score.created_at).toLocaleString('pt-BR');
          console.log(`      ${index + 1}. ${score.games?.name || 'Jogo'} - Pontuação: ${score.score} (${date})`);
        });
      } else {
        console.log('\n   ℹ️  Nenhuma pontuação registrada ainda');
      }

      return true;
    }
  } catch (error) {
    console.log('   ❌ Erro ao buscar pontuações');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Erro: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * 4. Testar POST /scores
 */
async function testCreateScore() {
  console.log(`\n🎯 4️⃣ Testando POST /scores...`);
  console.log(`   Jogo: ${GAME_SLUG}`);

  try {
    const randomScore = Math.floor(Math.random() * 100) + 1;
    const response = await axios.post(
      `${API_URL}/scores`,
      {
        gameSlug: GAME_SLUG,
        score: randomScore,
        metadata: {
          level: 5,
          timeSeconds: 120,
          timestamp: new Date().toISOString()
        }
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (response.data.success) {
      console.log('   ✅ Pontuação criada com sucesso!');
      console.log(`   Pontuação: ${randomScore}`);
      console.log(`   ID: ${response.data.data?.id || 'N/A'}`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Erro ao criar pontuação');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Erro: ${error.response?.data?.error || error.message}`);

    if (error.response?.status === 404) {
      console.log(`   💡 Dica: Verifique se o jogo '${GAME_SLUG}' existe no banco de dados`);
    }

    return false;
  }
}

/**
 * 5. Testar GET /scores/my
 */
async function testGetMyScores() {
  console.log('\n📖 5️⃣ Testando GET /scores/my...');

  try {
    const response = await axios.get(`${API_URL}/scores/my`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (response.data.success) {
      const scores = response.data.data;
      console.log('   ✅ Minhas pontuações recuperadas!');
      console.log(`   Total: ${scores.length} pontuação(ões)`);

      if (scores.length > 0) {
        console.log('\n   🎮 Últimas 3 pontuações:');
        scores.slice(0, 3).forEach((score, index) => {
          const date = new Date(score.created_at).toLocaleString('pt-BR');
          console.log(`      ${index + 1}. ${score.games?.name || 'Jogo'} - ${score.score} pontos (${date})`);
        });
      }

      return true;
    }
  } catch (error) {
    console.log('   ❌ Erro ao buscar minhas pontuações');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Erro: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// ===================================================================
// EXECUÇÃO DOS TESTES
// ===================================================================

async function runTests() {
  console.log('═'.repeat(70));
  console.log('🧪 TESTE DOS ENDPOINTS - SISTEMA DE PSICÓLOGOS E PONTUAÇÕES');
  console.log('═'.repeat(70));
  console.log(`📡 API URL: ${API_URL}`);
  console.log('═'.repeat(70));

  const results = {
    total: 5,
    passed: 0,
    failed: 0
  };

  // 1. Login
  const loginOk = await testLogin();
  if (loginOk) results.passed++;
  else results.failed++;

  if (!TOKEN) {
    console.log('\n❌ TESTES INTERROMPIDOS: Login falhou');
    console.log('💡 Verifique se o usuário existe e tem a flag is_psychologist = true');
    process.exit(1);
  }

  // 2. Get Patients
  const patientsOk = await testGetPatients();
  if (patientsOk) results.passed++;
  else results.failed++;

  // 3. Get Patient Scores
  const scoresOk = await testGetPatientScores();
  if (scoresOk) results.passed++;
  else results.failed++;

  // 4. Create Score
  const createOk = await testCreateScore();
  if (createOk) results.passed++;
  else results.failed++;

  // 5. Get My Scores
  const myScoresOk = await testGetMyScores();
  if (myScoresOk) results.passed++;
  else results.failed++;

  // Resumo final
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESUMO DOS TESTES');
  console.log('═'.repeat(70));
  console.log(`✅ Sucesso: ${results.passed}/${results.total}`);
  console.log(`❌ Falhas:  ${results.failed}/${results.total}`);
  console.log('═'.repeat(70));

  if (results.failed === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    process.exit(0);
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM');
    process.exit(1);
  }
}

// Executar testes
runTests().catch((error) => {
  console.error('\n❌ Erro fatal durante os testes:', error.message);
  process.exit(1);
});
