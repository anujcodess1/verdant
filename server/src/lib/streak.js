import { addDays, diffDays, weekdayOf } from './day.js';

export function toSpec(habit) {
  return {
    id: String(habit._id),
    daysOfWeek: habit.daysOfWeek && habit.daysOfWeek.length ? [...habit.daysOfWeek].sort((a, b) => a - b) : null,
    targetCount: habit.targetCount || 1,
    createdAtKey: habit.createdAtKey || null,
    name: habit.name,
  };
}

export function isEligible(spec, dayKey) {
  if (spec.createdAtKey && diffDays(spec.createdAtKey, dayKey) < 0) return false;
  if (!spec.daysOfWeek) return true;
  return spec.daysOfWeek.includes(weekdayOf(dayKey));
}

export function eligibleDaysDescending(spec, fromKey, limit = 1500) {
  const keys = [];
  let cursor = fromKey;
  let guard = 0;
  const floor = spec.createdAtKey && diffDays(spec.createdAtKey, cursor) > 0 ? spec.createdAtKey : null;
  while (keys.length < limit && guard < 3000) {
    if (isEligible(spec, cursor)) keys.push(cursor);
    else if (floor && cursor <= floor) break;
    cursor = addDays(cursor, -1);
    guard += 1;
  }
  return keys;
}

export function eligibleDaysAscending(spec, fromKey, toKey) {
  const keys = [];
  let cursor = fromKey;
  let guard = 0;
  while (guard <= 1200 && diffDays(fromKey, cursor) <= diffDays(fromKey, toKey)) {
    if (isEligible(spec, cursor)) keys.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return keys;
}

export function nextEligibleDay(spec, fromKey) {
  let cursor = fromKey;
  for (let i = 0; i < 8; i += 1) {
    if (isEligible(spec, cursor) && (!spec.createdAtKey || diffDays(spec.createdAtKey, cursor) >= 0)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

const STREAK_TIERS = [3, 7, 14, 21, 30, 50, 66, 100, 150, 200, 300, 365, 500, 730];

export function nextStreakMilestone(current) {
  return STREAK_TIERS.find((tier) => tier > current) ?? null;
}

export function runEndingAt(spec, completedKeys, dayKey) {
  if (!dayKey || !completedKeys.has(dayKey)) return 0;
  let run = 0;
  let cursor = dayKey;
  for (let guard = 0; guard < 1500; guard += 1) {
    if (isEligible(spec, cursor)) {
      if (completedKeys.has(cursor)) run += 1;
      else break;
    }
    cursor = addDays(cursor, -1);
    if (spec.createdAtKey && diffDays(spec.createdAtKey, cursor) < 0) break;
  }
  return run;
}

export function analyzeStreak(spec, completedKeys, todayKey) {
  const totalCompleted = completedKeys.size;
  if (totalCompleted === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastRun: 0,
      totalCompleted,
      currentMilestone: 0,
      nextMilestone: STREAK_TIERS[0],
      lastCompletedDay: null,
      completionRate: 0,
    };
  }

  const descending = eligibleDaysDescending(spec, todayKey);
  let startIndex = 0;
  if (descending[0] === todayKey && !completedKeys.has(todayKey)) startIndex = 1;

  let currentStreak = 0;
  let lastCompletedDay = null;
  for (let i = startIndex; i < descending.length; i += 1) {
    if (completedKeys.has(descending[i])) {
      currentStreak += 1;
      if (!lastCompletedDay) lastCompletedDay = descending[i];
    } else {
      break;
    }
  }
  if (!lastCompletedDay) {
    lastCompletedDay = [...completedKeys].sort().at(-1);
  }

  const sorted = [...completedKeys].sort();
  const oldest = sorted[0];
  const newest = sorted.at(-1);
  let longestStreak = currentStreak;
  let run = 0;
  const span = Math.min(diffDays(oldest, newest), 2000);
  const fromKey = addDays(newest, -span);
  for (let offset = 0; offset <= span; offset += 1) {
    const key = addDays(fromKey, offset);
    if (!isEligible(spec, key)) continue;
    if (completedKeys.has(key)) {
      run += 1;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }

  const windowKeys = eligibleDaysDescending(spec, todayKey, 30);
  const windowDone = windowKeys.filter((key) => completedKeys.has(key)).length;
  const completionRate = windowKeys.length ? Math.round((windowDone / windowKeys.length) * 100) : 0;

  return {
    currentStreak,
    longestStreak,
    lastRun: runEndingAt(spec, completedKeys, newest),
    totalCompleted,
    currentMilestone: STREAK_TIERS.filter((tier) => tier <= currentStreak).at(-1) ?? 0,
    nextMilestone: nextStreakMilestone(currentStreak),
    lastCompletedDay,
    completionRate,
  };
}
