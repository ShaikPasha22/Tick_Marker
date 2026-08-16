import mongoose from 'mongoose';
import { env } from './env';
import { seedDatabase } from '../seed';
import { User } from '../models/User';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
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
