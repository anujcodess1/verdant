import { motion } from 'framer-motion';
import { Icon } from '../components/Icon.jsx';
import { TodayPulse } from '../components/TodayPulse.jsx';
import { Button } from '../components/ui/Button.jsx';
import { WeekMatrix } from '../components/WeekMatrix.jsx';
import { ContributionHeatmap } from '../components/ContributionHeatmap.jsx';
import { useApp } from '../state/AppContext.jsx';
import { formatDay } from '../lib/date.js';

export function TodayPage({ weekStart, onWeekChange, onOpenDetail, onCheck, onCompose }) {
  const { dashboard, user, pending, checkIn, reorderHabits, dataState } = useApp();
  const today = dashboard.today;

  return (
    <div className="space-y-4">
      <TodayPulse dashboard={dashboard} />

      <WeekMatrix
        habits={dashboard.habits}
        today={today}
        startOfWeek={user.startOfWeek ?? 1}
        weekStart={weekStart}
        onWeekChange={onWeekChange}
        onReorder={(ids) => reorderHabits(ids)}
        onToggle={(habit, dayKey) => checkIn({ habit, dayKey, mode: 'toggle' })}
        onCheck={onCheck}
        onOpen={onOpenDetail}
        pending={pending}
      />

      {dashboard.habits.length > 0 ? (
        <ContributionHeatmap heatmap={dashboard.heatmap} today={today} startOfWeek={user.startOfWeek ?? 1} months={null} />
      ) : null}

      {dataState === 'empty' ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface-quiet flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="max-w-[52ch]">
            <p className="font-display text-[20px] font-extrabold leading-tight">Plant your first habit</p>
            <p className="mt-1 text-[13px] font-bold text-ink-soft">
              Give it a name, pick the days it counts and tap once a day. Your streak, heatmap and milestones start building from today.
            </p>
          </div>
          <Button size="md" onClick={onCompose}>
            <Icon name="plus" size={16} strokeWidth={2.4} />
            Add habit
          </Button>
        </motion.div>
      ) : null}

      {dashboard.habits.length > 0 ? (
        <p className="px-1 text-[11px] font-bold text-ink-mute">
          Drag a row to reorder · tap a week square to log or undo that day · today is {formatDay(today)} in {dashboard.timezone}
        </p>
      ) : null}
    </div>
  );
}
