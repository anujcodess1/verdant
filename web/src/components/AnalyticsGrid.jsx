import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';
import { Sparkline } from './Sparkline.jsx';
import { StreakBadge } from './StreakBadge.jsx';
import { WEEKDAY_SHORT, addDays, formatDay, relativeDay } from '../lib/date.js';
import { cadenceLabel } from '../lib/presets.js';

function weeklySeries(habit, today, weeks = 12) {
  const series = [];
  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const end = addDays(today, -offset * 7);
    const start = addDays(end, -6);
    series.push((habit.history ?? []).filter((log) => log.count >= habit.targetCount && log.dayKey >= start && log.dayKey <= end).length);
  }
  return series;
}

export function WeeklyTrend({ weekly }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...weekly.map((entry) => entry.rate), 100);

  return (
    <section className="surface p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="label">Momentum</p>
          <h2 className="text-[20px] leading-tight">Weekly completion</h2>
        </div>
        <p className="text-[12px] font-black text-ink-mute">{active ? `${formatDay(active.start, { weekday: undefined })} → ${formatDay(active.end, { weekday: undefined })} · ${active.rate}%` : 'last 12 weeks'}</p>
      </div>

      <div className="mt-4 flex h-[132px] items-end gap-1.5 sm:gap-2">
        {weekly.map((entry) => {
          const height = `${Math.max((entry.rate / max) * 100, 3)}%`;
          return (
            <button
              key={entry.start}
              type="button"
              onMouseEnter={() => setActive(entry)}
              onFocus={() => setActive(entry)}
              onClick={() => setActive(entry)}
              className="group relative flex h-full flex-1 flex-col justify-end"
              aria-label={`Week of ${entry.start}: ${entry.rate} percent`}
            >
              <motion.span
                className="w-full rounded-t-lg bg-gradient-to-t from-forest-700 to-forest-400 group-hover:from-forest-800 group-hover:to-forest-500"
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              />
              <span className="mt-1.5 text-[9px] font-black text-ink-mute">{entry.label.slice(0, 5)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function WeekdayStrip({ weekdays }) {
  const max = Math.max(...weekdays.map((entry) => entry.done), 1);
  return (
    <section className="surface p-4 sm:p-5">
      <p className="label">Rhythm</p>
      <h2 className="text-[20px] leading-tight">Strongest days</h2>
      <div className="mt-4 space-y-2">
        {weekdays.map((entry) => (
          <div key={entry.weekday} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-[12px] font-black text-ink-soft">{WEEKDAY_SHORT[entry.weekday]}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-pill bg-forest-50">
              <motion.div
                className="h-full rounded-pill bg-forest-500"
                initial={{ width: 0 }}
                animate={{ width: `${(entry.done / max) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22, delay: entry.weekday * 0.03 }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-[12px] font-black tabular-nums text-ink-mute">
              {entry.done}
              <span className="font-bold">/{entry.eligible}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HabitLeaderboard({ habits, today, onOpen }) {
  const ranked = [...habits].sort((a, b) => b.stats.currentStreak - a.stats.currentStreak || b.stats.totalCompleted - a.stats.totalCompleted);

  return (
    <section className="surface overflow-hidden">
      <header className="flex items-baseline justify-between px-4 py-3 sm:px-5">
        <div>
          <p className="label">Habits</p>
          <h2 className="text-[20px] leading-tight">Streak leaderboard</h2>
        </div>
        <p className="text-[12px] font-black text-ink-mute">{habits.length} tracked</p>
      </header>

      <div className="divide-y divide-line/70">
        {ranked.map((habit, index) => (
          <motion.button
            key={habit.id}
            type="button"
            layout="position"
            onClick={() => onOpen(habit)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.035, 0.3) }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-forest-50/70 sm:px-5"
          >
            <span className="w-5 shrink-0 text-center font-display text-[15px] font-extrabold text-ink-mute">{index + 1}</span>
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ color: habit.color, backgroundColor: `${habit.color}22`, boxShadow: `inset 0 0 0 1.5px ${habit.color}66` }}
            >
              <Icon name={habit.icon} size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-black leading-tight">{habit.name}</span>
              <span className="block truncate text-[11px] font-bold text-ink-mute">
                {cadenceLabel(habit.daysOfWeek)} · {habit.stats.totalCompleted} total · {relativeDay(habit.stats.lastCompletedDay, today)}
              </span>
            </span>
            <span className="hidden shrink-0 md:block">
              <Sparkline values={weeklySeries(habit, today)} color={habit.color} width={92} height={30} />
            </span>
            <span className="hidden w-14 shrink-0 text-right text-[13px] font-black tabular-nums text-forest-700 sm:block">{habit.stats.completionRate}%</span>
            <span className="shrink-0">
              <StreakBadge count={habit.stats.currentStreak} size="sm" />
            </span>
          </motion.button>
        ))}
        {ranked.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] font-bold text-ink-mute">No habits yet — plant one from the Today tab.</p>
        ) : null}
      </div>
    </section>
  );
}

export function InsightCards({ dashboard }) {
  const { totals, habits } = dashboard;
  const consistency = habits.length ? Math.max(...habits.map((habit) => habit.stats.completionRate)) : 0;
  const cards = [
    { icon: 'tree', title: 'Perfect days', value: totals.perfectDays, hint: totals.longestPerfectRun ? `best run ${totals.longestPerfectRun} in a row` : 'finish every habit in a day' },
    { icon: 'star', title: 'Best single day', value: totals.bestDay.done ? `${totals.bestDay.done} habits` : '—', hint: totals.bestDay.dayKey ? formatDay(totals.bestDay.dayKey) : 'no data yet' },
    { icon: 'sunrise', title: 'Early wins', value: totals.earlyCheckins, hint: 'logged before 8am' },
    { icon: 'sprout', title: 'Forest momentum', value: `${totals.momentum}d`, hint: 'sum of live streaks' },
    { icon: 'medal', title: 'Top consistency', value: `${consistency}%`, hint: habits.find((habit) => habit.stats.completionRate === consistency)?.name ?? 'no habits' },
    { icon: 'calendar', title: 'Days tracked', value: habits.length ? Math.max(...habits.map((habit) => habit.stats.totalCompleted)) : 0, hint: 'longest habit history' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, type: 'spring', stiffness: 220, damping: 26 }}
          className="surface flex items-start gap-3 p-3.5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700">
            <Icon name={card.icon} size={19} />
          </span>
          <div className="min-w-0">
            <p className="label">{card.title}</p>
            <p className="font-display text-[21px] font-extrabold leading-tight text-forest-900">{card.value}</p>
            <p className="truncate text-[11px] font-bold text-ink-mute">{card.hint}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
