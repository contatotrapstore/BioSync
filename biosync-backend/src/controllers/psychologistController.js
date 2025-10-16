const { supabase } = require('../config/supabase');

/**
 * GET /api/v1/psychologists/patients
 * Retorna lista de pacientes de um psicólogo com suas estatísticas
 */
exports.getPatientsWithScores = async (req, res) => {
  try {
    const psychologistId = req.user.id;

    // Buscar pacientes atribuídos a este psicólogo
    const { data: patients, error } = await supabase
      .from('psychologist_patients')
      .select(`
        patient_id,
        users!psychologist_patients_patient_id_fkey (
          id,
          full_name,
          email,
          username
        )
      `)
      .eq('psychologist_id', psychologistId);

    if (error) {
      console.error('[psychologist] Erro ao buscar pacientes:', error);
      throw error;
    }

    if (!patients || patients.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Nenhum paciente atribuído ainda'
      });
    }

    // Para cada paciente, buscar estatísticas de pontuação
    const patientsWithScores = await Promise.all(
      patients.map(async (p) => {
        const patientId = p.patient_id;
        const patientInfo = p.users;

        // Buscar pontuações do paciente
        const { data: scores, error: scoresError } = await supabase
          .from('game_scores')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false });

        if (scoresError) {
          console.error(`[psychologist] Erro ao buscar pontuações do paciente ${patientId}:`, scoresError);
          throw scoresError;
        }

        // Calcular estatísticas
        const totalSessions = scores?.length || 0;
        const avgScore = totalSessions > 0
          ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalSessions)
          : 0;
        const bestScore = totalSessions > 0
          ? Math.max(...scores.map(s => s.score))
          : 0;

        // Calcular jogos únicos
        const uniqueGames = new Set(scores?.map(s => s.game_id) || []);
        const totalGames = uniqueGames.size;

        return {
          id: patientId,
          name: patientInfo?.full_name || patientInfo?.username || patientInfo?.email || 'Sem nome',
          email: patientInfo?.email || 'Sem email',
          username: patientInfo?.username || null,
          stats: {
            totalSessions,
            avgScore,
            bestScore,
            totalGames
          }
        };
      })
    );

    res.json({
      success: true,
      data: patientsWithScores,
      count: patientsWithScores.length
    });
  } catch (error) {
    console.error('[psychologist] Erro ao buscar pacientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pacientes',
      message: error.message
    });
  }
};

/**
 * GET /api/v1/psychologists/patients/:id/scores
 * Retorna pontuações detalhadas de um paciente específico
 */
exports.getPatientScores = async (req, res) => {
  try {
    const psychologistId = req.user.id;
    const patientId = req.params.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'ID do paciente é obrigatório'
      });
    }

    // Verificar se o paciente pertence a este psicólogo
    const { data: relationship, error: relError } = await supabase
      .from('psychologist_patients')
      .select('*')
      .eq('psychologist_id', psychologistId)
      .eq('patient_id', patientId)
      .single();

    if (relError && relError.code !== 'PGRST116') {
      console.error('[psychologist] Erro ao verificar relacionamento:', relError);
      throw relError;
    }

    if (!relationship) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a este paciente'
      });
    }

    // Buscar informações do paciente
    const { data: patient, error: patientError } = await supabase
      .from('users')
      .select('id, full_name, email, username')
      .eq('id', patientId)
      .single();

    if (patientError) {
      console.error('[psychologist] Erro ao buscar paciente:', patientError);
      throw patientError;
    }

    // Buscar todas as pontuações com informações do jogo
    const { data: scores, error: scoresError } = await supabase
      .from('game_scores')
      .select(`
        *,
        games (
          name,
          slug,
          category,
          cover_image
        )
      `)
      .eq('user_id', patientId)
      .order('created_at', { ascending: false });

    if (scoresError) {
      console.error('[psychologist] Erro ao buscar pontuações:', scoresError);
      throw scoresError;
    }

    // Calcular estatísticas gerais
    const totalSessions = scores?.length || 0;
    const avgScore = totalSessions > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalSessions)
      : 0;
    const bestScore = totalSessions > 0
      ? Math.max(...scores.map(s => s.score))
      : 0;
    const uniqueGames = new Set(scores?.map(s => s.game_id) || []);
    const totalGames = uniqueGames.size;

    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          name: patient.full_name || patient.username || patient.email,
          email: patient.email,
          username: patient.username
        },
        stats: {
          totalSessions,
          avgScore,
          bestScore,
          totalGames
        },
        scores: scores || []
      }
    });
  } catch (error) {
    console.error('[psychologist] Erro ao buscar pontuações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pontuações',
      message: error.message
    });
  }
};

/**
 * GET /api/v1/psychologists/patients/:id
 * Retorna informações básicas de um paciente
 */
exports.getPatient = async (req, res) => {
  try {
    const psychologistId = req.user.id;
    const patientId = req.params.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'ID do paciente é obrigatório'
      });
    }

    // Verificar se o paciente pertence a este psicólogo
    const { data: relationship, error: relError } = await supabase
      .from('psychologist_patients')
      .select('*')
      .eq('psychologist_id', psychologistId)
      .eq('patient_id', patientId)
      .single();

    if (relError && relError.code !== 'PGRST116') {
      throw relError;
    }

    if (!relationship) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a este paciente'
      });
    }

    // Buscar informações do paciente
    const { data: patient, error: patientError } = await supabase
      .from('users')
      .select('id, full_name, email, username, created_at, last_login')
      .eq('id', patientId)
      .single();

    if (patientError) {
      throw patientError;
    }

    res.json({
      success: true,
      data: {
        id: patient.id,
        name: patient.full_name || patient.username || patient.email,
        email: patient.email,
        username: patient.username,
        createdAt: patient.created_at,
        lastLogin: patient.last_login
      }
    });
  } catch (error) {
    console.error('[psychologist] Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar paciente',
      message: error.message
    });
  }
};
