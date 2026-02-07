import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cinelog';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    console.warn('⚠️  Server running without database - auth and review features will not work');
    // Don't exit - allow server to run for testing frontend
  }
};

export default connectDB;
