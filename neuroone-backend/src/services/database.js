import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

/**
 * Save EEG data to database
 * @param {Object} data - EEG data object
 * @returns {Promise<Object>} - Inserted row
 */
export async function saveEEGData(data) {
  const query = `
    INSERT INTO eeg_data (
      session_id,
      student_id,
      timestamp,
      attention,
      relaxation,
      delta,
      theta,
      alpha,
      beta,
      gamma,
      signal_quality,
      raw_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;
  `;

  const values = [
    data.sessionId,
    data.studentId,
    data.timestamp || new Date().toISOString(),
    data.attention,
    data.relaxation,
    data.delta || 0,
    data.theta || 0,
    data.alpha || 0,
    data.beta || 0,
    data.gamma || 0,
    data.signalQuality || 0,
    data.rawData ? JSON.stringify(data.rawData) : null,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error saving EEG data:', error);
    throw error;
  }
}

/**
 * Get session information
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Object>} - Session data
 */
export async function getSession(sessionId) {
  const query = `
    SELECT
      s.*,
      c.name as class_name,
      c.school_year,
      u.name as teacher_name
    FROM sessions s
    JOIN classes c ON s.class_id = c.id
    JOIN users u ON s.teacher_id = u.id
    WHERE s.id = $1;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    throw error;
  }
}

/**
 * Get students in a session
 * @param {string} sessionId - Session UUID
 * @returns {Promise<Array>} - Array of students
 */
export async function getSessionStudents(sessionId) {
  const query = `
    SELECT
      u.id,
      u.name,
      u.email
    FROM sessions s
    JOIN classes c ON s.class_id = c.id
    JOIN class_students cs ON cs.class_id = c.id
    JOIN users u ON u.id = cs.student_id
    WHERE s.id = $1 AND u.role = 'aluno';
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching session students:', error);
    throw error;
  }
}

/**
 * Update session status
 * @param {string} sessionId - Session UUID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated session
 */
export async function updateSessionStatus(sessionId, status) {
  const query = `
    UPDATE sessions
    SET
      status = $2,
      end_time = CASE WHEN $2 = 'completed' THEN NOW() ELSE end_time END
    WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [sessionId, status]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error updating session status:', error);
    throw error;
  }
}

/**
 * Close database pool
 */
export async function closePool() {
  await pool.end();
  console.log('🔒 Database pool closed');
}

export default pool;
