import { getSession, getSessionStudents } from '../services/database.js';
import {
  addTeacherToRoom,
  removeTeacherFromRoom,
  getConnectedStudents,
  getConnectedStudentIds,
} from '../services/roomState.js';

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

    // Verify teacher owns this session
    if (socket.user && session.teacher_id !== socket.user.id) {
      socket.emit('error', { message: 'You do not have permission to access this session' });
      console.log(`🚫 Teacher ${socket.user.id} attempted to join session ${sessionId} without ownership`);
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

    // Add teacher to room state
    addTeacherToRoom(sessionId, socket.id);

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

    // Get all students in session from database
    const allStudents = await getSessionStudents(sessionId);

    // Get currently connected students from room state
    const connectedStudentIds = getConnectedStudentIds(sessionId);

    // Merge database list with connection state
    socket.emit('teacher:students', {
      sessionId,
      students: allStudents.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        connected: connectedStudentIds.has(s.id),
      })),
    });

    // Send latest EEG data for connected students
    const connectedStudents = getConnectedStudents(sessionId);
    connectedStudents.forEach((student) => {
      if (student.lastEEG) {
        socket.emit('eeg:update', {
          sessionId,
          studentId: student.studentId,
          studentName: student.studentName,
          ...student.lastEEG,
        });
      }
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

    // Remove teacher from room state
    removeTeacherFromRoom(sessionId, socket.id);

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

    // Get all students from database
    const allStudents = await getSessionStudents(sessionId);

    // Get currently connected students from room state
    const connectedStudentIds = getConnectedStudentIds(sessionId);

    socket.emit('teacher:students', {
      sessionId,
      students: allStudents.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        connected: connectedStudentIds.has(s.id),
      })),
    });
  } catch (error) {
    console.error('❌ Error in handleGetStudents:', error);
    socket.emit('error', { message: 'Failed to fetch students' });
  }
}
