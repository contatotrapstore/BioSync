const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const gameRoutes = require('./gameRoutes');
const userRoutes = require('./userRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const webhookRoutes = require('./webhooks');
const gameRequestRoutes = require('./gameRequests');
const downloadsRoutes = require('./downloads');
const paymentRoutes = require('./payments');
const psychologistsRoutes = require('./psychologists');
const scoresRoutes = require('./scores');

// API routes
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/users', userRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes); // Nova rota de pagamentos únicos
router.use('/webhooks', webhookRoutes);
router.use('/game-requests', gameRequestRoutes);
router.use('/downloads', downloadsRoutes);
router.use('/psychologists', psychologistsRoutes); // Sistema de Psicólogos
router.use('/scores', scoresRoutes); // Sistema de Pontuações

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NeuroOne API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;


