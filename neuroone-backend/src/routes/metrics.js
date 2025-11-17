import express from 'express';
import { calculateSessionMetrics, getCachedMetrics } from '../services/metricsCalculator.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/metrics/sessions/:sessionId/calculate
 * Calculate and cache metrics for a session
 */
router.post('/sessions/:sessionId/calculate', async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info(`Calculating metrics for session ${sessionId}`);

    const metrics = await calculateSessionMetrics(sessionId);

    logger.success(`Metrics calculated for session ${sessionId}`);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error calculating metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate metrics',
    });
  }
});

/**
 * GET /api/metrics/sessions/:sessionId
 * Get cached metrics for a session (or calculate if not cached)
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info(`Getting metrics for session ${sessionId}`);

    // Try to get cached metrics first
    let metrics = await getCachedMetrics(sessionId);

    // If no cache, calculate fresh
    if (!metrics) {
      logger.info(`No cached metrics found, calculating fresh for session ${sessionId}`);
      metrics = await calculateSessionMetrics(sessionId);
    }

    res.json({
      success: true,
      data: metrics,
      cached: !!metrics.calculatedAt,
    });
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get metrics',
    });
  }
});

/**
 * GET /api/metrics/sessions/:sessionId/export
 * Export session metrics as CSV
 */
router.get('/sessions/:sessionId/export', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const metrics = await getCachedMetrics(sessionId);
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Metrics not found. Calculate metrics first.',
      });
    }

    // Generate CSV
    const headers = ['Nome', 'Atenção Média', 'Relaxamento Médio', 'Duração (min)', 'Qualidade Sinal'];
    const rows = metrics.students.map((s) => [
      s.studentName,
      s.avgAttention,
      s.avgRelaxation,
      s.durationMinutes.toFixed(1),
      s.avgSignalQuality,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}-metrics.csv"`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export metrics',
    });
  }
});

export default router;
