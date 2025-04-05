import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vip_transaction_tracker',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Vite's default port
  handlingFeePercentage: 15,
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || '',
};

export default config; 