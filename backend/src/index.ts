import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { UPLOAD_DIR } from './config/upload';
import { seedDatabase } from './scripts/seed';

const app = express();

const ALLOWED_ORIGIN_REGEX = /^https?:\/\/(([a-zA-Z0-9-]+\.)*localhost:3000|([a-zA-Z0-9-]+\.)*techgear\.(local|vn)(:[0-9]+)?)$/;

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || ALLOWED_ORIGIN_REGEX.test(origin) || (ENV.CLIENT_URL && origin === ENV.CLIENT_URL)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api/uploads', express.static(UPLOAD_DIR));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TechGear Backend API',
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

/**
 * NON-DESTRUCTIVE initialization: Ensures default admin/staff/customer accounts
 * and default products exist using upsert mode. NEVER calls deleteMany.
 * Safe to run on every server startup.
 */
const ensureInitialData = async () => {
  console.log('[Init] Ensuring initial data exists (upsert mode)...');
  await seedDatabase();
  console.log('[Init] Initial data check completed.');
};

// Server startup
const startServer = async () => {
  try {
    await connectDB();

    // Non-destructive: ensure default accounts and products exist without deleting anything
    await ensureInitialData();

    app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 TechGear Backend Server running on port ${ENV.PORT}`);
      console.log(`📡 Base API URL: http://localhost:${ENV.PORT}/api`);
      console.log(`🩺 Health Check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start TechGear backend server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
