import { memo } from 'react';
import { motion } from 'framer-motion';
import { StreakBadge } from './StreakBadge.jsx';
import { CheckButton } from './CheckButton.jsx';
import { Icon } from './Icon.jsx';
import { WEEKDAY_INITIALS, addDays, weekdayOf } from '../lib/date.js';
import { cadenceLabel } from '../lib/presets.js';

function cellState(habit, dayKey, today, historyByDay) {
  if (dayKey > today) return 'future';
  const log = historyByDay.get(dayKey);
  if (log && log.count >= habit.targetCount) return 'done';
  const scheduled = !habit.daysOfWeek || habit.daysOfWeek.includes(weekdayOf(dayKey));
  if (!scheduled) return 'off';
  if (dayKey === today) return 'pending';
  return log ? 'partial' : 'missed';
}

const CELL_STYLE = {
  future: 'border border-dashed border-line bg-white/40',
  off: 'border border-line/70 bg-forest-50/50',
  done: 'border border-transparent shadow-inner',
  pending: 'border-2 border-forest-400 bg-white',
  partial: 'border border-ember-300 bg-ember-200/40',
  missed: 'border border-line bg-white',
};

function MatrixCell({ habit, dayKey, today, state, pending, onPress, label }) {
  const filled = state === 'done';
  return (
    <motion.button
      type="button"
      onClick={onPress}
      disabled={state === 'future'}
      title={`${label} · ${state}`}
      aria-label={`${habit.name} on ${label}: ${state}`}
      className={`heat-cell tap-target relative grid h-7 w-7 place-items-center text-[11px] font-black tabular-nums sm:h-8 sm:w-8 ${CELL_STYLE[state]} ${
        state === 'future' ? 'cursor-not-allowed text-ink-mute/40' : 'text-forest-800'
      }`}
      animate={{
        backgroundColor: filled ? habit.color : state === 'partial' ? '#ffe3b0' : state === 'off' ? 'rgba(238,248,240,0.7)' : '#ffffff',
        scale: pending ? [1, 1.12, 1] : 1,
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
    >
      {filled ? <Icon name={habit.icon} size={15} className="text-white drop-shadow-sm" strokeWidth={2} /> : null}
      {state === 'partial' ? <span className="text-[10px]">{habit.today?.count ?? ''}</span> : null}
      {state === 'off' ? <span className="h-1 w-1 rounded-full bg-forest-300" /> : null}
      {state === 'pending' ? <span className="h-2 w-2 rounded-full bg-forest-400 motion-safe:animate-pulse" /> : null}
      {state === 'missed' ? <span className="h-1.5 w-1.5 rounded-full bg-line" /> : null}
    </motion.button>
  );
}

export const HabitRow = memo(function HabitRow({ habit, weekStart, today, onToggle, onCheck, onToday, pending, index }) {
  const historyByDay = new Map((habit.history ?? []).map((log) => [log.dayKey, log]));
  const weekKeys = Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset));
  const weekDone = weekKeys.filter((key) => (historyByDay.get(key)?.count ?? 0) >= habit.targetCount && key <= today).length;
  const scheduledToday = !habit.daysOfWeek || habit.daysOfWeek.includes(weekdayOf(today));

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: Math.min(index * 0.03, 0.24) }}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-forest-50/60"
    >
      <button type="button" onClick={onToday} className="tap-target flex min-w-0 flex-1 items-center gap-3 text-left">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
        style={{ backgroundColor: `${habit.color}1f`, boxShadow: `inset 0 0 0 1.5px ${habit.color}59`, color: habit.color }}
      >
        <Icon name={habit.icon} size={19} />
      </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-black leading-tight">{habit.name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-ink-mute">
            <span className="truncate">{cadenceLabel(habit.daysOfWeek)}</span>
            <span className="shrink-0 tabular-nums">
              {weekDone}/{habit.weekTarget}
            </span>
          </span>
        </span>
      </button>

      <div className="hidden shrink-0 sm:block">
        <StreakBadge count={habit.stats.currentStreak} size="sm" />
      </div>

      <div className="hide-scroll flex shrink-0 items-center gap-1.5 overflow-x-auto">
        {weekKeys.map((key) => (
          <MatrixCell
            key={key}
            habit={habit}
            dayKey={key}
            today={today}
            state={cellState(habit, key, today, historyByDay)}
            pending={pending}
            label={key === today ? 'today' : WEEKDAY_INITIALS[weekdayOf(key)]}
            onPress={() => onToggle(key)}
          />
        ))}
      </div>

      {scheduledToday ? (
        <CheckButton habit={habit} pending={pending} onPress={onCheck} size={42} />
      ) : (
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-pill border border-dashed border-line text-[11px] font-black text-ink-mute">
          off
        </span>
      )}
    </motion.div>
  );
});
