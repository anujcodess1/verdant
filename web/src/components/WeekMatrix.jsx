import { Reorder, motion } from 'framer-motion';
import { HabitRow } from './HabitRow.jsx';
import { Icon } from './Icon.jsx';
import { WEEKDAY_SHORT, addDays, formatDay, startOfWeekKey, weekdayOf } from '../lib/date.js';

export function WeekMatrix({ habits, today, startOfWeek, weekStart, onWeekChange, onReorder, onToggle, onCheck, onOpen, pending }) {
  const weekKeys = Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset));
  const thisWeekStart = startOfWeekKey(today, startOfWeek);
  const canGoForward = weekStart < thisWeekStart;
  const habitIds = habits.map((habit) => habit.id);

  return (
    <section className="surface overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
        <div>
          <p className="label">This week</p>
          <h2 className="text-[19px] leading-tight">
            {formatDay(weekStart, { weekday: undefined })} → {formatDay(addDays(weekStart, 6), { weekday: undefined })}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onWeekChange(addDays(weekStart, -7))}
            className="tap-target grid h-9 w-9 place-items-center rounded-pill border border-line bg-white text-ink-soft hover:bg-forest-50"
            aria-label="Previous week"
          >
            <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => onWeekChange(thisWeekStart)}
            disabled={weekStart === thisWeekStart}
            className="tap-target rounded-pill border border-line bg-white px-3 py-1.5 text-[12px] font-black text-ink-soft hover:bg-forest-50 disabled:opacity-40"
          >
            today
          </button>
          <button
            type="button"
            onClick={() => canGoForward && onWeekChange(addDays(weekStart, 7))}
            disabled={!canGoForward}
            className="tap-target grid h-9 w-9 place-items-center rounded-pill border border-line bg-white text-ink-soft hover:bg-forest-50 disabled:opacity-40"
            aria-label="Next week"
          >
            <Icon name="chevronRight" size={16} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
        <p className="label">Habit</p>
        <div className="flex gap-1.5">
          {weekKeys.map((key) => (
            <span
              key={key}
              className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-black sm:h-8 sm:w-8 ${
                key === today ? 'bg-forest-600 text-white' : 'text-ink-soft'
              }`}
            >
              {WEEKDAY_SHORT[weekdayOf(key)].slice(0, 2)}
            </span>
          ))}
        </div>
      </div>

      <Reorder.Group axis="y" values={habitIds} onReorder={onReorder} className="divide-y divide-line/70 pb-1" as="ul">
        {habits.map((habit, index) => (
          <Reorder.Item
            key={habit.id}
            value={habit.id}
            as="li"
            className="relative list-none"
            whileDrag={{ zIndex: 30, scale: 1.01, boxShadow: '0 18px 40px -20px rgba(9,45,30,0.45)', cursor: 'grabbing' }}
            layout="position"
          >
            <HabitRow
              habit={habit}
              weekStart={weekStart}
              today={today}
              index={index}
              pending={pending.has(habit.id)}
              onToggle={(dayKey) => onToggle(habit, dayKey)}
              onCheck={() => onCheck(habit)}
              onToday={() => onOpen(habit)}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {habits.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-fit text-forest-400">
            <Icon name="sprout" size={34} />
          </motion.p>
          <p className="mt-2 text-[17px] font-black">Nothing planted yet</p>
          <p className="mt-1 text-[13px] font-bold text-ink-mute">Add your first habit and the grid comes alive.</p>
        </div>
      ) : null}
    </section>
  );
}
