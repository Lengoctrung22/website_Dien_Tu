import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { User } from './models/User';
import { seedDatabase } from './scripts/seed';
import { UPLOAD_DIR } from './config/upload';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
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

// Server startup
const startServer = async () => {
  try {
    await connectDB();

    // Check if database needs automatic initial seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] No users detected. Running initial data seeding automatically...');
      await seedDatabase();
    }

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
