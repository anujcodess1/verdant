import { CheckIn } from '../models/CheckIn.js';
import { Habit } from '../models/Habit.js';
import { Notification } from '../models/Notification.js';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import { addDays, diffDays, offsetMinutesOf, startOfWeekKey, todayKey, weekdayOf } from '../lib/day.js';
import { analyzeStreak, isEligible, nextEligibleDay, toSpec } from '../lib/streak.js';

export async function loadUserData(user, { includeArchived = false } = {}) {
  const filter = includeArchived ? { user: user._id } : { user: user._id, archived: false };
  const [habits, checkIns] = await Promise.all([
    Habit.find(filter).sort({ order: 1, createdAt: 1 }).lean(),
    CheckIn.find({ user: user._id, count: { $gt: 0 } })
      .sort({ dayKey: 1 })
      .lean({ habits: false })
      .select('habit dayKey count note completedAt'),
  ]);
  return { habits, checkIns };
}

function localHour(instant, timeZone) {
  if (!instant) return 12;
  return new Date(new Date(instant).getTime() + offsetMinutesOf(new Date(instant), timeZone) * 60000).getUTCHours();
}

function monthKey(day) {
  return day.slice(0, 7);
}

export function computeAnalytics(user, habits, checkIns, options = {}) {
  const timeZone = user.timezone || 'UTC';
  const heatmapDays = options.heatmapDays ?? 366;
  const monthCount = options.monthCount ?? 6;
  const rangeDays = options.rangeDays ?? 120;
  const today = options.today ?? todayKey(timeZone);

  const rows = habits.map((habit) => ({
    id: String(habit._id),
    habit,
    spec: { ...toSpec(habit), id: String(habit._id) },
    logs: [],
    completed: new Set(),
  }));
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const log of checkIns) {
    const row = byId.get(String(log.habit));
    if (!row) continue;
    if (log.count >= row.spec.targetCount) row.completed.add(log.dayKey);
    row.logs.push(log);
  }

  const weekStart = startOfWeekKey(today, user.startOfWeek ?? 1);
  const weekSpan = diffDays(weekStart, today);

  const habitRows = rows.map((row) => {
    const stats = analyzeStreak(row.spec, row.completed, today);
    const done = row.completed.has(today);
    const eligibleToday = isEligible(row.spec, today);
    const history = row.logs
      .filter((log) => diffDays(addDays(today, -rangeDays), log.dayKey) >= 0)
      .map((log) => ({ dayKey: log.dayKey, count: log.count, note: log.note || '', completedAt: log.completedAt }));
    let weekDone = 0;
    let weekScheduled = 0;
    for (let offset = 0; offset <= weekSpan; offset += 1) {
      const key = addDays(weekStart, offset);
      if (!isEligible(row.spec, key)) continue;
      weekScheduled += 1;
      if (row.completed.has(key)) weekDone += 1;
    }
    return {
      ...row.habit,
      _id: row.id,
      id: row.id,
      stats: { ...stats, todayDone: done, eligibleToday },
      today: {
        eligible: eligibleToday,
        done,
        count: row.logs.find((log) => log.dayKey === today)?.count ?? 0,
        target: row.spec.targetCount,
      },
      nextDueDay: eligibleToday && !done ? today : nextEligibleDay(row.spec, addDays(today, 1)),
      weekStart,
      weekEnd: addDays(weekStart, 6),
      weekDone,
      weekTarget: row.spec.daysOfWeek ? row.spec.daysOfWeek.length : 7,
      weekScheduled,
      history,
    };
  });

  const windowStart = addDays(today, -(heatmapDays - 1));
  const perDay = new Map();
  for (const row of rows) {
    if (row.habit.archived) continue;
    for (const key of row.completed) {
      if (diffDays(windowStart, key) < 0) continue;
      const bucket = perDay.get(key) || { done: new Set(), eligible: new Set() };
      bucket.done.add(row.id);
      perDay.set(key, bucket);
    }
  }
  for (const row of rows) {
    if (row.habit.archived) continue;
    for (let offset = 0; offset < heatmapDays; offset += 1) {
      const key = addDays(windowStart, offset);
      if (key > today) break;
      if (!isEligible(row.spec, key)) continue;
      const bucket = perDay.get(key) || { done: new Set(), eligible: new Set() };
      bucket.eligible.add(row.id);
      perDay.set(key, bucket);
    }
  }

  const rawHeatmap = [];
  let perfectDays = 0;
  let bestDay = { dayKey: null, done: 0 };
  let perfectRun = 0;
  let longestPerfectRun = 0;
  const totalDays = Math.max(diffDays(windowStart, today) + 1, 1);
  for (let offset = 0; offset < totalDays; offset += 1) {
    const key = addDays(windowStart, offset);
    const bucket = perDay.get(key);
    const done = bucket?.done.size ?? 0;
    const eligible = bucket?.eligible.size ?? 0;
    const perfect = eligible > 0 && done === eligible;
    if (perfect) {
      perfectDays += 1;
      perfectRun += 1;
      longestPerfectRun = Math.max(longestPerfectRun, perfectRun);
    } else if (eligible > 0) {
      perfectRun = 0;
    }
    if (done > bestDay.done) bestDay = { dayKey: key, done };
    rawHeatmap.push({ dayKey: key, done, eligible, perfect });
  }
  const firstActive = rawHeatmap.findIndex((entry) => entry.eligible > 0 || entry.done > 0);
  const heatmap = firstActive > 0 ? rawHeatmap.slice(firstActive) : rawHeatmap;

  const months = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const anchor = new Date(`${today.slice(0, 8)}01T00:00:00Z`);
    const shifted = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1));
    const key = shifted.toISOString().slice(0, 7);
    months.push({ key, label: key, done: 0, eligible: 0, habits: habitRows.map((row) => ({ id: row.id, done: 0 })) });
  }
  const monthIndex = new Map(months.map((month) => [month.key, month]));
  const habitIndex = new Map(habitRows.map((row, index) => [row.id, index]));
  for (const entry of heatmap) {
    const month = monthIndex.get(monthKey(entry.dayKey));
    if (!month) continue;
    month.done += entry.done;
    month.eligible += entry.eligible;
  }
  for (const row of rows) {
    if (row.habit.archived) continue;
    const index = habitIndex.get(row.id);
    if (index === undefined) continue;
    for (const key of row.completed) {
      const month = monthIndex.get(monthKey(key));
      if (month) month.habits[index].done += 1;
    }
  }
  for (const month of months) {
    month.label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(`${month.key}-01T00:00:00Z`));
  }

  const weekdayBuckets = Array.from({ length: 7 }, (_, weekday) => ({ weekday, done: 0, eligible: 0 }));
  for (const entry of heatmap) {
    weekdayBuckets[weekdayOf(entry.dayKey)].done += entry.done;
    weekdayBuckets[weekdayOf(entry.dayKey)].eligible += entry.eligible;
  }

  const weekly = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const end = addDays(today, -offset * 7);
    const start = addDays(end, -6);
    let done = 0;
    let eligible = 0;
    for (const entry of heatmap) {
      if (entry.dayKey >= start && entry.dayKey <= end) {
        done += entry.done;
        eligible += entry.eligible;
      }
    }
    weekly.push({ start, end, label: start.slice(5), done, eligible, rate: eligible ? Math.round((done / eligible) * 100) : 0 });
  }

  let earlyCheckins = 0;
  let totalCompleted = 0;
  for (const row of rows) {
    totalCompleted += row.completed.size;
    for (const log of row.logs) {
      if (localHour(log.completedAt, timeZone) < 8) earlyCheckins += 1;
    }
  }

  const totals = {
    totalCompleted,
    activeHabits: habitRows.length,
    perfectDays,
    perfectWeeks: Math.floor(longestPerfectRun / 7),
    longestPerfectRun,
    earlyCheckins,
    bestDay,
    momentum: habitRows.reduce((sum, row) => sum + row.stats.currentStreak, 0),
    longestOverall: habitRows.reduce((max, row) => Math.max(max, row.stats.longestStreak), 0),
    currentOverall: habitRows.reduce((max, row) => Math.max(max, row.stats.currentStreak), 0),
    avgCompletionRate: habitRows.length
      ? Math.round(habitRows.reduce((sum, row) => sum + row.stats.completionRate, 0) / habitRows.length)
      : 0,
    heatmapDone: heatmap.reduce((sum, entry) => sum + entry.done, 0),
    todayDone: habitRows.filter((row) => row.today.done).length,
    todayEligible: habitRows.filter((row) => row.today.eligible).length,
  };

  const unlockedMap = new Map((user.achievements || []).map((entry) => [`${entry.achievementId}::${entry.habitId ?? 'user'}`, entry]));
  const achievements = ACHIEVEMENTS.map((def) => {
    let unlockedAt = null;
    let habitName = '';
    let progress = 0;
    if (def.metric === 'streak') {
      let best = { value: 0, name: '' };
      for (const row of habitRows) {
        const value = Math.max(row.stats.longestStreak, row.stats.currentStreak);
        if (value > best.value) best = { value, name: row.name };
        const entry = unlockedMap.get(`${def.id}::${row.id}`);
        if (entry && !unlockedAt) {
          unlockedAt = entry.unlockedAt;
          habitName = row.name;
        }
      }
      progress = best.value;
      if (!habitName) habitName = best.name;
    } else {
      const entry = unlockedMap.get(`${def.id}::user`);
      if (entry) unlockedAt = entry.unlockedAt;
      progress =
        def.metric === 'checkins'
          ? totals.totalCompleted
          : def.metric === 'perfectDays'
            ? totals.perfectDays
            : def.metric === 'perfectWeeks'
              ? totals.perfectWeeks
              : def.metric === 'earlyCheckins'
                ? totals.earlyCheckins
                : totals.activeHabits;
    }
    return { ...def, unlocked: Boolean(unlockedAt), unlockedAt, habitName, progress, reached: progress >= def.threshold };
  });

  return {
    today,
    timezone: timeZone,
    habits: habitRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      daysOfWeek: row.daysOfWeek ?? null,
      targetCount: row.targetCount,
      order: row.order,
      archived: row.archived,
      createdAtKey: row.createdAtKey,
      stats: row.stats,
      today: row.today,
      nextDueDay: row.nextDueDay,
      weekDone: row.weekDone,
      weekTarget: row.weekTarget,
      weekScheduled: row.weekScheduled,
      weekStart: row.weekStart,
      weekEnd: row.weekEnd,
      history: row.history,
    })),
    heatmap,
    months,
    weekly,
    weekdays: weekdayBuckets,
    totals,
    achievements,
  };
}

export async function assembleDashboard(user, analytics) {
  const unread = await Notification.find({ user: user._id, read: false }).sort({ createdAt: -1 }).limit(12).lean();
  const unreadCount = await Notification.countDocuments({ user: user._id, read: false });
  return {
    ...analytics,
    notifications: unread.map((doc) => ({
      id: String(doc._id),
      kind: doc.kind,
      title: doc.title,
      body: doc.body,
      habitId: doc.habitId ? String(doc.habitId) : null,
      habitName: doc.habitName,
      achievementId: doc.achievementId,
      streakLength: doc.streakLength,
      read: doc.read,
      createdAt: doc.createdAt,
    })),
    unreadNotifications: unreadCount,
  };
}

export async function getDashboard(user, options = {}) {
  const { habits, checkIns } = await loadUserData(user, options);
  const analytics = computeAnalytics(user, habits, checkIns, options);
  return assembleDashboard(user, analytics);
}
