const { supabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/v1/scores
 * Cria uma nova pontuação para um jogo
 */
exports.createScore = async (req, res) => {
  try {
    const { gameSlug, score, metadata } = req.body;
    const userId = req.user.id;

    // Validação
    if (!gameSlug) {
      return res.status(400).json({
        success: false,
        error: 'gameSlug é obrigatório'
      });
    }

    if (score === undefined || score === null) {
      return res.status(400).json({
        success: false,
        error: 'score é obrigatório'
      });
    }

    const scoreValue = parseInt(score);
    if (isNaN(scoreValue) || scoreValue < 0) {
      return res.status(400).json({
        success: false,
        error: 'score deve ser um número inteiro não-negativo'
      });
    }

    // Buscar o jogo pelo slug
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, slug')
      .eq('slug', gameSlug)
      .single();

    if (gameError && gameError.code !== 'PGRST116') {
      console.error('[scores] Erro ao buscar jogo:', gameError);
      throw gameError;
    }

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Jogo não encontrado',
        message: `Nenhum jogo encontrado com slug: ${gameSlug}`
      });
    }

    // Criar idempotency key para evitar duplicatas
    const timestamp = Date.now();
    const idempotencyKey = `${userId}-${game.id}-${timestamp}`;

    // Inserir pontuação
    const { data: newScore, error } = await supabase
      .from('game_scores')
      .insert({
        id: uuidv4(),
        user_id: userId,
        game_id: game.id,
        score: scoreValue,
        metadata: metadata || {},
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        games (
          name,
          slug
        )
      `)
      .single();

    if (error) {
      // Se erro de duplicata (idempotency), retornar sucesso
      if (error.code === '23505') {
        console.log('[scores] Pontuação duplicada detectada (idempotency)');
        return res.status(200).json({
          success: true,
          message: 'Pontuação já registrada anteriormente',
          duplicate: true
        });
      }
      console.error('[scores] Erro ao criar pontuação:', error);
      throw error;
    }

    console.log(`[scores] Pontuação criada: user=${userId}, game=${game.slug}, score=${scoreValue}`);

    res.status(201).json({
      success: true,
      data: {
        id: newScore.id,
        score: newScore.score,
        gameSlug: game.slug,
        gameName: game.name,
        metadata: newScore.metadata,
        createdAt: newScore.created_at
      },
      message: 'Pontuação registrada com sucesso'
    });
  } catch (error) {
    console.error('[scores] Erro ao criar pontuação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar pontuação',
      message: error.message
    });
  }
};

/**
 * GET /api/v1/scores/user/:userId
 * Retorna todas as pontuações de um usuário
 */
exports.getUserScores = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Verificar se o usuário pode ver essas pontuações
    // (próprio usuário, psicólogo do paciente ou admin)
    const canView = (
      userId === requestingUserId ||
      req.user.isAdmin ||
      req.user.isPsychologist
    );

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    // Se é psicólogo, verificar se é paciente dele
    if (req.user.isPsychologist && userId !== requestingUserId && !req.user.isAdmin) {
      const { data: relationship } = await supabase
        .from('psychologist_patients')
        .select('*')
        .eq('psychologist_id', requestingUserId)
        .eq('patient_id', userId)
        .single();

      if (!relationship) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para ver pontuações deste usuário'
        });
      }
    }

    // Buscar pontuações
    const { data: scores, error } = await supabase
      .from('game_scores')
      .select(`
        *,
        games (
          name,
          slug,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[scores] Erro ao buscar pontuações:', error);
      throw error;
    }

    res.json({
      success: true,
      data: scores || [],
      count: scores?.length || 0
    });
  } catch (error) {
    console.error('[scores] Erro ao buscar pontuações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pontuações',
      message: error.message
    });
  }
};

/**
 * GET /api/v1/scores/game/:gameId
 * Retorna todas as pontuações de um jogo (apenas admin)
 */
exports.getGameScores = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Apenas admins podem ver todas as pontuações de um jogo
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores.'
      });
    }

    // Buscar pontuações
    const { data: scores, error } = await supabase
      .from('game_scores')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          username
        )
      `)
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[scores] Erro ao buscar pontuações:', error);
      throw error;
    }

    res.json({
      success: true,
      data: scores || [],
      count: scores?.length || 0
    });
  } catch (error) {
    console.error('[scores] Erro ao buscar pontuações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pontuações',
      message: error.message
    });
  }
};

/**
 * GET /api/v1/scores/my
 * Retorna pontuações do usuário autenticado
 */
exports.getMyScores = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: scores, error } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[scores] Erro ao buscar pontuações:', error);
      throw error;
    }

    res.json({
      success: true,
      data: scores || [],
      count: scores?.length || 0
    });
  } catch (error) {
    console.error('[scores] Erro ao buscar pontuações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pontuações',
      message: error.message
    });
  }
};

/**
 * GET /api/v1/scores/stats
 * Retorna estatísticas gerais de pontuações do usuário autenticado
 */
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: scores, error } = await supabase
      .from('game_scores')
      .select('score, game_id')
      .eq('user_id', userId);

    if (error) {
      console.error('[scores] Erro ao buscar estatísticas:', error);
      throw error;
    }

    const totalSessions = scores?.length || 0;
    const avgScore = totalSessions > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalSessions)
      : 0;
    const bestScore = totalSessions > 0
      ? Math.max(...scores.map(s => s.score))
      : 0;
    const uniqueGames = new Set(scores?.map(s => s.game_id) || []);

    res.json({
      success: true,
      data: {
        totalSessions,
        avgScore,
        bestScore,
        totalGames: uniqueGames.size
      }
    });
  } catch (error) {
    console.error('[scores] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas',
      message: error.message
    });
  }
};
