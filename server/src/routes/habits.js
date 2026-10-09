import { Router } from 'express';
import { Habit } from '../models/Habit.js';
import { CheckIn } from '../models/CheckIn.js';
import { wrap } from '../lib/async-route.js';
import { notFound, badRequest, conflict } from '../lib/http.js';
import { parse, habitCreateSchema, habitUpdateSchema, reorderSchema, checkInSchema } from '../lib/validation.js';
import { requireAuth } from '../middleware/session.js';
import { applyCheckIn } from '../services/checkins.js';
import { buildDashboard, dashboardOptions, respondWithDashboard } from '../services/dashboard.js';
import { todayKey } from '../lib/day.js';

export const habitRouter = Router();
const MAX_ACTIVE_HABITS = 24;

async function loadHabit(user, id) {
  if (!/^[a-f0-9]{24}$/i.test(String(id))) throw notFound('Habit not found');
  const habit = await Habit.findOne({ _id: id, user: user._id });
  if (!habit) throw notFound('Habit not found');
  return habit;
}

habitRouter.use(requireAuth);

habitRouter.get(
  '/',
  wrap(async (req, res) => {
    const filter = req.query.archived === 'all' ? { user: req.user._id } : { user: req.user._id, archived: false };
    const habits = await Habit.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ ok: true, habits: habits.map((habit) => habit.toPublic()) });
  }),
);

habitRouter.get(
  '/:id',
  wrap(async (req, res) => {
    const habit = await loadHabit(req.user, req.params.id);
    const logs = await CheckIn.find({ habit: habit._id }).sort({ dayKey: -1 }).lean();
    const dashboard = await buildDashboard(req.user, { ...dashboardOptions(req.query), rangeDays: 400 });
    const row = dashboard.habits.find((entry) => entry.id === String(habit._id)) ?? null;
    res.json({
      ok: true,
      habit: habit.toPublic(),
      logs: logs.map((log) => ({ dayKey: log.dayKey, count: log.count, note: log.note || '' })),
      habitStats: row,
      dashboard,
    });
  }),
);

habitRouter.post(
  '/',
  wrap(async (req, res) => {
    const input = parse(habitCreateSchema, req.body);
    const activeCount = await Habit.countDocuments({ user: req.user._id, archived: false });
    if (activeCount >= MAX_ACTIVE_HABITS) throw conflict(`You can track up to ${MAX_ACTIVE_HABITS} habits at once`);
    const last = await Habit.findOne({ user: req.user._id }).sort({ order: -1 }).lean();
    const habit = await Habit.create({
      ...input,
      user: req.user._id,
      order: (last?.order ?? 0) + 1,
      createdAtKey: todayKey(req.user.timezone || 'UTC'),
    });
    await respondWithDashboard(res, req.user, dashboardOptions({}), { habit: habit.toPublic() });
  }),
);

habitRouter.post(
  '/reorder',
  wrap(async (req, res) => {
    const { ids } = parse(reorderSchema, req.body);
    const habits = await Habit.find({ user: req.user._id, _id: { $in: ids } });
    if (habits.length !== ids.length) throw badRequest('Some habits are missing');
    await Promise.all(ids.map((id, index) => Habit.updateOne({ _id: id, user: req.user._id }, { $set: { order: index + 1 } })));
    res.json({ ok: true });
  }),
);

habitRouter.patch(
  '/:id',
  wrap(async (req, res) => {
    const habit = await loadHabit(req.user, req.params.id);
    const input = parse(habitUpdateSchema, req.body);
    for (const [key, value] of Object.entries(input)) habit[key] = value;
    await habit.save();
    await respondWithDashboard(res, req.user, dashboardOptions({}), { habit: habit.toPublic() });
  }),
);

habitRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    const habit = await loadHabit(req.user, req.params.id);
    await CheckIn.deleteMany({ habit: habit._id });
    await habit.deleteOne();
    await respondWithDashboard(res, req.user, dashboardOptions({}), { removedId: String(habit._id) });
  }),
);

habitRouter.post(
  '/:id/check-in',
  wrap(async (req, res) => {
    const habit = await loadHabit(req.user, req.params.id);
    const input = parse(checkInSchema, req.body);
    const result = await applyCheckIn(req.user, habit, input);
    await respondWithDashboard(res, req.user, dashboardOptions({}), { checkIn: result });
  }),
);
