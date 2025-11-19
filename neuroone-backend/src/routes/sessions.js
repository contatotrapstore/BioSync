import express from 'express';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import { validateBody } from '../middleware/validate.js';
import { sessionSchemas } from '../validation/schemas.js';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTY0NCwiZXhwIjoyMDc4OTQ3NjQ0fQ.imC7bY7nj0ruaiqJMnvTPScBjImelVK-HdMp8M5Dnxk';

// Helper to query Supabase REST API directly (avoids client library hanging)
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

/**
 * GET /api/sessions
 * List all sessions with teacher, class, participants count, and metrics
 */
router.get('/', async (req, res) => {
  try {
    logger.info('[SESSIONS API] GET /api/sessions - Listing all sessions');

    // Fetch all sessions
    const sessions = await supabaseQuery('sessions', {
      select: 'id,teacher_id,class_id,title,description,session_type,status,start_time,end_time,duration_minutes,created_at,updated_at',
      headers: {
        'Order': 'start_time.desc'
      }
    });

    // For each session, fetch additional data
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        try {
          // Fetch teacher name
          let teacher_name = 'N/A';
          try {
            const teacherData = await supabaseQuery(`users?id=eq.${session.teacher_id}`, {
              select: 'name'
            });
            teacher_name = teacherData[0]?.name || 'N/A';
          } catch (err) {
            logger.error(`[SESSIONS API] Error fetching teacher ${session.teacher_id}:`, err);
          }

          // Fetch class name
          let class_name = 'N/A';
          try {
            const classData = await supabaseQuery(`classes?id=eq.${session.class_id}`, {
              select: 'name'
            });
            class_name = classData[0]?.name || 'N/A';
          } catch (err) {
            logger.error(`[SESSIONS API] Error fetching class ${session.class_id}:`, err);
          }

          // Fetch participants count
          let participants_count = 0;
          try {
            const participants = await supabaseQuery(`session_participants?session_id=eq.${session.id}`, {
              select: 'student_id'
            });
            participants_count = participants.length;
          } catch (err) {
            logger.error(`[SESSIONS API] Error counting participants for session ${session.id}:`, err);
          }

          // Fetch metrics
          let avg_attention = 0;
          try {
            const metrics = await supabaseQuery(`session_metrics?session_id=eq.${session.id}`, {
              select: 'avg_attention'
            });
            avg_attention = metrics[0]?.avg_attention || 0;
          } catch (err) {
            // Metrics may not exist for all sessions
            logger.debug(`[SESSIONS API] No metrics for session ${session.id}`);
          }

          return {
            ...session,
            teacher_name,
            class_name,
            participants_count,
            avg_attention
          };
        } catch (err) {
          logger.error(`[SESSIONS API] Error enriching session ${session.id}:`, err);
          return {
            ...session,
            teacher_name: 'N/A',
            class_name: 'N/A',
            participants_count: 0,
            avg_attention: 0
          };
        }
      })
    );

    logger.success(`[SESSIONS API] Found ${sessionsWithDetails.length} sessions`);

    res.json({
      success: true,
      data: sessionsWithDetails,
      count: sessionsWithDetails.length
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error listing sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list sessions'
    });
  }
});

