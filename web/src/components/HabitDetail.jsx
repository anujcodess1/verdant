import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';
import { Sheet } from './ui/Sheet.jsx';
import { Button } from './ui/Button.jsx';
import { Sparkline } from './Sparkline.jsx';
import { MilestoneTrack, StreakBadge } from './StreakBadge.jsx';
import { WEEKDAY_SHORT, addDays, buildMonthMatrix, diffDays, formatDay, relativeDay, weekdayOf } from '../lib/date.js';
import { cadenceLabel } from '../lib/presets.js';

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-white px-3 py-2.5">
      <p className="label">{label}</p>
      <p className="font-display text-[24px] leading-tight text-forest-800">{value}</p>
      {hint ? <p className="text-[11px] font-bold text-ink-mute">{hint}</p> : null}
    </div>
  );
}

export function HabitDetail({ habit, today, startOfWeek, pending, open, onClose, onToggle, onEdit, onArchive, onDelete }) {
  const [monthAnchor, setMonthAnchor] = useState(() => today.slice(0, 7));
  const logs = useMemo(() => new Map((habit?.history ?? []).map((log) => [log.dayKey, log])), [habit]);
  const [year, month] = monthAnchor.split('-').map(Number);
  const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));

  const cells = useMemo(() => buildMonthMatrix(monthAnchor, startOfWeek), [monthAnchor, startOfWeek]);
  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  const weekdayTally = useMemo(() => {
    const tally = Array.from({ length: 7 }, () => 0);
    for (const log of habit?.history ?? []) if (log.count >= (habit.targetCount ?? 1)) tally[weekdayOf(log.dayKey)] += 1;
    return tally;
  }, [habit]);
  const maxTally = Math.max(...weekdayTally, 1);

  const weeklySeries = useMemo(() => {
    if (!habit) return [];
    const series = [];
    for (let offset = 11; offset >= 0; offset -= 1) {
      const end = addDays(today, -offset * 7);
      const start = addDays(end, -6);
      const hits = (habit.history ?? []).filter((log) => log.count >= (habit.targetCount ?? 1) && log.dayKey >= start && log.dayKey <= end).length;
      series.push(hits);
    }
    return series;
  }, [habit, today]);

  const bestWeek = Math.max(...weeklySeries, 0);
  const earliest = habit?.createdAtKey ?? habit?.history?.[0]?.dayKey ?? today;
  const canGoBack = diffDays(monthAnchor, earliest.slice(0, 7)) > 0;

  if (!habit) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={habit.name}
      icon={habit.icon}
      subtitle={habit.description || cadenceLabel(habit.daysOfWeek)}
      side="right"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="danger" size="sm" onClick={() => onDelete(habit)}>
            Delete habit
          </Button>
          <div className="flex gap-2">
            <Button variant="quiet" size="sm" onClick={() => onEdit(habit)}>
              Edit
            </Button>
            <Button variant="quiet" size="sm" onClick={() => onArchive(habit)}>
              {habit.archived ? 'Restore' : 'Archive'}
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StreakBadge count={habit.stats.currentStreak} size="lg" />
          <span className="chip">best {habit.stats.longestStreak}d</span>
          <span className="chip">{habit.stats.totalCompleted} done</span>
          <span className="chip">{habit.stats.completionRate}% / 30d</span>
        </div>

        <MilestoneTrack current={habit.stats.currentStreak} next={habit.stats.nextMilestone} />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Current" value={habit.stats.currentStreak} hint={habit.today.done ? 'today logged' : 'today pending'} />
          <Stat label="Longest" value={habit.stats.longestStreak} hint={`last run ${habit.stats.lastRun}`} />
          <Stat label="This week" value={`${habit.weekDone}/${habit.weekTarget}`} hint={cadenceLabel(habit.daysOfWeek)} />
          <Stat label="Best week" value={bestWeek} hint="last 12 weeks" />
        </div>

        <div className="rounded-2xl border border-line/80 bg-forest-50/60 p-3">
          <div className="flex items-baseline justify-between">
            <p className="label">Weekly rhythm</p>
            <p className="text-[11px] font-black text-ink-mute">12 weeks</p>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <Sparkline values={weeklySeries} color={habit.color} width={200} height={44} />
            <div className="flex items-end gap-1">
              {weekdayTally.map((value, day) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className="flex h-11 w-3.5 items-end overflow-hidden rounded-full bg-white">
                    <motion.div
                      className="w-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(value / maxTally) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-ink-mute">{WEEKDAY_SHORT[day][0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label">{monthTitle}</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={() => setMonthAnchor(new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7))}
                aria-label="Previous month"
                className="tap-target grid h-8 w-8 place-items-center rounded-pill border border-line bg-white text-ink-soft disabled:opacity-40"
              >
                <Icon name="chevronLeft" size={15} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                disabled={monthAnchor >= today.slice(0, 7)}
                onClick={() => setMonthAnchor(new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7))}
                aria-label="Next month"
                className="tap-target grid h-8 w-8 place-items-center rounded-pill border border-line bg-white text-ink-soft disabled:opacity-40"
              >
                <Icon name="chevronRight" size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_SHORT.map((label) => (
              <span key={label} className="text-center text-[10px] font-black uppercase text-ink-mute">
                {label.slice(0, 2)}
              </span>
            ))}
            {rows.flat().map((dayKey, index) => {
              if (!dayKey) return <span key={`empty-${index}`} />;
              const log = logs.get(dayKey);
              const done = log && log.count >= habit.targetCount;
              const future = dayKey > today;
              const offSchedule = habit.daysOfWeek && !habit.daysOfWeek.includes(weekdayOf(dayKey));
              return (
                <button
                  key={dayKey}
                  type="button"
                  disabled={future}
                  onClick={() => onToggle(habit, dayKey)}
                  title={`${formatDay(dayKey)}${log ? ` · ${log.count}/${habit.targetCount}${log.note ? ` · ${log.note}` : ''}` : ''}`}
                  className={`tap-target relative grid aspect-square place-items-center rounded-xl border text-[12px] font-black tabular-nums ${
                    done
                      ? 'border-transparent text-white'
                      : future
                        ? 'cursor-not-allowed border-dashed border-line text-ink-mute/40'
                        : offSchedule
                          ? 'border-dashed border-line bg-white text-ink-mute'
                          : dayKey === today
                            ? 'border-forest-500 bg-white text-forest-800'
                            : 'border-line bg-white text-ink-mute'
                  }`}
                  style={done ? { backgroundColor: habit.color } : undefined}
                >
                  {Number(dayKey.slice(8, 10))}
                  {log && !done ? (
                    <span className="absolute bottom-1 text-[8px] leading-none">
                      {log.count}/{habit.targetCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] font-bold text-ink-mute">
            Tap any past day to log or undo. Off-schedule days count as bonus credits. Last change {habit.stats.lastCompletedDay ? relativeDay(habit.stats.lastCompletedDay, today) : 'never'}.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
