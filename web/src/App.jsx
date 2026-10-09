import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TopBar } from './components/TopBar.jsx';
import { Icon } from './components/Icon.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { HabitForm } from './components/HabitForm.jsx';
import { HabitDetail } from './components/HabitDetail.jsx';
import { NotificationCenter } from './components/NotificationCenter.jsx';
import { Celebration, ToastStack } from './components/ToastStack.jsx';
import { TodayPage } from './pages/TodayPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { TrophiesPage } from './pages/TrophiesPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { useApp } from './state/AppContext.jsx';
import { api } from './lib/api.js';
import { addDays, startOfWeekKey } from './lib/date.js';

function Splash({ label }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8">
      <div className="surface flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-800 text-white">
          <Icon name="pine" size={24} />
        </span>
        <div className="flex-1">
          <p className="font-display text-[18px] font-extrabold">Verdant</p>
          <p className="text-[12px] font-bold text-ink-mute">{label}</p>
        </div>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-400 border-t-transparent" />
      </div>
      <div className="mt-4 grid gap-4">
        <div className="skeleton h-[188px]" />
        <div className="skeleton h-[240px]" />
      </div>
    </div>
  );
}

export function App() {
  const {
    user,
    dashboard,
    sessionState,
    dataState,
    banner,
    toasts,
    celebration,
    pending,
    bootstrap,
    refresh,
    checkIn,
    createHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    markNotificationsRead,
    dismissToast,
    setCelebration,
  } = useApp();

  const [composeOpen, setComposeOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const location = useLocation();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (dataState === 'error' && sessionState === 'signedIn') {
      const timer = setInterval(() => refresh(), 20000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [dataState, refresh, sessionState]);

  const resolvedWeek = weekStart ?? (dashboard ? startOfWeekKey(dashboard.today, user.startOfWeek ?? 1) : null);

  const toggleToday = useCallback(
    (habit) => {
      const target = habit.targetCount ?? 1;
      if (target > 1 && !habit.today.done) {
        checkIn({ habit, dayKey: dashboard.today, mode: 'delta', delta: 1 });
        return;
      }
      checkIn({ habit, dayKey: dashboard.today, mode: 'toggle' });
    },
    [checkIn, dashboard],
  );

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();

      if (key === 'n') {
        event.preventDefault();
        setEditing(null);
        setComposeOpen(true);
      } else if (key === 'r') {
        event.preventDefault();
        refresh();
      } else if (key === 'escape') {
        setComposeOpen(false);
        setInboxOpen(false);
        setDetailId(null);
        setConfirmDelete(null);
      } else if (resolvedWeek && /^[1-9]$/.test(key) && dashboard) {
        const habit = dashboard.habits[Number(key) - 1];
        if (habit) {
          event.preventDefault();
          toggleToday(habit);
        }
      } else if (['arrowleft', 'arrowright'].includes(key) && location.pathname === '/' && dashboard) {
        event.preventDefault();
        const delta = key === 'arrowleft' ? -7 : 7;
        const next = addDays(resolvedWeek, delta);
        if (next <= startOfWeekKey(dashboard.today, user.startOfWeek ?? 1)) setWeekStart(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dashboard, location.pathname, refresh, resolvedWeek, toggleToday, user, weekStart]);

  if (sessionState === 'checking') return <Splash label="Reading your session…" />;

  if (sessionState === 'signedOut') {
    return (
      <>
        <LoginScreen />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (!dashboard) return <Splash label={banner ?? 'Growing your forest…'} />;

  const detail = dashboard.habits.find((habit) => habit.id === detailId) ?? null;

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-10">
      <TopBar
        user={user}
        unread={dashboard.unreadNotifications}
        onOpenNotifications={() => setInboxOpen(true)}
        onCompose={() => {
          setDetailId(null);
          setEditing(null);
          setComposeOpen(true);
        }}
      />

      {banner ? (
        <div className="mx-auto mt-3 max-w-[1180px] px-4">
          <p className="rounded-2xl border border-ember-300 bg-ember-200/40 px-4 py-2 text-[12px] font-black text-ember-600">{banner}</p>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <TodayPage
                    weekStart={resolvedWeek}
                    onWeekChange={setWeekStart}
                    onOpenDetail={(habit) => setDetailId(habit.id)}
                    onCheck={toggleToday}
                    onCompose={() => {
                      setEditing(null);
                      setComposeOpen(true);
                    }}
                  />
                }
              />
              <Route path="/analytics" element={<AnalyticsPage onOpenDetail={(habit) => setDetailId(habit.id)} />} />
              <Route path="/trophies" element={<TrophiesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <button
        type="button"
        onClick={() => {
          setDetailId(null);
          setEditing(null);
          setComposeOpen(true);
        }}
        aria-label="New habit"
        className="tap-target fixed bottom-[74px] right-4 z-30 grid h-14 w-14 place-items-center rounded-pill bg-forest-700 text-white shadow-lift sm:hidden"
      >
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </button>

      <HabitForm
        open={composeOpen || Boolean(editing)}
        habit={editing}
        busy={formBusy}
        onClose={() => {
          setComposeOpen(false);
          setEditing(null);
        }}
        onSubmit={async (draft) => {
          setFormBusy(true);
          try {
            return editing ? await updateHabit(editing.id, draft) : await createHabit(draft);
          } finally {
            setFormBusy(false);
          }
        }}
      />

      <HabitDetail
        open={Boolean(detail)}
        habit={detail}
        today={dashboard.today}
        startOfWeek={user.startOfWeek ?? 1}
        pending={pending.has(detail?.id)}
        onClose={() => setDetailId(null)}
        onToggle={(habit, dayKey) => checkIn({ habit, dayKey, mode: 'toggle' })}
        onEdit={(habit) => {
          setDetailId(null);
          setEditing(habit);
        }}
        onArchive={(habit) => updateHabit(habit.id, { archived: !habit.archived })}
        onDelete={(habit) => setConfirmDelete(habit)}
      />

      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-forest-950/50 px-6" onClick={() => setConfirmDelete(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="surface w-full max-w-sm p-5 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Icon name="axe" size={30} className="mx-auto text-red-500" />
            <h2 className="mt-2 font-display text-[20px] font-extrabold">Delete {confirmDelete.name}?</h2>
            <p className="mt-1 text-[13px] font-bold text-ink-soft">
              Its {confirmDelete.stats.totalCompleted} logged days and {confirmDelete.stats.longestStreak} day best run are erased. Archive instead to keep the history.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="tap-target rounded-pill border border-line px-4 py-2 text-[14px] font-black">
                Keep it
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteHabit(confirmDelete.id);
                  setConfirmDelete(null);
                  setDetailId(null);
                }}
                className="tap-target rounded-pill bg-red-600 px-4 py-2 text-[14px] font-black text-white"
              >
                Delete forever
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}

      <NotificationCenter
        open={inboxOpen}
        notifications={dashboard.notifications}
        today={dashboard.today}
        onClose={() => setInboxOpen(false)}
        onMarkRead={markNotificationsRead}
        onDelete={async (id) => {
          try {
            await api.deleteNotification(id);
            await refresh();
          } catch (error) {
            refresh();
          }
        }}
      />

      <Celebration entry={celebration} onDone={() => setCelebration(null)} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