/**
 * GET /api/sessions/:id
 * Get a single session by ID with all details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[SESSIONS API] GET /api/sessions/${id} - Getting session`);

    const data = await supabaseQuery(`sessions?id=eq.${id}`, {
      select: 'id,teacher_id,class_id,title,description,session_type,status,start_time,end_time,duration_minutes,created_at,updated_at'
    });

    if (!data || data.length === 0) {
      logger.warn(`[SESSIONS API] Session ${id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const session = data[0];

    // Enrich with teacher, class, participants, metrics
    let teacher_name = 'N/A';
    try {
      const teacherData = await supabaseQuery(`users?id=eq.${session.teacher_id}`, {
        select: 'name'
      });
      teacher_name = teacherData[0]?.name || 'N/A';
    } catch (err) {
      logger.error(`[SESSIONS API] Error fetching teacher:`, err);
    }

    let class_name = 'N/A';
    try {
      const classData = await supabaseQuery(`classes?id=eq.${session.class_id}`, {
        select: 'name'
      });
      class_name = classData[0]?.name || 'N/A';
    } catch (err) {
      logger.error(`[SESSIONS API] Error fetching class:`, err);
    }

    let participants_count = 0;
    try {
      const participants = await supabaseQuery(`session_participants?session_id=eq.${session.id}`, {
        select: 'student_id'
      });
      participants_count = participants.length;
    } catch (err) {
      logger.error(`[SESSIONS API] Error counting participants:`, err);
    }

    let avg_attention = 0;
    try {
      const metrics = await supabaseQuery(`session_metrics?session_id=eq.${session.id}`, {
        select: 'avg_attention'
      });
      avg_attention = metrics[0]?.avg_attention || 0;
    } catch (err) {
      logger.debug(`[SESSIONS API] No metrics for session ${id}`);
    }

    logger.success(`[SESSIONS API] Found session ${id}`);

    res.json({
      success: true,
      data: {
        ...session,
        teacher_name,
        class_name,
        participants_count,
        avg_attention
      }
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error getting session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session'
    });
  }
});

/**
 * POST /api/sessions/create
 * Create a new session
 */
router.post('/create', validateBody(sessionSchemas.create), async (req, res) => {
  try {
    const {
      teacher_id,
      class_id,
      title,
      description,
      session_type,
      status,
      start_time,
      duration_minutes
    } = req.body;
    logger.info(`[SESSIONS API] POST /api/sessions/create - Creating session ${title}`);

    // Create the session
    const sessionData = await supabaseQuery('sessions', {
      method: 'POST',
      select: 'id,teacher_id,class_id,title,description,session_type,status,start_time,end_time,duration_minutes,created_at,updated_at',
      body: {
        teacher_id,
        class_id,
        title: title.trim(),
        description: description?.trim() || null,
        session_type: session_type || 'monitoramento',
        status: status || 'scheduled',
        start_time: start_time || new Date().toISOString(),
        duration_minutes: duration_minutes || 30
      }
    });

    const newSession = Array.isArray(sessionData) ? sessionData[0] : sessionData;

    logger.success(`[SESSIONS API] Session ${title} created with ID: ${newSession.id}`);

    res.status(201).json({
      success: true,
      data: newSession
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session'
    });
  }
});

/**
 * PUT /api/sessions/:id
 * Update an existing session
 */
router.put('/:id', validateBody(sessionSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`[SESSIONS API] PUT /api/sessions/${id} - Updating session`);

    // Joi already validated - use spread operator
    const updateBody = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const data = await supabaseQuery(`sessions?id=eq.${id}`, {
      method: 'PATCH',
      select: 'id,teacher_id,class_id,title,description,session_type,status,start_time,end_time,duration_minutes,created_at,updated_at',
      body: updateBody
    });

    if (!data || data.length === 0) {
      logger.warn(`[SESSIONS API] Session ${id} not found for update`);
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    logger.success(`[SESSIONS API] Updated session ${id}`);

    res.json({
      success: true,
      data: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error updating session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update session'
    });
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete a session (hard delete or cancel)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    logger.info(`[SESSIONS API] DELETE /api/sessions/${id} - ${hard ? 'Hard' : 'Cancel'} delete`);

    let data;

    if (hard === 'true') {
      // Hard delete - remove from database
      data = await supabaseQuery(`sessions?id=eq.${id}`, {
        method: 'DELETE',
        select: 'id,title'
      });
    } else {
      // Cancel session - set status = cancelled
      data = await supabaseQuery(`sessions?id=eq.${id}`, {
        method: 'PATCH',
        select: 'id,title,status,updated_at',
        body: {
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }
      });
    }

    if (!data || data.length === 0) {
      logger.warn(`[SESSIONS API] Session ${id} not found for delete`);
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    logger.success(`[SESSIONS API] Deleted session ${id}`);

    res.json({
      success: true,
      data: Array.isArray(data) ? data[0] : data,
      deleted: hard === 'true' ? 'hard' : 'cancelled'
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete session'
    });
  }
});

