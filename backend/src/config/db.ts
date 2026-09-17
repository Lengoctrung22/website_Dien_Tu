import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env';

let mongoMemoryServer: MongoMemoryServer | null = null;
let connectionListenersAttached = false;

export const connectDB = async (): Promise<string> => {
  const targetUri = process.env.MONGO_URI || ENV.MONGO_URI || 'mongodb://127.0.0.1:27017/website_dien_tu';
  const nodeEnv = process.env.NODE_ENV || '';
  const allowMemoryDB = process.env.ALLOW_MEMORY_DB === 'true';

  if (!connectionListenersAttached) {
    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Mongoose will attempt automatic reconnection...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB connection re-established.');
    });
    connectionListenersAttached = true;
  }

  try {
    // Attempt standard connection first with 3s timeout
    console.log(`[Database] Attempting connection to: ${targetUri}`);
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${targetUri}`);
    return targetUri;
  } catch (err: any) {
    // Fail-fast: In non-test environments (or production), do NOT silently fall back to in-memory DB
    // unless explicitly allowed via ALLOW_MEMORY_DB=true in non-production environments
    const isForbiddenMemoryEnv = nodeEnv === 'production' || (nodeEnv !== 'test' && !allowMemoryDB);
    if (isForbiddenMemoryEnv) {
      console.error(`[Database] FATAL: Failed to connect to MongoDB at ${targetUri}.`);
      console.error(`[Database] Server will NOT start with in-memory database to prevent data loss.`);
      console.error(`[Database] Please ensure MongoDB is running, or set ALLOW_MEMORY_DB=true to allow in-memory fallback (non-prod only).`);
      throw new Error(`MongoDB connection failed: ${err.message}. In-memory fallback is disabled for data safety.`);
    }

    console.warn(`[Database] Failed to connect to MongoDB server (${err.message}).`);
    console.log(`[Database] Starting In-Memory MongoDB server fallback (mongodb-memory-server)...`);

    try {
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'website_dien_tu',
        },
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB connected successfully at: ${memoryUri}`);
      console.log(`[Database] ⚠️  WARNING: In-Memory data is ephemeral and will be lost on restart!`);
      return memoryUri;
    } catch (fallbackError: any) {
      console.error(`[Database] Fatal: In-Memory MongoDB failed to start:`, fallbackError);
      throw fallbackError;
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
};
