import mongoose from 'mongoose';
import '../src/config.js';
import { config } from '../src/config.js';

async function main() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(config.mongoUri, { dbName: config.mongoDb, serverSelectionTimeoutMS: 20000 });
  const collections = await mongoose.connection.db.listCollections().toArray();
  const stats = await mongoose.connection.db.admin().serverStatus().catch(() => null);
  console.log(`connected: ${config.mongoDb}`);
  console.log(`collections: ${collections.map((c) => c.name).join(', ') || '(none yet)'}`);
  if (stats) console.log(`version: ${stats.version}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('atlas check failed:', error.message);
  process.exitCode = 1;
});
