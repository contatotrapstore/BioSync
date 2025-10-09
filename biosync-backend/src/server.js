const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const validateEnv = require('./config/validateEnv');

validateEnv();

const { supabase } = require('./config/supabase');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // If no allowedOrigins configured, allow all
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }

    // Check if origin is in allowedOrigins
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Reject
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

// Serve static files (favicon, etc)
const publicDir = path.resolve(__dirname, '..', 'public');
const fs = require('fs');

// Only serve static files if public directory exists
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
} else {
  // Fallback: handle favicon.ico request to prevent errors
  app.get('/favicon.ico', (req, res) => res.status(204).end());
}

// Serve static files (games) - only in development
// In production (Vercel), games are bundled with the launcher installer
if (process.env.NODE_ENV === 'development') {
  const rawGamesDir = process.env.GAMES_DIR;
  const gamesDir = rawGamesDir
    ? (path.isAbsolute(rawGamesDir) ? rawGamesDir : path.resolve(process.cwd(), rawGamesDir))
    : path.resolve(process.cwd(), '..', 'Jogos');

  app.use('/games', express.static(gamesDir));
}

// Serve game downloads (ZIP files)
const downloadsDir = path.resolve(__dirname, '..', 'downloads');
if (fs.existsSync(downloadsDir)) {
  app.use('/downloads', express.static(downloadsDir, {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath) === '.zip') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      }
    }
  }));
  console.log(`📦 Serving game downloads from: ${downloadsDir}`);
} else {
  console.warn(`⚠️  Downloads directory not found: ${downloadsDir}`);
}

// API routes
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to BioSync API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      games: '/api/v1/games',
      users: '/api/v1/users',
      subscriptions: '/api/v1/subscriptions'
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.error('Failed to connect to Supabase:', error.message);
      console.error('Please check your SUPABASE_URL and SUPABASE_ANON_KEY in .env');
      process.exit(1);
    }

    console.log('Supabase connection established successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`\nBioSync API Server`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api/v1`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if not running in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully...');
    process.exit(0);
  });

  // Start the server
  startServer();
}

module.exports = app;


