import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  const targetUri = ENV.MONGO_URI || 'mongodb://127.0.0.1:27017/website_dien_tu';

  try {
    // Attempt standard connection first with 3s timeout
    console.log(`[Database] Attempting connection to: ${targetUri}`);
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Successfully connected to MongoDB at ${targetUri}`);
    return targetUri;
  } catch (err: any) {
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
      console.log(`[Database] Note: In-Memory data is ephemeral. You can also specify MONGO_URI in .env to use a persistent MongoDB instance.`);
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
  }
};
