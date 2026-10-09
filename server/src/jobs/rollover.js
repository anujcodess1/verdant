import cron from 'node-cron';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { addDays, diffDays, nowParts } from '../lib/day.js';
import { computeAnalytics, loadUserData } from '../services/stats.js';
import { pushNotification, syncAchievements } from '../services/rewards.js';

const HISTORY_OPTIONS = { heatmapDays: 60, monthCount: 1, rangeDays: 60 };

async function analyticsAsOf(user, dayKey) {
  const { habits, checkIns } = await loadUserData(user);
  return computeAnalytics(user, habits, checkIns, { ...HISTORY_OPTIONS, today: dayKey });
}

export async function processUser(user) {
  const timeZone = user.timezone || 'UTC';
  const parts = nowParts(timeZone);
  const today = parts.dayKey;
  const yesterday = addDays(today, -1);
  const result = { settledDays: [], unlocked: [], reminders: 0 };

  if (!user.lastRolloverDay) {
    user.lastRolloverDay = today;
    await user.save();
    return result;
  }

  const pending = [];
  let cursor = addDays(user.lastRolloverDay, 1);
  for (let guard = 0; guard < 14 && diffDays(cursor, yesterday) >= 0; guard += 1) {
    pending.push(cursor);
    cursor = addDays(cursor, 1);
  }

  for (const day of pending) {
    const analytics = await analyticsAsOf(user, day);
    const { newlyUnlocked } = await syncAchievements(user, analytics);
    result.unlocked.push(...newlyUnlocked);
    result.settledDays.push(day);

    const perfect = analytics.heatmap.find((entry) => entry.dayKey === day);
    if (perfect?.perfect && perfect.eligible > 1) {
      await pushNotification(user, {
        kind: 'perfect_day',
        title: 'Full canopy day',
        body: `You completed all ${perfect.eligible} habits scheduled on ${day}`,
        dedupeKey: `${user._id}|perfect_day|${day}`,
      });
    }

    for (const row of analytics.habits) {
      const brokeOnDay = row.stats.currentStreak === 0 && row.stats.lastRun >= 3;
      const endedRecently = row.stats.lastCompletedDay && diffDays(row.stats.lastCompletedDay, day) === 1;
      if (brokeOnDay && endedRecently) {
        await pushNotification(user, {
          kind: 'streak_lost',
          title: `Streak ended on ${row.name}`,
          body: `Your ${row.stats.lastRun} day run finished on ${row.stats.lastCompletedDay}. Plant a new one today.`,
          habitId: row.id,
          habitName: row.name,
          streakLength: row.stats.lastRun,
          dedupeKey: `${user._id}|streak_lost|${row.id}|${row.stats.lastCompletedDay}`,
        });
      }
    }
  }

  const todayAnalytics = await analyticsAsOf(user, today);
  const { newlyUnlocked } = await syncAchievements(user, todayAnalytics);
  result.unlocked.push(...newlyUnlocked);

  if (parts.hour >= config.reminderHour) {
    for (const row of todayAnalytics.habits) {
      if (!row.today.eligible || row.today.done || row.stats.currentStreak < 2) continue;
      const created = await pushNotification(user, {
        kind: 'streak_saved',
        title: `Protect your ${row.stats.currentStreak} day streak`,
        body: `${row.name} resets at midnight. One tap keeps the run alive.`,
        habitId: row.id,
        habitName: row.name,
        streakLength: row.stats.currentStreak,
        dedupeKey: `${user._id}|streak_saved|${row.id}|${today}`,
      });
      if (created) result.reminders += 1;
    }
  }

  user.lastRolloverDay = today;
  await user.save();
  return result;
}

export async function runRolloverTick() {
  const users = await User.find({}).select('_id timezone lastRolloverDay').lean();
  let touched = 0;
  for (const doc of users) {
    const parts = nowParts(doc.timezone || 'UTC');
    if (doc.lastRolloverDay === parts.dayKey) continue;
    const user = await User.findById(doc._id);
    if (!user) continue;
    await processUser(user);
    touched += 1;
  }
  return { checked: users.length, touched };
}

let task = null;

export function startCron() {
  if (!config.cronEnabled || task) return null;
  if (!cron.validate(config.cronSchedule)) {
    console.error(`invalid cron schedule: ${config.cronSchedule}`);
    return null;
  }
  task = cron.schedule(config.cronSchedule, async () => {
    try {
      const summary = await runRolloverTick();
      if (summary.touched) console.log(`rollover tick settled ${summary.touched} user(s)`);
    } catch (error) {
      console.error('rollover tick failed:', error.message);
    }
  });
  return task;
}

export function stopCron() {
  task?.stop();
  task = null;
}
