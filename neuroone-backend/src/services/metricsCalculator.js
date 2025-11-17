import pool from './database.js';

/**
 * Calculate session metrics from EEG data
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Object>} - Calculated metrics
 */
export async function calculateSessionMetrics(sessionId) {
  try {
    // 1. Get session info
    const sessionQuery = `
      SELECT
        s.*,
        c.name as class_name,
        c.school_year
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1;
    `;
    const sessionResult = await pool.query(sessionQuery, [sessionId]);
    const session = sessionResult.rows[0];

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Calculate overall session metrics
    const overallQuery = `
      SELECT
        COUNT(DISTINCT student_id) as total_students,
        ROUND(AVG(attention)::numeric, 2) as avg_attention,
        ROUND(AVG(relaxation)::numeric, 2) as avg_relaxation,
        MIN(attention) as min_attention,
        MAX(attention) as max_attention,
        MIN(relaxation) as min_relaxation,
        MAX(relaxation) as max_relaxation,
        ROUND(AVG(signal_quality)::numeric, 2) as avg_signal_quality
      FROM eeg_data
      WHERE session_id = $1;
    `;
    const overallResult = await pool.query(overallQuery, [sessionId]);
    const overall = overallResult.rows[0];

    // 3. Calculate per-student metrics
    const studentMetricsQuery = `
      SELECT
        ed.student_id,
        u.name as student_name,
        COUNT(*) as data_points,
        ROUND(AVG(ed.attention)::numeric, 2) as avg_attention,
        ROUND(AVG(ed.relaxation)::numeric, 2) as avg_relaxation,
        MIN(ed.attention) as min_attention,
        MAX(ed.attention) as max_attention,
        ROUND(AVG(ed.signal_quality)::numeric, 2) as avg_signal_quality,
        MIN(ed.timestamp) as first_data,
        MAX(ed.timestamp) as last_data,
        EXTRACT(EPOCH FROM (MAX(ed.timestamp) - MIN(ed.timestamp)))/60 as duration_minutes
      FROM eeg_data ed
      JOIN users u ON ed.student_id = u.id
      WHERE ed.session_id = $1
      GROUP BY ed.student_id, u.name
      ORDER BY avg_attention DESC;
    `;
    const studentMetricsResult = await pool.query(studentMetricsQuery, [sessionId]);
    const studentMetrics = studentMetricsResult.rows;

    // 4. Calculate attention distribution
    const distributionQuery = `
      SELECT
        COUNT(CASE WHEN attention < 40 THEN 1 END) as low_count,
        COUNT(CASE WHEN attention >= 40 AND attention < 70 THEN 1 END) as medium_count,
        COUNT(CASE WHEN attention >= 70 THEN 1 END) as high_count,
        ROUND(COUNT(CASE WHEN attention < 40 THEN 1 END)::numeric * 100.0 / COUNT(*)::numeric, 2) as low_percentage,
        ROUND(COUNT(CASE WHEN attention >= 40 AND attention < 70 THEN 1 END)::numeric * 100.0 / COUNT(*)::numeric, 2) as medium_percentage,
        ROUND(COUNT(CASE WHEN attention >= 70 THEN 1 END)::numeric * 100.0 / COUNT(*)::numeric, 2) as high_percentage
      FROM eeg_data
      WHERE session_id = $1;
    `;
    const distributionResult = await pool.query(distributionQuery, [sessionId]);
    const distribution = distributionResult.rows[0];

    // 5. Calculate timeline (5-minute buckets)
    const timelineQuery = `
      SELECT
        DATE_TRUNC('minute', timestamp) +
        INTERVAL '5 minute' * FLOOR(EXTRACT(EPOCH FROM (timestamp - $2))/300) as bucket,
        ROUND(AVG(attention)::numeric, 2) as avg_attention,
        MIN(attention) as min_attention,
        MAX(attention) as max_attention,
        ROUND(AVG(relaxation)::numeric, 2) as avg_relaxation,
        COUNT(*) as data_points
      FROM eeg_data
      WHERE session_id = $1
      GROUP BY bucket
      ORDER BY bucket;
    `;
    const timelineResult = await pool.query(timelineQuery, [sessionId, session.start_time]);
    const timeline = timelineResult.rows;

    // 6. Save metrics to session_metrics table
    const sessionMetricsInsert = `
      INSERT INTO session_metrics (
        session_id,
        total_students,
        avg_attention,
        avg_relaxation,
        min_attention,
        max_attention,
        avg_signal_quality,
        data_points,
        calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (session_id)
      DO UPDATE SET
        total_students = EXCLUDED.total_students,
        avg_attention = EXCLUDED.avg_attention,
        avg_relaxation = EXCLUDED.avg_relaxation,
        min_attention = EXCLUDED.min_attention,
        max_attention = EXCLUDED.max_attention,
        avg_signal_quality = EXCLUDED.avg_signal_quality,
        data_points = EXCLUDED.data_points,
        calculated_at = NOW()
      RETURNING *;
    `;

    const totalDataPoints = studentMetrics.reduce((sum, s) => sum + parseInt(s.data_points), 0);

    await pool.query(sessionMetricsInsert, [
      sessionId,
      overall.total_students,
      overall.avg_attention,
      overall.avg_relaxation,
      overall.min_attention,
      overall.max_attention,
      overall.avg_signal_quality,
      totalDataPoints,
    ]);

    // 7. Save per-student metrics
    for (const student of studentMetrics) {
      const studentMetricsInsert = `
        INSERT INTO student_metrics (
          session_id,
          student_id,
          avg_attention,
          avg_relaxation,
          min_attention,
          max_attention,
          avg_signal_quality,
          data_points,
          duration_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (session_id, student_id)
        DO UPDATE SET
          avg_attention = EXCLUDED.avg_attention,
          avg_relaxation = EXCLUDED.avg_relaxation,
          min_attention = EXCLUDED.min_attention,
          max_attention = EXCLUDED.max_attention,
          avg_signal_quality = EXCLUDED.avg_signal_quality,
          data_points = EXCLUDED.data_points,
          duration_minutes = EXCLUDED.duration_minutes;
      `;

      await pool.query(studentMetricsInsert, [
        sessionId,
        student.student_id,
        student.avg_attention,
        student.avg_relaxation,
        student.min_attention,
        student.max_attention,
        student.avg_signal_quality,
        student.data_points,
        student.duration_minutes,
      ]);
    }

    // Return complete metrics
    return {
      session: {
        id: session.id,
        title: session.title,
        className: session.class_name,
        schoolYear: session.school_year,
        startTime: session.start_time,
        endTime: session.end_time,
        status: session.status,
      },
      overall: {
        totalStudents: parseInt(overall.total_students),
        avgAttention: parseFloat(overall.avg_attention),
        avgRelaxation: parseFloat(overall.avg_relaxation),
        minAttention: overall.min_attention,
        maxAttention: overall.max_attention,
        avgSignalQuality: parseFloat(overall.avg_signal_quality),
      },
      distribution: {
        low: {
          count: parseInt(distribution.low_count),
          percentage: parseFloat(distribution.low_percentage),
        },
        medium: {
          count: parseInt(distribution.medium_count),
          percentage: parseFloat(distribution.medium_percentage),
        },
        high: {
          count: parseInt(distribution.high_count),
          percentage: parseFloat(distribution.high_percentage),
        },
      },
      timeline: timeline.map((t) => ({
        timestamp: t.bucket,
        avgAttention: parseFloat(t.avg_attention),
        minAttention: t.min_attention,
        maxAttention: t.max_attention,
        avgRelaxation: parseFloat(t.avg_relaxation),
        dataPoints: parseInt(t.data_points),
      })),
      students: studentMetrics.map((s) => ({
        studentId: s.student_id,
        studentName: s.student_name,
        avgAttention: parseFloat(s.avg_attention),
        avgRelaxation: parseFloat(s.avg_relaxation),
        minAttention: s.min_attention,
        maxAttention: s.max_attention,
        avgSignalQuality: parseFloat(s.avg_signal_quality),
        dataPoints: parseInt(s.data_points),
        durationMinutes: parseFloat(s.duration_minutes),
      })),
    };
  } catch (error) {
    console.error('❌ Error calculating session metrics:', error);
    throw error;
  }
}

