import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { closePool } from './services/database.js';
import {
  handleTeacherJoin,
  handleTeacherLeave,
  handleGetStudents,
} from './handlers/teacherHandlers.js';
import {
  handleStudentJoin,
  handleStudentLeave,
  handleEEGData,
} from './handlers/studentHandlers.js';
import logger from './utils/logger.js';
import metricsRouter from './routes/metrics.js';
import privacyRouter from './routes/privacy.js';
import usersRouter from './routes/users.js';
import classesRouter from './routes/classes.js';
import sessionsRouter from './routes/sessions.js';
import { socketAuthMiddleware } from './middleware/auth.js';
import { createRateLimitMiddleware, clearSocketLimits } from './middleware/rateLimit.js';

// Load environment variables
dotenv.config(); // Reloading after .env update

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/metrics', metricsRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/users', usersRouter);
app.use('/api/classes', classesRouter);
app.use('/api/sessions', sessionsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NeuroOne WebSocket Server',
    version: '1.0.0',
    description: 'Real-time EEG data streaming for neurofeedback sessions',
    endpoints: {
      health: '/health',
      websocket: 'ws://localhost:3001',
      metrics: '/api/metrics/sessions/:sessionId',
      calculate: 'POST /api/metrics/sessions/:sessionId/calculate',
      export: '/api/metrics/sessions/:sessionId/export',
    },
  });
});

// Create HTTP/HTTPS server
let httpServer;

// Check if SSL certificates are configured
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;

if (SSL_KEY_PATH && SSL_CERT_PATH) {
  try {
    const sslOptions = {
      key: readFileSync(SSL_KEY_PATH),
      cert: readFileSync(SSL_CERT_PATH),
    };
    httpServer = createHttpsServer(sslOptions, app);
    logger.info('🔒 HTTPS server configured with SSL certificates');
  } catch (error) {
    logger.error('❌ Failed to load SSL certificates, falling back to HTTP:', error.message);
    httpServer = createHttpServer(app);
  }
} else {
  httpServer = createHttpServer(app);
  logger.warn('⚠️  Running in HTTP mode. For production, configure SSL certificates.');
}

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 30000,
  pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 25000,
  transports: ['websocket', 'polling'],
});

// Apply authentication middleware
io.use(socketAuthMiddleware);

// Create rate limit middleware wrapper
const rateLimitMiddleware = createRateLimitMiddleware();

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`🔌 New connection: ${socket.id} - User: ${socket.user?.email} (${socket.user?.role})`);

  // Teacher events (with rate limiting)
  socket.on('teacher:join', rateLimitMiddleware('teacher:join', (socket, data) => handleTeacherJoin(io, socket, data)));
  socket.on('teacher:leave', rateLimitMiddleware('teacher:leave', (socket, data) => handleTeacherLeave(io, socket, data)));
  socket.on('teacher:get-students', rateLimitMiddleware('teacher:get-students', (socket, data) => handleGetStudents(socket, data)));

  // Student events (with rate limiting)
  socket.on('student:join', rateLimitMiddleware('student:join', (socket, data) => handleStudentJoin(io, socket, data)));
  socket.on('student:leave', rateLimitMiddleware('student:leave', (socket, data) => handleStudentLeave(io, socket, data)));
  socket.on('eeg:data', rateLimitMiddleware('eeg:data', (socket, data) => handleEEGData(io, socket, data)));

  // Disconnect handler
  socket.on('disconnect', (reason) => {
    logger.info(`🔌 Disconnected: ${socket.id} (${reason})`);

    // Clear rate limits
    clearSocketLimits(socket);

    // Auto-cleanup on disconnect
    if (socket.data.role === 'teacher' || socket.user?.role === 'professor') {
      handleTeacherLeave(io, socket, socket.data);
    } else if (socket.data.role === 'student' || socket.user?.role === 'aluno') {
      handleStudentLeave(io, socket, socket.data);
    }
  });

  // Error handler
  socket.on('error', (error) => {
    logger.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.success(`🚀 NeuroOne WebSocket Server running on port ${PORT}`);
  logger.info(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  logger.info(`🌐 HTTP endpoint: http://localhost:${PORT}`);
  logger.info(`✅ CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('⏹️  SIGTERM received, closing server...');
  httpServer.close(async () => {
    logger.info('🔒 HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('⏹️  SIGINT received, closing server...');
  httpServer.close(async () => {
    logger.info('🔒 HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

export default io;
