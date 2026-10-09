import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiRequestError } from '../lib/api.js';
import { localTimeZone } from '../lib/date.js';

const AppContext = createContext(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

function patchLocalCheckIn(dashboard, { habitId, dayKey, mode, count, delta }) {
  if (!dashboard) return dashboard;
  const target = dashboard.habits.find((habit) => habit.id === habitId);
  if (!target) return dashboard;

  const goal = target.targetCount ?? 1;
  const currentCount = dayKey === dashboard.today ? target.today.count : count >= goal ? goal : 0;
  let nextCount = currentCount;
  if (mode === 'toggle') nextCount = currentCount >= goal ? 0 : goal;
  else if (mode === 'delta') nextCount = Math.max(currentCount + delta, 0);
  else if (mode === 'count') nextCount = count;

  const done = nextCount >= goal;
  const wasDone = dayKey === dashboard.today ? target.today.done : false;

  const habits = dashboard.habits.map((habit) => {
    if (habit.id !== habitId) return habit;
    const stats = { ...habit.stats };
    if (done && !wasDone) {
      stats.currentStreak = stats.currentStreak + 1;
      stats.totalCompleted = stats.totalCompleted + 1;
      stats.lastCompletedDay = dayKey;
      if (stats.longestStreak < stats.currentStreak) stats.longestStreak = stats.currentStreak;
    } else if (!done && wasDone) {
      stats.currentStreak = Math.max(stats.currentStreak - 1, 0);
      stats.totalCompleted = Math.max(stats.totalCompleted - 1, 0);
    }
    const today = habit.today;
    return {
      ...habit,
      today: dayKey === dashboard.today ? { ...today, done, count: nextCount } : today,
      stats,
      history: habit.history.some((log) => log.dayKey === dayKey)
        ? habit.history.map((log) => (log.dayKey === dayKey ? { ...log, count: nextCount } : log))
        : [...habit.history, { dayKey, count: nextCount, note: '' }].sort((a, b) => (a.dayKey < b.dayKey ? -1 : 1)),
    };
  });

  const heatIndex = dashboard.heatmap.findIndex((cell) => cell.dayKey === dayKey);
  let heatmap = dashboard.heatmap;
  if (heatIndex >= 0) {
    heatmap = dashboard.heatmap.map((cell, index) =>
      index === heatIndex ? { ...cell, done: Math.max(cell.done + (done && !wasDone ? 1 : done ? 0 : -1), 0) } : cell,
    );
  }

  const todayDone = habits.reduce((sum, habit) => sum + (habit.today.done ? 1 : 0), 0);
  return {
    ...dashboard,
    habits,
    heatmap,
    totals: {
      ...dashboard.totals,
      todayDone,
      momentum: habits.reduce((sum, habit) => sum + habit.stats.currentStreak, 0),
    },
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [sessionState, setSessionState] = useState('checking');
  const [dataState, setDataState] = useState('idle');
  const [banner, setBanner] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [celebration, setCelebration] = useState(null);
  const [pending, setPending] = useState(() => new Set());
  const toastSeq = useRef(0);
  const celebrated = useRef(new Set());
  const rangeRef = useRef({ days: 366, months: 6, range: 130 });

  const pushToast = useCallback((toast) => {
    toastSeq.current += 1;
    const entry = { id: `${toastSeq.current}`, tone: 'info', duration: 4200, ...toast };
    setToasts((current) => [...current.slice(-3), entry]);
    if (entry.duration > 0) {
      setTimeout(() => setToasts((current) => current.filter((item) => item.id !== entry.id)), entry.duration);
    }
    return entry.id;
  }, []);

  const dismissToast = useCallback((id) => setToasts((current) => current.filter((item) => item.id !== id)), []);

  const reportFailure = useCallback(
    (error, fallback = 'Something went wrong. Try again.') => {
      const message = error instanceof ApiRequestError ? error.message : fallback;
      if (error instanceof ApiRequestError && error.status === 401) {
        setUser(null);
        setSessionState('signedOut');
      }
      pushToast({ tone: 'error', title: 'Not saved', message });
      return message;
    },
    [pushToast],
  );

  const applyDashboard = useCallback((next) => {
    setDashboard(next);
    setDataState(next && next.habits.length === 0 ? 'empty' : 'ready');
    const fresh = (next?.newlyUnlocked ?? []).filter((entry) => !celebrated.current.has(`${entry.achievementId}|${entry.habitId}|${entry.unlockedAt}`));
    for (const entry of fresh) celebrated.current.add(`${entry.achievementId}|${entry.habitId}|${entry.unlockedAt}`);
    if (fresh.length) {
      setCelebration((current) => current ?? fresh[0]);
      for (const extra of fresh.slice(1)) {
        pushToast({
          tone: 'achievement',
          title: `${extra.icon} ${extra.title}`,
          message: extra.habitName ? `${extra.title} · ${extra.habitName}` : extra.description,
          duration: 5200,
        });
      }
    }
  }, [pushToast]);

  const refresh = useCallback(
    async (query = {}) => {
      setDataState((state) => (state === 'ready' ? 'refreshing' : state));
      try {
        const payload = await api.dashboard({ ...rangeRef.current, ...query });
        applyDashboard(payload.dashboard);
        setBanner(null);
        return payload.dashboard;
      } catch (error) {
        const message = reportFailure(error, 'Could not reach the garden.');
        setBanner(message);
        setDataState('error');
        return null;
      }
    },
    [applyDashboard, reportFailure],
  );

  const bootstrap = useCallback(async () => {
    setSessionState('checking');
    try {
      const session = await api.me();
      if (!session.user) {
        setSessionState('signedOut');
        return;
      }
      setUser(session.user);
      setSessionState('signedIn');
      await refresh();
    } catch (error) {
      setSessionState('signedOut');
      setBanner(error instanceof ApiRequestError ? error.message : 'The service is offline right now.');
    }
  }, [refresh]);

  const signInWithGoogle = useCallback(
    async (credential) => {
      const payload = await api.googleLogin(credential, localTimeZone());
      setUser(payload.user);
      setSessionState('signedIn');
      await refresh();
      return payload.user;
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setDashboard(null);
    setSessionState('signedOut');
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      try {
        const payload = await api.updateProfile(patch);
        setUser(payload.user);
        await refresh();
        pushToast({ tone: 'success', title: 'Profile saved', message: 'Grids re-scored in your new timezone.' });
        return payload.user;
      } catch (error) {
        reportFailure(error, 'Profile was not saved.');
        return null;
      }
    },
    [pushToast, refresh, reportFailure],
  );

  const withPending = useCallback(async (habitId, work) => {
    setPending((current) => new Set(current).add(habitId));
    try {
      return await work();
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(habitId);
        return next;
      });
    }
  }, []);

  const checkIn = useCallback(
    async ({ habit, dayKey, mode = 'toggle', count, delta, note }) => {
      const targetDay = dayKey ?? dashboard?.today;
      if (!habit || !targetDay) return null;

      setDashboard((current) => patchLocalCheckIn(current, { habitId: habit.id, dayKey: targetDay, mode, count, delta }));

      try {
        const payload = await withPending(habit.id, () => api.checkIn(habit.id, { dayKey: targetDay, mode, count, delta, note }));
        applyDashboard(payload.dashboard);
        if (payload.checkIn?.bonus) {
          pushToast({ tone: 'info', title: 'Bonus credit logged', message: 'Off-schedule days never break a streak.' });
        }
        return payload.checkIn;
      } catch (error) {
        await refresh();
        reportFailure(error, 'That check-in did not stick.');
        return null;
      }
    },
    [applyDashboard, dashboard, pushToast, refresh, reportFailure, withPending],
  );

  const createHabit = useCallback(
    async (draft) => {
      try {
        const payload = await api.createHabit(draft);
        applyDashboard(payload.dashboard);
        pushToast({ tone: 'success', title: 'Habit planted', message: `${payload.habit.name} is live in today's grid.` });
        return payload.habit;
      } catch (error) {
        reportFailure(error, 'Could not plant that habit.');
        return null;
      }
    },
    [applyDashboard, pushToast, reportFailure],
  );

  const updateHabit = useCallback(
    async (id, patch) => {
      try {
        const payload = await api.updateHabit(id, patch);
        applyDashboard(payload.dashboard);
        return payload.habit;
      } catch (error) {
        reportFailure(error, 'Changes were not saved.');
        return null;
      }
    },
    [applyDashboard, reportFailure],
  );

  const deleteHabit = useCallback(
    async (id) => {
      try {
        const payload = await api.deleteHabit(id);
        applyDashboard(payload.dashboard);
        pushToast({ tone: 'info', title: 'Habit removed', message: 'Its history is gone too.' });
        return true;
      } catch (error) {
        reportFailure(error, 'Could not remove that habit.');
        return false;
      }
    },
    [applyDashboard, pushToast, reportFailure],
  );

  const reorderHabits = useCallback(
    async (ids) => {
      setDashboard((current) => {
        if (!current) return current;
        const byId = new Map(current.habits.map((habit) => [habit.id, habit]));
        return { ...current, habits: ids.map((id, index) => ({ ...byId.get(id), order: index +1 })).filter((habit) => habit.id) };
      });
      try {
        await api.reorderHabits(ids);
      } catch (error) {
        reportFailure(error, 'Order was not saved.');
        refresh();
      }
    },
    [refresh, reportFailure],
  );

  const markNotificationsRead = useCallback(
    async (ids) => {
      setDashboard((current) =>
        current
          ? {
              ...current,
              notifications: ids ? current.notifications.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)) : current.notifications.map((item) => ({ ...item, read: true })),
              unreadNotifications: 0,
            }
          : current,
      );
      try {
        await api.markNotificationsRead(ids);
      } catch (error) {
        reportFailure(error, 'Notifications stayed unread.');
      }
    },
    [reportFailure],
  );

  const syncNow = useCallback(async () => {
    setDataState('refreshing');
    try {
      const payload = await api.runRollover();
      if (payload.dashboard) applyDashboard(payload.dashboard);
      else await refresh();
      const settled = payload.summary?.settledDays?.length ?? 0;
      pushToast({
        tone: settled ? 'success' : 'info',
        title: settled ? 'Day boundary settled' : 'All caught up',
        message: settled ? `${settled} past day(s) scored.` : 'Your streaks are current.',
      });
      return payload;
    } catch (error) {
      reportFailure(error, 'Could not sync right now.');
      return null;
    }
  }, [applyDashboard, pushToast, refresh, reportFailure]);

  const value = useMemo(
    () => ({
      user,
      dashboard,
      sessionState,
      dataState,
      banner,
      toasts,
      celebration,
      pending,
      setCelebration,
      pushToast,
      dismissToast,
      bootstrap,
      refresh,
      signInWithGoogle,
      signOut,
      checkIn,
      createHabit,
      updateHabit,
      deleteHabit,
      reorderHabits,
      markNotificationsRead,
      syncNow,
      updateProfile,
      rangeRef,
    }),
    [
      banner,
      bootstrap,
      celebration,
      checkIn,
      createHabit,
      dashboard,
      dataState,
      deleteHabit,
      dismissToast,
      markNotificationsRead,
      pending,
      pushToast,
      refresh,
      reorderHabits,
      syncNow,
      sessionState,
      signInWithGoogle,
      signOut,
      updateHabit,
      updateProfile,
      user,
      toasts,
    ],
  );

  useEffect(() => {
    const onOnline = () => refresh();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