/**
 * Get cached metrics for a session
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Object>} - Cached metrics
 */
export async function getCachedMetrics(sessionId) {
  try {
    // Get session metrics
    const sessionMetricsQuery = `
      SELECT
        sm.*,
        s.title,
        s.start_time,
        s.end_time,
        c.name as class_name,
        c.school_year
      FROM session_metrics sm
      JOIN sessions s ON sm.session_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE sm.session_id = $1;
    `;
    const sessionResult = await pool.query(sessionMetricsQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return null; // No cached metrics
    }

    const sessionMetrics = sessionResult.rows[0];

    // Get student metrics
    const studentMetricsQuery = `
      SELECT
        sm.*,
        u.name as student_name
      FROM student_metrics sm
      JOIN users u ON sm.student_id = u.id
      WHERE sm.session_id = $1
      ORDER BY sm.avg_attention DESC;
    `;
    const studentResult = await pool.query(studentMetricsQuery, [sessionId]);

    // Get distribution from session metrics
    const distributionQuery = `
      SELECT
        COUNT(CASE WHEN attention < 40 THEN 1 END) as low_count,
        COUNT(CASE WHEN attention >= 40 AND attention < 70 THEN 1 END) as medium_count,
        COUNT(CASE WHEN attention >= 70 THEN 1 END) as high_count
      FROM eeg_data
      WHERE session_id = $1;
    `;
    const distributionResult = await pool.query(distributionQuery, [sessionId]);
    const distribution = distributionResult.rows[0];

    // Get timeline
    const timelineQuery = `
      SELECT
        DATE_TRUNC('minute', timestamp) +
        INTERVAL '5 minute' * FLOOR(EXTRACT(EPOCH FROM (timestamp - $2))/300) as bucket,
        ROUND(AVG(attention)::numeric, 2) as avg_attention,
        MIN(attention) as min_attention,
        MAX(attention) as max_attention,
        ROUND(AVG(relaxation)::numeric, 2) as avg_relaxation
      FROM eeg_data
      WHERE session_id = $1
      GROUP BY bucket
      ORDER BY bucket;
    `;
    const timelineResult = await pool.query(timelineQuery, [sessionId, sessionMetrics.start_time]);

    return {
      session: {
        id: sessionMetrics.session_id,
        title: sessionMetrics.title,
        className: sessionMetrics.class_name,
        schoolYear: sessionMetrics.school_year,
        startTime: sessionMetrics.start_time,
        endTime: sessionMetrics.end_time,
      },
      overall: {
        totalStudents: sessionMetrics.total_students,
        avgAttention: parseFloat(sessionMetrics.avg_attention),
        avgRelaxation: parseFloat(sessionMetrics.avg_relaxation),
        minAttention: sessionMetrics.min_attention,
        maxAttention: sessionMetrics.max_attention,
        avgSignalQuality: parseFloat(sessionMetrics.avg_signal_quality),
      },
      distribution: {
        low: { count: parseInt(distribution.low_count) },
        medium: { count: parseInt(distribution.medium_count) },
        high: { count: parseInt(distribution.high_count) },
      },
      timeline: timelineResult.rows.map((t) => ({
        timestamp: t.bucket,
        avgAttention: parseFloat(t.avg_attention),
        minAttention: t.min_attention,
        maxAttention: t.max_attention,
        avgRelaxation: parseFloat(t.avg_relaxation),
      })),
      students: studentResult.rows.map((s) => ({
        studentId: s.student_id,
        studentName: s.student_name,
        avgAttention: parseFloat(s.avg_attention),
        avgRelaxation: parseFloat(s.avg_relaxation),
        minAttention: s.min_attention,
        maxAttention: s.max_attention,
        avgSignalQuality: parseFloat(s.avg_signal_quality),
        durationMinutes: parseFloat(s.duration_minutes),
      })),
      calculatedAt: sessionMetrics.calculated_at,
    };
  } catch (error) {
    console.error('❌ Error getting cached metrics:', error);
    throw error;
  }
}
