import { assembleDashboard, computeAnalytics, loadUserData } from './stats.js';
import { syncAchievements } from './rewards.js';

export async function buildDashboard(user, options = {}) {
  const { habits, checkIns } = await loadUserData(user, options);
  const analytics = computeAnalytics(user, habits, checkIns, options);
  const { newlyUnlocked } = await syncAchievements(user, analytics);
  const dashboard = await assembleDashboard(user, analytics);
  dashboard.newlyUnlocked = newlyUnlocked;
  return dashboard;
}

export async function respondWithDashboard(res, user, options = {}, extra = {}) {
  const dashboard = await buildDashboard(user, options);
  res.json({ ok: true, ...extra, dashboard });
}

export function dashboardOptions(query) {
  const clamp = (value, fallback, min, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(Math.round(parsed), min), max);
  };
  return {
    heatmapDays: clamp(query.days, 366, 30, 1100),
    monthCount: clamp(query.months, 6, 1, 24),
    rangeDays: clamp(query.range, 120, 7, 800),
    includeArchived: query.archived === 'true',
  };
}
