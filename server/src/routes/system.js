import { Router } from 'express';
import { wrap } from '../lib/async-route.js';
import { requireAuth } from '../middleware/session.js';
import { buildDashboard, dashboardOptions } from '../services/dashboard.js';
import { processUser } from '../jobs/rollover.js';

export const systemRouter = Router();

systemRouter.post(
  '/rollover',
  requireAuth,
  wrap(async (req, res) => {
    const summary = await processUser(req.user);
    const dashboard = await buildDashboard(req.user, dashboardOptions({}));
    res.json({ ok: true, summary, dashboard });
  }),
);
