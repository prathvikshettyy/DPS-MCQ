require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const attemptRoutes = require('./routes/attempts');
const adminRoutes = require('./routes/admin');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // In production on Vercel, allow same origin and preview deployment URLs
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Global JWT authentication populating req.user
app.use(authenticate);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SMART Goals Assessment API',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
    timestamp: new Date(),
  });
});

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/admin', adminRoutes);

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