/**
 * GET /api/sessions/:id/participants
 * Get all participants (students) in a session
 */
router.get('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[SESSIONS API] GET /api/sessions/${id}/participants - Getting session participants`);

    // Get session_participants relations
    const enrollments = await supabaseQuery(`session_participants?session_id=eq.${id}`, {
      select: 'student_id'
    });

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Get full student details for each student_id
    const studentIds = enrollments.map(e => e.student_id);
    const studentsData = await Promise.all(
      studentIds.map(async (studentId) => {
        const students = await supabaseQuery(`users?id=eq.${studentId}`, {
          select: 'id,name,email,user_role,active'
        });
        return students[0];
      })
    );

    logger.success(`[SESSIONS API] Found ${studentsData.length} participants in session ${id}`);

    res.json({
      success: true,
      data: studentsData.filter(s => s !== undefined),
      count: studentsData.length
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error getting session participants:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session participants'
    });
  }
});

/**
 * POST /api/sessions/:id/participants
 * Update participants in a session (replaces all current participants)
 */
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_ids } = req.body;

    logger.info(`[SESSIONS API] POST /api/sessions/${id}/participants - Updating session participants`);

    if (!Array.isArray(student_ids)) {
      return res.status(400).json({
        success: false,
        error: 'student_ids must be an array'
      });
    }

    // Step 1: Remove all current participants
    await supabaseQuery(`session_participants?session_id=eq.${id}`, {
      method: 'DELETE'
    });

    logger.info(`[SESSIONS API] Removed all participants from session ${id}`);

    // Step 2: Add new participants
    if (student_ids.length > 0) {
      const enrollments = student_ids.map(student_id => ({
        session_id: id,
        student_id
      }));

      await supabaseQuery('session_participants', {
        method: 'POST',
        body: enrollments
      });

      logger.success(`[SESSIONS API] Added ${student_ids.length} participants to session ${id}`);
    }

    res.json({
      success: true,
      message: `Updated participants for session ${id}`,
      participant_count: student_ids.length
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error updating session participants:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update session participants'
    });
  }
});

/**
 * GET /api/sessions/teacher/:teacherId
 * Get all sessions for a specific teacher
 */
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    logger.info(`[SESSIONS API] GET /api/sessions/teacher/${teacherId} - Getting teacher sessions`);

    const sessions = await supabaseQuery(`sessions?teacher_id=eq.${teacherId}`, {
      select: 'id,teacher_id,class_id,title,description,session_type,status,start_time,end_time,duration_minutes,created_at,updated_at',
      headers: {
        'Order': 'start_time.desc'
      }
    });

    // Enrich with class names
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        let class_name = 'N/A';
        try {
          const classData = await supabaseQuery(`classes?id=eq.${session.class_id}`, {
            select: 'name'
          });
          class_name = classData[0]?.name || 'N/A';
        } catch (err) {
          logger.error(`[SESSIONS API] Error fetching class:`, err);
        }

        let participants_count = 0;
        try {
          const participants = await supabaseQuery(`session_participants?session_id=eq.${session.id}`, {
            select: 'student_id'
          });
          participants_count = participants.length;
        } catch (err) {
          logger.error(`[SESSIONS API] Error counting participants:`, err);
        }

        return {
          ...session,
          class_name,
          participants_count
        };
      })
    );

    logger.success(`[SESSIONS API] Found ${sessionsWithDetails.length} sessions for teacher ${teacherId}`);

    res.json({
      success: true,
      data: sessionsWithDetails,
      count: sessionsWithDetails.length
    });
  } catch (error) {
    logger.error('[SESSIONS API] Error getting teacher sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get teacher sessions'
    });
  }
});

export default router;
