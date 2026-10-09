import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sheet } from './ui/Sheet.jsx';
import { Button } from './ui/Button.jsx';
import { Icon } from './Icon.jsx';
import { HABIT_COLORS, HABIT_ICONS, HABIT_ICON_LABELS, HABIT_PRESETS } from '../lib/presets.js';
import { WEEKDAY_SHORT } from '../lib/date.js';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const CADENCES = [
  { id: 'every', label: 'Every day', days: null },
  { id: 'weekdays', label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { id: 'weekends', label: 'Weekends', days: [0, 6] },
  { id: 'custom', label: 'Pick days', days: [] },
];

function draftFromHabit(habit) {
  return {
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    icon: habit?.icon ?? 'sprout',
    color: habit?.color ?? HABIT_COLORS[0],
    daysOfWeek: habit?.daysOfWeek ?? null,
    targetCount: habit?.targetCount ?? 1,
  };
}

export function HabitForm({ open, habit, onClose, onSubmit, busy }) {
  const [draft, setDraft] = useState(() => draftFromHabit(habit));
  const [cadence, setCadence] = useState(() => (habit?.daysOfWeek ? 'custom' : 'every'));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(draftFromHabit(habit));
    setCadence(habit?.daysOfWeek ? (habit.daysOfWeek.length === 5 && habit.daysOfWeek.join() === '1,2,3,4,5' ? 'weekdays' : habit.daysOfWeek.join() === '0,6' ? 'weekends' : 'custom') : 'every');
    setError('');
  }, [open, habit]);

  const daysForCadence = () => {
    if (cadence === 'every') return null;
    if (cadence === 'weekdays') return [1, 2, 3, 4, 5];
    if (cadence === 'weekends') return [0, 6];
    return draft.daysOfWeek?.length ? draft.daysOfWeek : [1, 3, 5];
  };

  const toggleDay = (day) => {
    const current = new Set(draft.daysOfWeek ?? []);
    if (current.has(day)) current.delete(day);
    else current.add(day);
    setDraft({ ...draft, daysOfWeek: [...current].sort((a, b) => a - b) });
  };

  const submit = async () => {
    if (draft.name.trim().length < 2) {
      setError('Give it a name of at least 2 characters');
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      icon: draft.icon,
      color: draft.color,
      daysOfWeek: cadence === 'custom' ? (draft.daysOfWeek?.length ? draft.daysOfWeek : null) : daysForCadence(),
      targetCount: draft.targetCount,
    };
    const result = await onSubmit(payload);
    if (result) onClose?.();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title={habit ? `Edit ${habit.name}` : 'Plant a new habit'}
      subtitle={habit ? 'Schedule, colour and target all update instantly.' : 'Small, specific and repeatable beats ambitious.'}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-bold text-ink-mute">{error || 'Streaks count scheduled days only.'}</span>
          <div className="flex gap-2">
            <Button variant="quiet" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} loading={busy}>
              {habit ? 'Save changes' : 'Plant habit'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {!habit ? (
          <div>
            <p className="label mb-2">Quick starts</p>
            <div className="scroll-snap-x flex gap-2 overflow-x-auto pb-1">
              {HABIT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setDraft({ ...draft, ...preset })}
                  className="chip tap-target shrink-0 whitespace-nowrap hover:border-forest-300 hover:bg-forest-50"
                >
                  <Icon name={preset.icon} size={15} className="text-forest-700" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="block">
          <span className="label">Habit name</span>
          <input
            className="field mt-1.5"
            value={draft.name}
            autoFocus={!habit}
            maxLength={60}
            placeholder="Meditate for 10 minutes"
            onChange={(event) => {
              setDraft({ ...draft, name: event.target.value });
              setError('');
            }}
          />
        </label>

        <label className="block">
          <span className="label">Why it matters</span>
          <textarea
            className="field mt-1.5 min-h-[64px] resize-y"
            value={draft.description}
            maxLength={120}
            placeholder="Calm before the day starts"
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>

        <div>
          <p className="label mb-2">Icon</p>
          <div className="grid grid-cols-10 gap-1.5">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setDraft({ ...draft, icon })}
                aria-label={HABIT_ICON_LABELS[icon] ?? icon}
                aria-pressed={draft.icon === icon}
                title={HABIT_ICON_LABELS[icon] ?? icon}
                className={`tap-target grid h-9 place-items-center rounded-xl ${
                  draft.icon === icon ? 'bg-forest-600 text-white shadow-ring' : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                }`}
              >
                <Icon name={icon} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-2">Colour</p>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDraft({ ...draft, color })}
                aria-label={`Use colour ${color}`}
                className={`h-8 w-8 rounded-full ${draft.color === color ? 'ring-4 ring-offset-2 ring-forest-400' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-2">Schedule</p>
          <div className="flex flex-wrap gap-2">
            {CADENCES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setCadence(option.id);
                  if (option.days) setDraft({ ...draft, daysOfWeek: option.days });
                  else setDraft({ ...draft, daysOfWeek: null });
                }}
                className={`tap-target rounded-pill border px-3.5 py-1.5 text-[13px] font-black ${
                  cadence === option.id ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white text-ink-soft hover:bg-forest-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {cadence === 'custom' ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex gap-1.5">
              {WEEKDAY_ORDER.map((day) => {
                const active = (draft.daysOfWeek ?? []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`tap-target h-10 flex-1 rounded-xl border text-[12px] font-black ${
                      active ? 'border-forest-600 bg-forest-600 text-white' : 'border-line bg-white text-ink-mute'
                    }`}
                  >
                    {WEEKDAY_SHORT[day].slice(0, 2)}
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </div>

        <div>
          <p className="label mb-2">Daily target</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, targetCount: Math.max(1, draft.targetCount - 1) })}
              className="tap-target grid h-10 w-10 place-items-center rounded-pill border border-line bg-white text-[18px] font-black"
            >
              −
            </button>
            <div className="min-w-[120px] text-center">
              <p className="font-display text-[24px] leading-none text-forest-800">{draft.targetCount}</p>
              <p className="text-[11px] font-black uppercase tracking-widest text-ink-mute">
                {draft.targetCount === 1 ? 'once a day' : 'times a day'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, targetCount: Math.min(50, draft.targetCount + 1) })}
              className="tap-target grid h-10 w-10 place-items-center rounded-pill border border-line bg-white text-[18px] font-black"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
