import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon.jsx';
import { RARITY_STYLE } from '../lib/presets.js';

const TONE = {
  success: { icon: 'check', badge: 'bg-forest-500/12 text-forest-700' },
  error: { icon: 'alert', badge: 'bg-red-400/15 text-red-600' },
  info: { icon: 'leaf', badge: 'bg-forest-300/20 text-forest-700' },
  achievement: { icon: 'medal', badge: 'bg-ember-400/18 text-ember-600' },
};

const CONFETTI = ['#2f9e44', '#4fb483', '#f79726', '#aee1c0', '#14663f', '#ffb648'];

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[86px] z-40 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = TONE[toast.tone] ?? TONE.info;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-white/95 px-3.5 py-3 shadow-lift backdrop-blur"
            >
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone.badge}`}>
                <Icon name={tone.icon} size={17} strokeWidth={2.1} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black leading-tight">{toast.title}</p>
                {toast.message ? <p className="mt-0.5 text-[12px] font-bold text-ink-soft">{toast.message}</p> : null}
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="tap-target -mr-1 grid h-6 w-6 place-items-center rounded-pill text-[12px] font-black text-ink-mute">
                <Icon name="close" size={13} strokeWidth={2.4} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function Celebration({ entry, onDone }) {
  const style = RARITY_STYLE[entry?.rarity] ?? RARITY_STYLE.common;
  return (
    <AnimatePresence>
      {entry ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-forest-950/55 px-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <motion.div
            role="dialog"
            aria-label={`${entry.title} unlocked`}
            initial={{ scale: 0.7, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="relative w-full max-w-[340px] overflow-hidden rounded-[28px] border border-forest-200 bg-white p-6 text-center shadow-lift"
          >
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 16 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="absolute left-1/2 top-[46%] h-2 w-2 rounded-[2px]"
                  style={{ backgroundColor: CONFETTI[index % CONFETTI.length] }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos((index / 16) * Math.PI * 2) * (90 + (index % 4) * 24),
                    y: Math.sin((index / 16) * Math.PI * 2) * (90 + (index % 3) * 26),
                    opacity: [0, 1, 0],
                    rotate: 220,
                  }}
                  transition={{ duration: 1.05, ease: 'easeOut', delay: 0.05 }}
                />
              ))}
            </div>

            <motion.span
              className={`relative z-10 mx-auto grid h-20 w-20 place-items-center rounded-full ${style.tile} ${style.icon}`}
              initial={{ scale: 0.4, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              <Icon name={entry.icon} size={40} strokeWidth={1.5} />
            </motion.span>

            <p className="relative z-10 mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-ember-600">{entry.rarity} unlock</p>
            <h2 className="relative z-10 mt-1 font-display text-[26px] font-extrabold leading-tight">{entry.title}</h2>
            <p className="relative z-10 mt-1.5 text-[13px] font-bold text-ink-soft">
              {entry.habitName ? `${entry.description} · ${entry.habitName}` : entry.description}
              {entry.streakLength ? ` (${entry.streakLength} days)` : ''}
            </p>

            <button
              type="button"
              onClick={onDone}
              className="tap-target relative z-10 mt-5 w-full rounded-pill bg-forest-700 px-5 py-3 text-[15px] font-black text-white hover:bg-forest-800"
            >
              Keep the streak alive
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
