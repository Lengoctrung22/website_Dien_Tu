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
app.set('trust proxy', 1);

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
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Serve uploaded static files with strict security headers
const staticOptions = {
  setHeaders: (res: express.Response) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
  },
};
app.use('/uploads', express.static(UPLOAD_DIR, staticOptions));
app.use('/api/uploads', express.static(UPLOAD_DIR, staticOptions));

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
 * and default products exist using upsert mode in non-production environments.
 * NEVER calls deleteMany.
 */
const ensureInitialData = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Init] Production environment detected. Skipping automatic default seed.');
    return;
  }
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
