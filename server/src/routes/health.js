import { Router } from 'express';
import mongoose from 'mongoose';
import { config } from '../config.js';

const startedAt = Date.now();

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

function snapshot() {
  const readyState = mongoose.connection.readyState;
  const connected = readyState === 1;
  return {
    ok: connected,
    service: 'verdant-api',
    env: config.env,
    time: new Date().toISOString(),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    database: {
      state: READY_STATES[readyState] ?? 'unknown',
      name: connected ? mongoose.connection.name : null,
    },
    googleConfigured: Boolean(config.googleClientId),
    cronEnabled: config.cronEnabled,
  };
}

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  const body = snapshot();
  res.status(body.ok ? 200 : 503).json(body);
});
