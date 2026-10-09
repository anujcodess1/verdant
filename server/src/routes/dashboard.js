import { Router } from 'express';
import { wrap } from '../lib/async-route.js';
import { requireAuth } from '../middleware/session.js';
import { buildDashboard, dashboardOptions } from '../services/dashboard.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const dashboard = await buildDashboard(req.user, dashboardOptions(req.query));
    res.json({ ok: true, dashboard });
  }),
);

dashboardRouter.get(
  '/heatmap',
  requireAuth,
  wrap(async (req, res) => {
    const options = dashboardOptions(req.query);
    const dashboard = await buildDashboard(req.user, { ...options, monthCount: 1, rangeDays: 7 });
    res.json({ ok: true, today: dashboard.today, timezone: dashboard.timezone, heatmap: dashboard.heatmap, totals: dashboard.totals });
  }),
);
