import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon.jsx';
import { RARITY_STYLE } from '../lib/presets.js';
import { formatDay } from '../lib/date.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unlocked', label: 'Unlocked' },
  { id: 'locked', label: 'Locked' },
];

export function AchievementBoard({ achievements, compact = false }) {
  const [filter, setFilter] = useState('all');
  const unlocked = achievements.filter((entry) => entry.unlocked);
  const visible = achievements.filter((entry) => (filter === 'all' ? true : filter === 'unlocked' ? entry.unlocked : !entry.unlocked));

  return (
    <section className="surface overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div>
          <p className="label">Milestones</p>
          <h2 className="text-[20px] leading-tight">Achievement cabinet</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`tap-target rounded-pill px-3 py-1 text-[12px] font-black ${
                filter === option.id ? 'bg-forest-700 text-white' : 'bg-forest-50 text-ink-soft hover:bg-forest-100'
              }`}
            >
              {option.label}
              {option.id === 'unlocked' ? ` ${unlocked.length}` : ''}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:grid-cols-3 sm:px-5 lg:grid-cols-4">
        <AnimatePresence initial={false}>
          {visible.map((entry, index) => {
            const style = RARITY_STYLE[entry.rarity] ?? RARITY_STYLE.common;
            const pct = Math.min(Math.round((entry.progress / entry.threshold) * 100), 100);
            return (
              <motion.article
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(index * 0.02, 0.2) }}
                className={`relative overflow-hidden rounded-2xl border p-3 ${entry.unlocked ? `bg-white shadow-card ${style.ring}` : 'border-line bg-forest-50/50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${style.tile} ${style.icon} ${entry.unlocked ? 'shadow-card' : 'opacity-45 saturate-50'}`}
                    style={entry.unlocked ? { boxShadow: `0 6px 18px -8px ${entry.rarity === 'mythic' ? '#14663f' : '#2f9e44'}99` } : undefined}
                  >
                    <Icon name={entry.icon} size={22} />
                  </span>
                  <span className={`rounded-pill border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${style.text} border-white bg-white/70`}>{entry.rarity}</span>
                </div>

                <p className="mt-2 truncate text-[14px] font-black leading-tight">{entry.title}</p>
                {!compact ? <p className="mt-0.5 line-clamp-2 text-[11px] font-bold text-ink-mute">{entry.habitName ? `${entry.description} · ${entry.habitName}` : entry.description}</p> : null}

                {entry.unlocked ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-forest-700">
                    <span>{entry.unlockedAt ? formatDay(entry.unlockedAt.slice(0, 10)) : 'unlocked'}</span>
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </p>
                ) : (
                  <div className="mt-2.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/70">
                      <div className="h-full rounded-pill bg-forest-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] font-black tabular-nums text-ink-mute">
                      {Math.min(entry.progress, entry.threshold)}/{entry.threshold}
                    </p>
                  </div>
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
