import { CheckIn } from '../models/CheckIn.js';
import { badRequest } from '../lib/http.js';
import { diffDays, todayKey } from '../lib/day.js';
import { isEligible, toSpec } from '../lib/streak.js';

export const MAX_BACKFILL_DAYS = 730;

export async function applyCheckIn(user, habit, input) {
  const spec = toSpec(habit);
  const today = todayKey(user.timezone || 'UTC');
  const dayKey = input.dayKey ?? today;

  if (diffDays(today, dayKey) > 0) throw badRequest('You cannot check in a future day');
  if (diffDays(dayKey, today) > MAX_BACKFILL_DAYS) throw badRequest('That day is too far back to log');
  if (spec.createdAtKey && diffDays(spec.createdAtKey, dayKey) < 0) {
    throw badRequest('This habit did not exist on that day');
  }

  const existing = await CheckIn.findOne({ habit: habit._id, dayKey });
  const bonus = !isEligible(spec, dayKey);

  let nextCount = existing?.count ?? 0;
  if (input.mode === 'toggle') {
    nextCount = nextCount >= spec.targetCount ? 0 : spec.targetCount;
  } else if (input.mode === 'count') {
    if (input.count === undefined) throw badRequest('count is required for this mode');
    nextCount = Math.min(Math.max(input.count, 0), Math.max(spec.targetCount * 20, 20));
  } else if (input.mode === 'delta') {
    if (input.delta === undefined) throw badRequest('delta is required for this mode');
    nextCount = Math.min(Math.max(nextCount + input.delta, 0), Math.max(spec.targetCount * 20, 20));
  } else {
    throw badRequest('Unknown check-in mode');
  }

  if (nextCount <= 0) {
    if (existing) await existing.deleteOne();
    return { done: false, count: 0, bonus, removed: Boolean(existing) };
  }

  const wasDone = Boolean(existing && existing.count >= spec.targetCount);
  const now = new Date();
  const doc =
    existing ??
    new CheckIn({
      user: user._id,
      habit: habit._id,
      dayKey,
      count: 0,
      completedAt: null,
    });

  doc.count = nextCount;
  if (input.note !== undefined) doc.note = input.note;
  const isDone = nextCount >= spec.targetCount;
  if (isDone && !wasDone) doc.completedAt = now;
  if (!isDone) doc.completedAt = null;

  await doc.save();
  return {
    done: isDone,
    justCompleted: isDone && !wasDone,
    count: doc.count,
    bonus,
    checkIn: doc.toPublic(),
  };
}
