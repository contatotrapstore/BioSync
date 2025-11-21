import { getSession, saveEEGData, isStudentEnrolled } from '../services/database.js';
import {
  addStudentToRoom,
  removeStudentFromRoom,
  updateStudentEEG,
} from '../services/roomState.js';

/**
 * Handle student joining a session room
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { sessionId, studentId, studentName }
 */
export async function handleStudentJoin(io, socket, data) {
  try {
    const { sessionId, studentId, studentName } = data;

    if (!sessionId || !studentId) {
      socket.emit('error', { message: 'sessionId and studentId are required' });
      return;
    }

    // Verify session exists and is active
    const session = await getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.status !== 'active') {
      socket.emit('error', { message: 'Session is not active' });
      return;
    }

    // Verify student is enrolled in session's class
    const isEnrolled = await isStudentEnrolled(sessionId, studentId);
    if (!isEnrolled) {
      socket.emit('error', { message: 'You are not enrolled in this session' });
      console.log(`🚫 Student ${studentId} attempted to join session ${sessionId} without enrollment`);
      return;
    }

    // Join room
    const roomName = `session:${sessionId}`;
    await socket.join(roomName);

    // Store student info in socket data
    socket.data.role = 'student';
    socket.data.sessionId = sessionId;
    socket.data.studentId = studentId;
    socket.data.studentName = studentName;
    socket.data.roomName = roomName;

    console.log(`👨‍🎓 Student ${studentName} (${studentId}) joined session ${sessionId}`);

    // Add student to room state
    addStudentToRoom(sessionId, studentId, socket.id, studentName);

    // Send confirmation to student
    socket.emit('student:joined', {
      sessionId,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
      },
    });

    // Notify teachers in room
    io.to(roomName).emit('student:connected', {
      sessionId,
      studentId,
      studentName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in handleStudentJoin:', error);
    socket.emit('error', { message: 'Failed to join session' });
  }
}

/**
 * Handle student leaving a session room
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - { sessionId }
 */
export async function handleStudentLeave(io, socket, data) {
  try {
    const { sessionId, studentId, studentName } = data || socket.data;

    if (!sessionId) {
      return;
    }

    const roomName = `session:${sessionId}`;

    // Leave room
    await socket.leave(roomName);

    console.log(`👨‍🎓 Student ${studentName} (${studentId}) left session ${sessionId}`);

    // Remove student from room state
    removeStudentFromRoom(sessionId, studentId);

    // Notify teachers
    io.to(roomName).emit('student:disconnected', {
      sessionId,
      studentId,
      studentName,
      timestamp: new Date().toISOString(),
    });

    // Clear socket data
    socket.data.sessionId = null;
    socket.data.studentId = null;
    socket.data.roomName = null;
  } catch (error) {
    console.error('❌ Error in handleStudentLeave:', error);
  }
}

/**
 * Handle EEG data from student
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} data - EEG data packet
 */
export async function handleEEGData(io, socket, data) {
  try {
    const { sessionId, studentId, studentName } = socket.data;

    if (!sessionId || !studentId) {
      console.error('❌ [EEG] Socket sem sessionId ou studentId');
      socket.emit('error', { message: 'Not joined to any session' });
      return;
    }

    // Validate required fields
    if (data.attention === undefined || data.relaxation === undefined) {
      console.error('❌ [EEG] Dados inválidos recebidos:', data);
      socket.emit('error', { message: 'Invalid EEG data: attention and relaxation required' });
      return;
    }

    // 🔍 DIAGNOSTIC LOGGING - Ver payload completo
    console.log(`📊 [EEG] Payload completo recebido de ${studentName}:`, JSON.stringify(data, null, 2));

    // ⚠️ VALIDATION - Rejeitar dados claramente inválidos
    if (data.attention === 0 && data.relaxation === 0) {
      console.warn(`⚠️  [EEG] Dados inválidos rejeitados (attention=0, relaxation=0) de ${studentName}`);
      console.warn(`    O dispositivo MindWave pode não estar transmitindo dados eSense válidos.`);
      console.warn(`    Signal Quality: ${data.signalQuality}`);

      socket.emit('eeg:invalid-data', {
        message: 'Dispositivo MindWave não está transmitindo valores de atenção/meditação. Verifique a conexão.',
        signalQuality: data.signalQuality,
      });

      return; // Não salvar dados inválidos
    }

    // Prepare data for database
    const eegData = {
      sessionId,
      studentId,
      timestamp: data.timestamp || new Date().toISOString(),
      attention: data.attention,
      relaxation: data.relaxation,
      delta: data.delta || 0,
      theta: data.theta || 0,
      alpha: data.alpha || 0,
      beta: data.beta || 0,
      gamma: data.gamma || 0,
      signalQuality: data.signalQuality || 0,
      rawData: data.rawData || null,
    };

    console.log(`✅ [EEG] Dados válidos - Attention: ${eegData.attention}, Relaxation: ${eegData.relaxation}, Signal: ${eegData.signalQuality}`);

    // Update room state with latest EEG data
    updateStudentEEG(sessionId, studentId, eegData);

    // Save to database with confirmation (async, don't block streaming)
    saveEEGData(eegData)
      .then((savedRecord) => {
        // Success - data persisted
        console.log(`✅ EEG data saved for student ${studentId} at ${eegData.timestamp}`);
      })
      .catch((error) => {
        console.error(`❌ Failed to save EEG data for student ${studentId}:`, error);

        // Emit warning to student about data loss risk
        socket.emit('eeg:save-failed', {
          timestamp: eegData.timestamp,
          message: 'Warning: EEG data may not have been saved to database',
        });
      });

    // Broadcast to teachers in session room
    const roomName = `session:${sessionId}`;
    const broadcastData = {
      sessionId,
      studentId,
      studentName: socket.data.studentName,
      timestamp: eegData.timestamp,
      attention: eegData.attention,
      relaxation: eegData.relaxation,
      delta: eegData.delta,
      theta: eegData.theta,
      alpha: eegData.alpha,
      beta: eegData.beta,
      gamma: eegData.gamma,
      signalQuality: eegData.signalQuality,
    };

    io.to(roomName).emit('eeg:update', broadcastData);
    console.log(`📡 [EEG] Dados enviados para professores na sala ${roomName}`);

    // Send acknowledgment to student
    socket.emit('eeg:received', {
      timestamp: eegData.timestamp,
    });
  } catch (error) {
    console.error('❌ Error in handleEEGData:', error);
    socket.emit('error', { message: 'Failed to process EEG data' });
  }
}
