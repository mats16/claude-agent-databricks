import { buildApp } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

const app = await buildApp();

// Start server
try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} signal received: closing HTTP server`);
  await app.close();
  console.log('HTTP server closed');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
