import mongoose from 'mongoose';
import { env } from './env';
import { seedDatabase } from '../seed';
import { User } from '../models/User';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // The in-memory fallback is wiped on every restart and auto-seeded with demo data,
    // so it must never be used on a deployed server — fail loudly instead of silently
    // losing users' data. Render sets RENDER=true on every service.
    const isDeployed = env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
    if (isDeployed) {
      console.error('❌ MongoDB connection failed on a deployed server (refusing in-memory fallback):', error);
      process.exit(1);
    }

    console.log('⚠️  MongoDB connection failed. Starting fallback in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ In-memory MongoDB connected: ${conn.connection.host}`);
      
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('🌱 In-memory database is empty. Auto-seeding demo data...');
        await seedDatabase();
      }
    } catch (fallbackError) {
      console.error('❌ In-memory MongoDB connection failed:', fallbackError);
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
