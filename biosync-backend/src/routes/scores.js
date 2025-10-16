const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const scoresController = require('../controllers/scoresController');
const { body } = require('express-validator');

/**
 * Rotas para pontuações de jogos
 */

/**
 * POST /api/v1/scores
 * Registrar uma nova pontuação
 * Requer autenticação
 */
router.post(
  '/',
  authenticate,
  [
    body('gameSlug').notEmpty().withMessage('gameSlug é obrigatório'),
    body('score').isNumeric().withMessage('score deve ser numérico')
  ],
  scoresController.createScore
);

/**
 * GET /api/v1/scores/my
 * Obter pontuações do usuário autenticado
 */
router.get('/my', authenticate, scoresController.getMyScores);

/**
 * GET /api/v1/scores/stats
 * Obter estatísticas do usuário autenticado
 */
router.get('/stats', authenticate, scoresController.getMyStats);

/**
 * GET /api/v1/scores/user/:userId
 * Obter pontuações de um usuário específico
 * Requer: ser o próprio usuário, psicólogo do paciente ou admin
 */
router.get('/user/:userId', authenticate, scoresController.getUserScores);

/**
 * GET /api/v1/scores/game/:gameId
 * Obter pontuações de um jogo específico
 * Requer: ser admin
 */
router.get('/game/:gameId', authenticate, authorizeAdmin, scoresController.getGameScores);

module.exports = router;
