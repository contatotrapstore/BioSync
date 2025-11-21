/**
 * Room State Management
 * Tracks which students and teachers are connected to each session
 */

// Map structure: sessionId -> { teachers: Set, students: Map }
const sessionRooms = new Map();

/**
 * Add a student to a session room
 * @param {string} sessionId
 * @param {string} studentId
 * @param {string} socketId
 * @param {string} studentName
 */
export function addStudentToRoom(sessionId, studentId, socketId, studentName) {
  if (!sessionRooms.has(sessionId)) {
    sessionRooms.set(sessionId, {
      teachers: new Set(),
      students: new Map(),
    });
  }

  const room = sessionRooms.get(sessionId);
  room.students.set(studentId, {
    socketId,
    studentName,
    connectedAt: new Date().toISOString(),
    lastEEG: null,
    lastUpdate: new Date().toISOString(),
  });

  console.log(`📊 [RoomState] Student ${studentName} (${studentId}) added to session ${sessionId}`);
}

/**
 * Add a teacher to a session room
 * @param {string} sessionId
 * @param {string} socketId
 */
export function addTeacherToRoom(sessionId, socketId) {
  if (!sessionRooms.has(sessionId)) {
    sessionRooms.set(sessionId, {
      teachers: new Set(),
      students: new Map(),
    });
  }

  const room = sessionRooms.get(sessionId);
  room.teachers.add(socketId);

  console.log(`👨‍🏫 [RoomState] Teacher ${socketId} added to session ${sessionId}`);
}

/**
 * Get all connected students in a session
 * @param {string} sessionId
 * @returns {Array} Array of {studentId, socketId, studentName, connectedAt, lastEEG}
 */
export function getConnectedStudents(sessionId) {
  const room = sessionRooms.get(sessionId);
  if (!room || room.students.size === 0) {
    return [];
  }

  return Array.from(room.students.entries()).map(([studentId, data]) => ({
    studentId,
    ...data,
  }));
}

/**
 * Get connected student IDs as a Set
 * @param {string} sessionId
 * @returns {Set} Set of student IDs
 */
export function getConnectedStudentIds(sessionId) {
  const room = sessionRooms.get(sessionId);
  if (!room) {
    return new Set();
  }
  return new Set(room.students.keys());
}

/**
 * Check if a student is connected to a session
 * @param {string} sessionId
 * @param {string} studentId
 * @returns {boolean}
 */
export function isStudentConnected(sessionId, studentId) {
  const room = sessionRooms.get(sessionId);
  return room ? room.students.has(studentId) : false;
}

/**
 * Remove a student from a session room
 * @param {string} sessionId
 * @param {string} studentId
 */
export function removeStudentFromRoom(sessionId, studentId) {
  const room = sessionRooms.get(sessionId);
  if (room) {
    const removed = room.students.delete(studentId);
    if (removed) {
      console.log(`📊 [RoomState] Student ${studentId} removed from session ${sessionId}`);
    }

    // Clean up empty rooms
    if (room.students.size === 0 && room.teachers.size === 0) {
      sessionRooms.delete(sessionId);
      console.log(`🗑️  [RoomState] Session ${sessionId} room cleaned up (empty)`);
    }
  }
}

/**
 * Remove a teacher from a session room
 * @param {string} sessionId
 * @param {string} socketId
 */
export function removeTeacherFromRoom(sessionId, socketId) {
  const room = sessionRooms.get(sessionId);
  if (room) {
    const removed = room.teachers.delete(socketId);
    if (removed) {
      console.log(`👨‍🏫 [RoomState] Teacher ${socketId} removed from session ${sessionId}`);
    }

    // Clean up empty rooms
    if (room.students.size === 0 && room.teachers.size === 0) {
      sessionRooms.delete(sessionId);
      console.log(`🗑️  [RoomState] Session ${sessionId} room cleaned up (empty)`);
    }
  }
}

/**
 * Update student's EEG data
 * @param {string} sessionId
 * @param {string} studentId
 * @param {Object} eegData
 */
export function updateStudentEEG(sessionId, studentId, eegData) {
  const room = sessionRooms.get(sessionId);
  if (room && room.students.has(studentId)) {
    const student = room.students.get(studentId);
    student.lastEEG = eegData;
    student.lastUpdate = new Date().toISOString();
  }
}

/**
 * Get all session rooms (for debugging)
 * @returns {Map}
 */
export function getAllRooms() {
  return sessionRooms;
}

/**
 * Get room statistics
 * @param {string} sessionId
 * @returns {Object} {studentsCount, teachersCount, exists}
 */
export function getRoomStats(sessionId) {
  const room = sessionRooms.get(sessionId);
  if (!room) {
    return { exists: false, studentsCount: 0, teachersCount: 0 };
  }

  return {
    exists: true,
    studentsCount: room.students.size,
    teachersCount: room.teachers.size,
  };
}
