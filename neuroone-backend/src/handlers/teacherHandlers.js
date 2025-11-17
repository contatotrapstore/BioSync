import { getSession, getSessionStudents } from '../services/database.js';

/**
 * Handle teacher joining a session room
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { sessionId }
 */
export async function handleTeacherJoin(io, socket, data) {
  try {
    const { sessionId } = data;

    if (!sessionId) {
      socket.emit('error', { message: 'sessionId is required' });
      return;
    }

    // Verify session exists
    const session = await getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Join room
    const roomName = `session:${sessionId}`;
    await socket.join(roomName);

    // Store session info in socket data
    socket.data.role = 'teacher';
    socket.data.sessionId = sessionId;
    socket.data.roomName = roomName;

    console.log(`👨‍🏫 Teacher ${socket.id} joined session ${sessionId}`);

    // Send confirmation
    socket.emit('teacher:joined', {
      sessionId,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        className: session.class_name,
        schoolYear: session.school_year,
      },
    });

    // Get all students in session
    const students = await getSessionStudents(sessionId);

    // Send initial student list
    socket.emit('teacher:students', {
      sessionId,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        connected: false,
      })),
    });

    // Notify room that teacher joined
    io.to(roomName).emit('teacher:connected', {
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in handleTeacherJoin:', error);
    socket.emit('error', { message: 'Failed to join session' });
  }
}

/**
 * Handle teacher leaving a session room
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { sessionId }
 */
export async function handleTeacherLeave(io, socket, data) {
  try {
    const { sessionId } = data || socket.data;

    if (!sessionId) {
      return;
    }

    const roomName = `session:${sessionId}`;

    // Leave room
    await socket.leave(roomName);

    console.log(`👨‍🏫 Teacher ${socket.id} left session ${sessionId}`);

    // Notify room
    io.to(roomName).emit('teacher:disconnected', {
      timestamp: new Date().toISOString(),
    });

    // Clear socket data
    socket.data.sessionId = null;
    socket.data.roomName = null;
  } catch (error) {
    console.error('❌ Error in handleTeacherLeave:', error);
  }
}

/**
 * Handle teacher requesting student list
 * @param {Object} socket - Socket instance
 * @param {Object} data - { sessionId }
 */
export async function handleGetStudents(socket, data) {
  try {
    const { sessionId } = data;

    const students = await getSessionStudents(sessionId);

    socket.emit('teacher:students', {
      sessionId,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      })),
    });
  } catch (error) {
    console.error('❌ Error in handleGetStudents:', error);
    socket.emit('error', { message: 'Failed to fetch students' });
  }
}
