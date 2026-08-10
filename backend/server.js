import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import privacyRoutes from './routes/privacyRoutes.js';

import { socketAuthMiddleware } from './middleware/authMiddleware.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { initializeDatabase } from './config/db.js';
import { initializeStorageBucket } from './config/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security Headers (Helmet) configured to allow static media & WebRTC cross-origin policies
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Allowed Origins for Production (Vercel & DuckDNS) and Local Development
const allowedOrigins = [
  CORS_ORIGIN,
  'https://aisolver-sigma.vercel.app',
  'https://learnai1234.duckdns.org',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const checkOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    callback(null, true);
  } else {
    callback(new Error(`Blocked by CORS policy: ${origin}`));
  }
};

app.use(cors({
  origin: checkOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Apply Rate Limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve static uploads directory for legacy media URL backward compatibility
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/privacy', privacyRoutes);

// Base / Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Messenger Backend Service is running',
    architecture: process.env.DATABASE_URL ? 'Repository Pattern (Supabase PostgreSQL Active)' : 'Repository Pattern (In-Memory Active)',
    databaseConnected: Boolean(process.env.DATABASE_URL),
    storageProvider: 'Supabase Storage Bucket',
    version: '3.3.0'
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.' 
      : err.message
  });
});

// Create HTTP & Socket.IO Server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket Authentication Middleware
io.use(socketAuthMiddleware);

// Initialize Socket Event Handlers
setupSocketHandlers(io);

// Start Server after Database Initialization
const startServer = async () => {
  try {
    if (process.env.DATABASE_URL) {
      await initializeDatabase();
    }
    await initializeStorageBucket();

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Messenger Backend running on port ${PORT}`);
      console.log(`🐘 Database: ${process.env.DATABASE_URL ? 'Supabase PostgreSQL Connected' : 'In-Memory Store'}`);
      console.log(`📦 Storage: Supabase Storage Bucket ('messenger-uploads')`);
      console.log(`🔒 Security: Helmet, Authorization & Rate Limiting active`);
      console.log(`🌐 CORS Allowed Origins: ${allowedOrigins.join(', ')} + *.vercel.app`);
      console.log(`⚡ Socket.IO listening for real-time connections...`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('❌ Server startup aborted due to initialization failure:', err.message);
    process.exit(1);
  }
};

startServer();
