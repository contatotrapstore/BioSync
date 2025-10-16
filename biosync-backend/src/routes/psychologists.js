const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const isPsychologist = require('../middleware/isPsychologist');
const psychologistController = require('../controllers/psychologistController');

/**
 * Rotas para psicólogos
 * Todas as rotas requerem autenticação + ser psicólogo
 */

// Middleware aplicado a todas as rotas deste router
router.use(authenticate);
router.use(isPsychologist);

/**
 * GET /api/v1/psychologists/patients
 * Listar todos os pacientes do psicólogo com estatísticas
 */
router.get('/patients', psychologistController.getPatientsWithScores);

/**
 * GET /api/v1/psychologists/patients/:id
 * Obter informações básicas de um paciente específico
 */
router.get('/patients/:id', psychologistController.getPatient);

/**
 * GET /api/v1/psychologists/patients/:id/scores
 * Obter pontuações detalhadas de um paciente específico
 */
router.get('/patients/:id/scores', psychologistController.getPatientScores);

module.exports = router;
