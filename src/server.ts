import dotenv from 'dotenv';
dotenv.config();

import http, { Server } from 'http';
import app from './app';

let server: Server | null = null;

async function startServer() {
  try {
    const port = process.env.PORT || 5000;
    server = http.createServer(app);
    server.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

    handleProcessEvents();
  } catch (error) {
    console.error('❌ Error during server startup:', error);
    process.exit(1);
  }
}

/**
 * Gracefully shutdown the server and close database connections.
 * @param {string} signal - The termination signal received.
 */
async function gracefulShutdown(signal: string) {
  console.warn(`🔄 Received ${signal}, shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

/**
 * Handle system signals and unexpected errors.
 */
function handleProcessEvents() {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
  });
}

// Start local server if not on serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
