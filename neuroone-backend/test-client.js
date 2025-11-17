/**
 * Test Client for NeuroOne WebSocket Server
 * Simulates students sending EEG data
 */

import { io } from 'socket.io-client';
import { StudentSimulator } from './src/utils/eegSimulator.js';

const WS_URL = 'http://localhost:3001';

// Test configuration
const SESSION_ID = 'test-session-id'; // Replace with real session ID
const STUDENTS = [
  { id: 'student-1', name: 'Ana Silva' },
  { id: 'student-2', name: 'Bruno Santos' },
  { id: 'student-3', name: 'Carla Oliveira' },
];

const studentSockets = [];
const simulators = [];

console.log('🧪 Starting NeuroOne WebSocket Test Client\n');

// Create student connections
STUDENTS.forEach((student, index) => {
  const socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  const simulator = new StudentSimulator(student.id, student.name);
  simulators.push(simulator);

  socket.on('connect', () => {
    console.log(`✅ [${student.name}] Connected (${socket.id})`);

    // Join session
    socket.emit('student:join', {
      sessionId: SESSION_ID,
      studentId: student.id,
      studentName: student.name,
    });
  });

  socket.on('student:joined', (data) => {
    console.log(`🎓 [${student.name}] Joined session: ${data.session.title || SESSION_ID}`);

    // Start sending EEG data every 250ms (4Hz)
    const interval = setInterval(() => {
      const eegData = simulator.next();
      socket.emit('eeg:data', eegData);
    }, 250);

    // Store interval for cleanup
    socket.interval = interval;
  });

  socket.on('eeg:received', (data) => {
    // Confirmation received (optional logging)
  });

  socket.on('error', (error) => {
    console.error(`❌ [${student.name}] Error:`, error);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [${student.name}] Disconnected (${reason})`);
    if (socket.interval) {
      clearInterval(socket.interval);
    }
  });

  studentSockets.push(socket);

  // Stagger connections
  setTimeout(() => {}, index * 1000);
});

// Teacher connection (optional, for monitoring)
const teacherSocket = io(WS_URL, {
  transports: ['websocket', 'polling'],
});

teacherSocket.on('connect', () => {
  console.log(`\n👨‍🏫 [Teacher] Connected (${teacherSocket.id})`);

  teacherSocket.emit('teacher:join', {
    sessionId: SESSION_ID,
  });
});

teacherSocket.on('teacher:joined', (data) => {
  console.log(`👨‍🏫 [Teacher] Joined session: ${data.session.title || SESSION_ID}`);
});

teacherSocket.on('eeg:update', (data) => {
  console.log(
    `📊 [Teacher] EEG from ${data.studentName}: ` +
      `Attention=${data.attention}% Relaxation=${data.relaxation}% Quality=${data.signalQuality}%`
  );
});

teacherSocket.on('student:connected', (data) => {
  console.log(`🎓 [Teacher] Student connected: ${data.studentName}`);
});

teacherSocket.on('student:disconnected', (data) => {
  console.log(`🎓 [Teacher] Student disconnected: ${data.studentName}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Shutting down test client...');

  studentSockets.forEach((socket) => {
    if (socket.interval) {
      clearInterval(socket.interval);
    }
    socket.disconnect();
  });

  teacherSocket.disconnect();

  setTimeout(() => {
    console.log('✅ Test client stopped');
    process.exit(0);
  }, 500);
});

console.log('\n📡 Test client running. Press Ctrl+C to stop.\n');
