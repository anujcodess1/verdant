import { motion } from 'framer-motion';
import { Icon } from '../components/Icon.jsx';
import { AchievementBoard } from '../components/AchievementBoard.jsx';
import { useApp } from '../state/AppContext.jsx';
import { RARITY_STYLE } from '../lib/presets.js';
import { formatDay } from '../lib/date.js';

export function TrophiesPage() {
  const { dashboard, user } = useApp();
  const unlocked = dashboard.achievements.filter((entry) => entry.unlocked);
  const nextUp = dashboard.achievements
    .filter((entry) => !entry.unlocked)
    .sort((a, b) => b.progress / b.threshold - a.progress / a.threshold)
    .slice(0, 3);
  const timeline = [...(user.unlockedAchievements ?? [])].sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)).slice(0, 8);

  return (
    <div className="space-y-4">
      <section className="surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Progress</p>
            <h1 className="font-display text-[30px] font-extrabold leading-tight">
              {unlocked.length} of {dashboard.achievements.length} unlocked
            </h1>
            <p className="mt-1 text-[13px] font-bold text-ink-soft">
              {Math.round((unlocked.length / dashboard.achievements.length) * 100)}% of the cabinet · {dashboard.totals.perfectDays} perfect days · {dashboard.totals.longestOverall} day best run
            </p>
          </div>
          <div className="h-3 w-full max-w-[320px] overflow-hidden rounded-pill bg-forest-50">
            <motion.div
              className="h-full rounded-pill bg-gradient-to-r from-forest-400 via-forest-500 to-forest-700"
              initial={{ width: 0 }}
              animate={{ width: `${(unlocked.length / dashboard.achievements.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>
        </div>
      </section>

      <AchievementBoard achievements={dashboard.achievements} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-4 sm:p-5">
          <p className="label">Almost there</p>
          <h2 className="text-[20px] leading-tight">Next milestones</h2>
          <ul className="mt-3 space-y-2.5">
            {nextUp.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${RARITY_STYLE[entry.rarity]?.tile ?? RARITY_STYLE.common.tile} ${RARITY_STYLE[entry.rarity]?.icon ?? RARITY_STYLE.common.icon}`}>
                  <Icon name={entry.icon} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black leading-tight">{entry.title}</p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-pill bg-forest-50">
                    <div className="h-full rounded-pill bg-forest-500" style={{ width: `${Math.min((entry.progress / entry.threshold) * 100, 100)}%` }} />
                  </div>
                </div>
                <span className="shrink-0 text-[12px] font-black tabular-nums text-ink-mute">
                  {entry.progress}/{entry.threshold}
                </span>
              </li>
            ))}
            {nextUp.length === 0 ? <li className="text-[13px] font-bold text-ink-mute">Every milestone is yours. Legendary.</li> : null}
          </ul>
        </section>

        <section className="surface p-4 sm:p-5">
          <p className="label">History</p>
          <h2 className="text-[20px] leading-tight">Unlock timeline</h2>
          {timeline.length === 0 ? (
            <p className="mt-3 text-[13px] font-bold text-ink-mute">No unlocks yet. Your first check-in changes that today.</p>
          ) : (
            <ol className="mt-3 space-y-3 border-l-2 border-forest-100 pl-4">
              {timeline.map((entry, index) => {
                const def = dashboard.achievements.find((item) => item.id === entry.achievementId);
                return (
                  <motion.li
                    key={`${entry.achievementId}-${index}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <span className="absolute -left-[22px] grid h-4 w-4 place-items-center rounded-full bg-forest-500 ring-4 ring-canvas" />
                    <p className="flex items-center gap-1.5 text-[13px] font-black leading-tight">
                      {def?.icon ? <Icon name={def.icon} size={15} className={RARITY_STYLE[def.rarity]?.icon ?? RARITY_STYLE.common.icon} /> : null}
                      <span className="truncate">{def?.title ?? entry.achievementId}</span>
                    </p>
                    <p className="text-[11px] font-bold text-ink-mute">
                      {formatDay(entry.unlockedAt.slice(0, 10))}
                      {entry.habitId ? ` · ${def?.habitName ?? 'a habit'}` : ''}
                      {entry.streakLength ? ` · ${entry.streakLength} days` : ''}
                    </p>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
