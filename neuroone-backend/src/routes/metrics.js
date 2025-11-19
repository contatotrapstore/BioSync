import express from 'express';
import { calculateSessionMetrics, getCachedMetrics } from '../services/metricsCalculator.js';
import logger from '../utils/logger.js';
import pool from '../services/database.js';

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

/**
 * POST /api/metrics/admin/apply-rls-policies
 * TEMPORARY ENDPOINT - Apply missing RLS policies for metrics tables
 * Run once to fix 406 errors, then delete this endpoint
 */
router.post('/admin/apply-rls-policies', async (req, res) => {
  try {
    logger.info('🔧 Applying RLS policies for metrics tables...');

    const policies = [
      `CREATE POLICY IF NOT EXISTS session_metrics_insert_system ON session_metrics FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS session_metrics_update_system ON session_metrics FOR UPDATE USING (true) WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS student_metrics_insert_system ON student_metrics FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS student_metrics_update_system ON student_metrics FOR UPDATE USING (true) WITH CHECK (true);`
    ];

    const results = [];
    for (const policy of policies) {
      try {
        await pool.query(policy);
        const policyName = policy.match(/POLICY\s+(?:IF NOT EXISTS\s+)?(\w+)/i)[1];
        results.push({ policy: policyName, status: 'created' });
        logger.success(`✅ Applied policy: ${policyName}`);
      } catch (error) {
        if (error.code === '42710') {
          // Policy already exists
          const policyName = policy.match(/POLICY\s+(?:IF NOT EXISTS\s+)?(\w+)/i)[1];
          results.push({ policy: policyName, status: 'already_exists' });
          logger.info(`ℹ️  Policy already exists: ${policyName}`);
        } else {
          throw error;
        }
      }
    }

    logger.success('✅ All RLS policies applied successfully!');

    res.json({
      success: true,
      message: 'RLS policies applied successfully',
      results,
      note: 'This endpoint can now be deleted from the code'
    });
  } catch (error) {
    logger.error('❌ Error applying RLS policies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply RLS policies',
      details: error
    });
  }
});

export default router;
