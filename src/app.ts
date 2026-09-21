import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import cron from 'node-cron';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { AttendServices } from './app/module/attendance/attend.services';
import router from './app/routes/routes';
import { env } from './app/config/env';
import { adminSeed } from './app/utils/adminSeed';

const app = express();

app.use(cookieParser());

const allowedOrigins = [
  env.FRONTEND_LINK,
  'https://dm-academy.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.set('trust proxy', 1);
app.use(compression());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.send('Welcome to the EMS_School Server!');
});

app.use('/api/v1', router);

// Only schedule cron if not in serverless runtime
if (!process.env.VERCEL) {
  cron.schedule('0 8 * * *', () => {
    AttendServices.generateDailyAttendance();
  });
}

// Safely invoke adminSeed in background without blocking startup
adminSeed().catch((err) => {
  console.error('Error during adminSeed:', err);
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route Not Found',
  });
});

app.use(globalErrorHandler);
export default app;
