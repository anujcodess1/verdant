import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';
import { connectDatabase } from './db.js';
import { runRolloverTick, startCron, stopCron } from './jobs/rollover.js';

async function main() {
  if (!config.jwtSecret) throw new Error('JWT_SECRET is not set');
  const connection = await connectDatabase();
  console.log(`api: mongodb connected to ${connection.name}`);

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`api: verdant listening on http://localhost:${config.port}`);
  });

  startCron();
  const bootTimer = setTimeout(() => {
    runRolloverTick()
      .then((summary) => {
        if (summary.touched) console.log(`api: boot rollover settled ${summary.touched} user(s)`);
      })
      .catch((error) => console.error('api: boot rollover failed:', error.message));
  }, 4000);

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    console.log(`api: ${signal} received, shutting down`);
    clearTimeout(bootTimer);
    stopCron();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => console.error('api: unhandled rejection:', reason));
}

main().catch((error) => {
  console.error('api: boot failed:', error.message);
  process.exitCode = 1;
});
