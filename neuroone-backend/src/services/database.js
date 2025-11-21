import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Supabase REST API configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('❌ SUPABASE_URL is not configured in .env file');
}
if (!supabaseServiceKey) {
  throw new Error('❌ SUPABASE_SERVICE_KEY is not configured in .env file');
}

// Helper to query Supabase REST API
async function supabaseQuery(table, options = {}) {
  let url = `${supabaseUrl}/rest/v1/${table}`;

  if (options.select) {
    const separator = table.includes('?') ? '&' : '?';
    url += `${separator}select=${options.select}`;
  }

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

  return await response.json();
}

// Create PostgreSQL connection pool (for EEG data only)
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
  try {
    const eegRecord = {
      session_id: data.sessionId,
      student_id: data.studentId,
      timestamp: data.timestamp || new Date().toISOString(),
      attention: data.attention,
      relaxation: data.relaxation,
      delta: data.delta || 0,
      theta: data.theta || 0,
      alpha: data.alpha || 0,
      beta: data.beta || 0,
      gamma: data.gamma || 0,
      signal_quality: data.signalQuality || 0,
      raw_data: data.rawData ? JSON.stringify(data.rawData) : null,
    };

    const result = await supabaseQuery('eeg_data', {
      method: 'POST',
      body: eegRecord
    });

    return result[0];
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
  try {
    const sessions = await supabaseQuery(`sessions?id=eq.${sessionId}`, {
      select: 'id,title,status,class_id,teacher_id,created_at,updated_at,start_time,end_time,duration_minutes,description,session_type,classes(name,school_year),users!sessions_teacher_id_fkey(name)'
    });

    if (!sessions || sessions.length === 0) {
      return null;
    }

    const session = sessions[0];
    return {
      ...session,
      class_name: session.classes?.name,
      school_year: session.classes?.school_year,
      teacher_name: session.users?.name
    };
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
  try {
    // First get the session to find the class_id
    const session = await getSession(sessionId);
    if (!session) {
      return [];
    }

    // Then get students from that class
    const classStudents = await supabaseQuery(`class_students?class_id=eq.${session.class_id}`, {
      select: 'student_id,users!class_students_student_id_fkey(id,name,email,user_role)'
    });

    return classStudents
      .filter(cs => cs.users && cs.users.user_role === 'aluno')
      .map(cs => ({
        id: cs.users.id,
        name: cs.users.name,
        email: cs.users.email
      }));
  } catch (error) {
    console.error('❌ Error fetching session students:', error);
    throw error;
  }
}

/**
 * Check if a student is enrolled in a session's class
 * @param {string} sessionId - Session UUID
 * @param {string} studentId - Student UUID
 * @returns {Promise<boolean>} - True if student is enrolled
 */
export async function isStudentEnrolled(sessionId, studentId) {
  try {
    const students = await getSessionStudents(sessionId);
    return students.some(s => s.id === studentId);
  } catch (error) {
    console.error('❌ Error checking student enrollment:', error);
    return false;
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
 * Generic query function for custom queries
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('❌ Database query error:', error);
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
