import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Helper to query Supabase REST API directly
async function supabaseQuery(endpoint, options = {}) {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Calculate session metrics from EEG data
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Object>} - Calculated metrics
 */
export async function calculateSessionMetrics(sessionId) {
  try {
    // 1. Get session info
    const sessions = await supabaseQuery(`sessions?id=eq.${sessionId}&select=*,classes(name,school_year)`);
    const session = sessions[0];

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Get all EEG data for this session
    const eegData = await supabaseQuery(`eeg_data?session_id=eq.${sessionId}&select=*`);

    if (eegData.length === 0) {
      // Return empty metrics if no data
      return {
        session: {
          id: session.id,
          title: session.title,
          className: session.classes?.name,
          schoolYear: session.classes?.school_year,
          startTime: session.start_time,
          endTime: session.end_time,
          status: session.status,
        },
        overall: {
          totalStudents: 0,
          avgAttention: 0,
          avgRelaxation: 0,
          minAttention: 0,
          maxAttention: 0,
          avgSignalQuality: 0,
        },
        distribution: {
          low: { count: 0, percentage: 0 },
          medium: { count: 0, percentage: 0 },
          high: { count: 0, percentage: 0 },
        },
        timeline: [],
        students: [],
      };
    }

    // 3. Calculate overall metrics
    const uniqueStudents = [...new Set(eegData.map(d => d.student_id))];
    const totalStudents = uniqueStudents.length;

    const avgAttention = eegData.reduce((sum, d) => sum + (d.attention || 0), 0) / eegData.length;
    const avgRelaxation = eegData.reduce((sum, d) => sum + (d.relaxation || 0), 0) / eegData.length;
    const minAttention = Math.min(...eegData.map(d => d.attention || 0));
    const maxAttention = Math.max(...eegData.map(d => d.attention || 0));
    const avgSignalQuality = eegData.reduce((sum, d) => sum + (d.signal_quality || 0), 0) / eegData.length;

    // 4. Calculate per-student metrics
    const studentMetrics = [];
    for (const studentId of uniqueStudents) {
      const studentData = eegData.filter(d => d.student_id === studentId);

      // Get student info
      const students = await supabaseQuery(`users?id=eq.${studentId}&select=name`);
      const student = students[0];

      const studentAvgAttention = studentData.reduce((sum, d) => sum + (d.attention || 0), 0) / studentData.length;
      const studentAvgRelaxation = studentData.reduce((sum, d) => sum + (d.relaxation || 0), 0) / studentData.length;
      const studentMinAttention = Math.min(...studentData.map(d => d.attention || 0));
      const studentMaxAttention = Math.max(...studentData.map(d => d.attention || 0));
      const studentAvgSignalQuality = studentData.reduce((sum, d) => sum + (d.signal_quality || 0), 0) / studentData.length;

      // Calculate duration
      const timestamps = studentData.map(d => new Date(d.timestamp).getTime());
      const durationMs = Math.max(...timestamps) - Math.min(...timestamps);
      const durationMinutes = durationMs / 60000;

      studentMetrics.push({
        studentId,
        studentName: student?.name || 'Unknown',
        avgAttention: parseFloat(studentAvgAttention.toFixed(2)),
        avgRelaxation: parseFloat(studentAvgRelaxation.toFixed(2)),
        minAttention: studentMinAttention,
        maxAttention: studentMaxAttention,
        avgSignalQuality: parseFloat(studentAvgSignalQuality.toFixed(2)),
        dataPoints: studentData.length,
        durationMinutes: parseFloat(durationMinutes.toFixed(2)),
      });
    }

    // Sort by avgAttention descending
    studentMetrics.sort((a, b) => b.avgAttention - a.avgAttention);

    // 5. Calculate attention distribution
    const lowCount = eegData.filter(d => d.attention < 40).length;
    const mediumCount = eegData.filter(d => d.attention >= 40 && d.attention < 70).length;
    const highCount = eegData.filter(d => d.attention >= 70).length;

    const distribution = {
      low: {
        count: lowCount,
        percentage: parseFloat(((lowCount / eegData.length) * 100).toFixed(2)),
      },
      medium: {
        count: mediumCount,
        percentage: parseFloat(((mediumCount / eegData.length) * 100).toFixed(2)),
      },
      high: {
        count: highCount,
        percentage: parseFloat(((highCount / eegData.length) * 100).toFixed(2)),
      },
    };

    // 6. Calculate timeline (10-second buckets for high granularity)
    const sessionStartTime = new Date(session.start_time).getTime();
    const buckets = {};

    eegData.forEach(d => {
      const timestamp = new Date(d.timestamp).getTime();
      const secondsFromStart = Math.floor((timestamp - sessionStartTime) / 1000);
      // Using 10-second buckets for better granularity even in short sessions
      const bucketIndex = Math.floor(secondsFromStart / 10);

      if (!buckets[bucketIndex]) {
        buckets[bucketIndex] = {
          attentionValues: [],
          relaxationValues: [],
        };
      }

      buckets[bucketIndex].attentionValues.push(d.attention || 0);
      buckets[bucketIndex].relaxationValues.push(d.relaxation || 0);
    });

    const timeline = Object.keys(buckets).sort((a, b) => parseInt(a) - parseInt(b)).map(key => {
      const bucket = buckets[key];
      const avgAttention = bucket.attentionValues.reduce((sum, v) => sum + v, 0) / bucket.attentionValues.length;
      const avgRelaxation = bucket.relaxationValues.reduce((sum, v) => sum + v, 0) / bucket.relaxationValues.length;
      const minAttention = Math.min(...bucket.attentionValues);
      const maxAttention = Math.max(...bucket.attentionValues);

      return {
        timestamp: new Date(sessionStartTime + parseInt(key) * 10 * 1000).toISOString(),
        avgAttention: parseFloat(avgAttention.toFixed(2)),
        minAttention,
        maxAttention,
        avgRelaxation: parseFloat(avgRelaxation.toFixed(2)),
        dataPoints: bucket.attentionValues.length,
      };
    });

    // 7. Save metrics to session_metrics table
    // TEMPORARILY DISABLED: Supabase PostgREST schema cache is completely out of sync
    // The cache is rejecting ALL columns including basic ones like 'total_students'
    // This is a critical issue that needs to be fixed at the Supabase level
    //
    // WORKAROUND: Return calculated metrics without persisting to avoid errors
    // Metrics are still calculated and returned in real-time for display
    //
    // TODO: Fix by either:
    // 1. Refreshing Supabase PostgREST schema cache via dashboard
    // 2. Migrating to direct PostgreSQL connection instead of REST API
    // 3. Contacting Supabase support to resolve schema cache issue
    /*
    const sessionMetrics = {
      session_id: sessionId,
      total_students: totalStudents,
      avg_attention: parseFloat(avgAttention.toFixed(2)),
      avg_relaxation: parseFloat(avgRelaxation.toFixed(2)),
    };

    // Upsert session metrics
    await supabaseQuery(`session_metrics?session_id=eq.${sessionId}`, {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates',
      },
      body: sessionMetrics,
    });

    // 8. Save per-student metrics
    for (const student of studentMetrics) {
      const studentMetric = {
        session_id: sessionId,
        student_id: student.studentId,
        avg_attention: student.avgAttention,
        avg_relaxation: student.avgRelaxation,
        min_attention: student.minAttention,
        max_attention: student.maxAttention,
        data_points: student.dataPoints,
        duration_minutes: student.durationMinutes,
      };

      await supabaseQuery(`student_metrics?session_id=eq.${sessionId}&student_id=eq.${student.studentId}`, {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates',
        },
        body: studentMetric,
      });
    }
    */

    // Return complete metrics
    return {
      session: {
        id: session.id,
        title: session.title,
        className: session.classes?.name,
        schoolYear: session.classes?.school_year,
        startTime: session.start_time,
        endTime: session.end_time,
        status: session.status,
      },
      overall: {
        totalStudents,
        avgAttention: parseFloat(avgAttention.toFixed(2)),
        avgRelaxation: parseFloat(avgRelaxation.toFixed(2)),
        minAttention,
        maxAttention,
        avgSignalQuality: parseFloat(avgSignalQuality.toFixed(2)),
      },
      distribution,
      timeline,
      students: studentMetrics,
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
    const sessionMetrics = await supabaseQuery(
      `session_metrics?session_id=eq.${sessionId}&select=*,sessions(title,start_time,end_time,classes(name,school_year))`
    );

    if (sessionMetrics.length === 0) {
      return null; // No cached metrics
    }

    const metrics = sessionMetrics[0];

    // Get student metrics
    const studentMetrics = await supabaseQuery(
      `student_metrics?session_id=eq.${sessionId}&select=*,users(name)&order=avg_attention.desc`
    );

    // Get distribution from EEG data
    const eegData = await supabaseQuery(`eeg_data?session_id=eq.${sessionId}&select=attention`);

    const lowCount = eegData.filter(d => d.attention < 40).length;
    const mediumCount = eegData.filter(d => d.attention >= 40 && d.attention < 70).length;
    const highCount = eegData.filter(d => d.attention >= 70).length;

    // Get timeline from EEG data (10-second buckets for high granularity)
    const sessions = await supabaseQuery(`sessions?id=eq.${sessionId}&select=start_time`);
    const sessionStartTime = new Date(sessions[0]?.start_time).getTime();

    const allEegData = await supabaseQuery(
      `eeg_data?session_id=eq.${sessionId}&select=timestamp,attention,relaxation&order=timestamp.asc`
    );

    const buckets = {};
    allEegData.forEach(d => {
      const timestamp = new Date(d.timestamp).getTime();
      const secondsFromStart = Math.floor((timestamp - sessionStartTime) / 1000);
      // Using 10-second buckets for better granularity even in short sessions
      const bucketIndex = Math.floor(secondsFromStart / 10);

      if (!buckets[bucketIndex]) {
        buckets[bucketIndex] = {
          attentionValues: [],
          relaxationValues: [],
        };
      }

      buckets[bucketIndex].attentionValues.push(d.attention || 0);
      buckets[bucketIndex].relaxationValues.push(d.relaxation || 0);
    });

    const timeline = Object.keys(buckets).sort((a, b) => parseInt(a) - parseInt(b)).map(key => {
      const bucket = buckets[key];
      const avgAttention = bucket.attentionValues.reduce((sum, v) => sum + v, 0) / bucket.attentionValues.length;
      const avgRelaxation = bucket.relaxationValues.reduce((sum, v) => sum + v, 0) / bucket.relaxationValues.length;
      const minAttention = Math.min(...bucket.attentionValues);
      const maxAttention = Math.max(...bucket.attentionValues);

      return {
        timestamp: new Date(sessionStartTime + parseInt(key) * 10 * 1000).toISOString(),
        avgAttention: parseFloat(avgAttention.toFixed(2)),
        minAttention,
        maxAttention,
        avgRelaxation: parseFloat(avgRelaxation.toFixed(2)),
      };
    });

    return {
      session: {
        id: metrics.session_id,
        title: metrics.sessions?.title,
        className: metrics.sessions?.classes?.name,
        schoolYear: metrics.sessions?.classes?.school_year,
        startTime: metrics.sessions?.start_time,
        endTime: metrics.sessions?.end_time,
      },
      overall: {
        totalStudents: metrics.total_students,
        avgAttention: parseFloat(metrics.avg_attention),
        avgRelaxation: parseFloat(metrics.avg_relaxation),
        // minAttention: metrics.min_attention, // Temporarily removed due to Supabase schema cache issue
        // maxAttention: metrics.max_attention, // Temporarily removed due to Supabase schema cache issue
        // avgSignalQuality: parseFloat(metrics.avg_signal_quality), // Temporarily removed due to Supabase schema cache issue
      },
      distribution: {
        low: { count: lowCount },
        medium: { count: mediumCount },
        high: { count: highCount },
      },
      timeline,
      students: studentMetrics.map(s => ({
        studentId: s.student_id,
        studentName: s.users?.name || 'Unknown',
        avgAttention: parseFloat(s.avg_attention),
        avgRelaxation: parseFloat(s.avg_relaxation),
        minAttention: s.min_attention,
        maxAttention: s.max_attention,
        // avgSignalQuality removed - column doesn't exist in student_metrics
        // Signal quality is available at session level
        durationMinutes: parseFloat(s.duration_minutes),
      })),
      calculatedAt: metrics.calculated_at,
    };
  } catch (error) {
    console.error('❌ Error getting cached metrics:', error);
    throw error;
  }
}
