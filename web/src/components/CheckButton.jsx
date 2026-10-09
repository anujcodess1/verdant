import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';

export function CheckButton({ habit, dayKey, pending, disabled, onPress, size = 46 }) {
  const target = habit.targetCount ?? 1;
  const done = Boolean(habit.today?.done);
  const count = Math.min(habit.today?.count ?? 0, target);
  const partial = target > 1 && count > 0 && !done;
  const ratio = target > 1 ? count / target : done ? 1 : 0;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;

  const counterText = target > 1 ? ` ${Math.min(count, target)} of ${target}` : '';
  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onPress()}
      disabled={disabled}
      aria-pressed={done}
      aria-label={done ? `Undo ${habit.name}${counterText}` : `Complete ${habit.name}${counterText}`}
      className="tap-target relative grid place-items-center rounded-pill"
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.9 }}
      animate={done ? { backgroundColor: '#1f8057', borderColor: '#186647' } : { backgroundColor: '#ffffff', borderColor: partial ? '#4fb483' : '#dbe9dd' }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef8f0" strokeWidth="3" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? '#aee1c0' : '#2f9e6b'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ type: 'spring', stiffness: 210, damping: 30 }}
        />
      </svg>

      {done ? (
        <motion.svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 20 }}
          className="relative z-10"
          aria-hidden="true"
        >
          <motion.path
            d="M5 13.5 L10 18.5 L19 6.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          />
        </motion.svg>
      ) : target > 1 ? (
        <span className="relative z-10 text-[13px] font-black tabular-nums text-forest-800">
          {count}
          <span className="text-ink-mute">/{target}</span>
        </span>
      ) : (
        <span className="relative z-10 text-forest-300">
          <Icon name="check" size={16} strokeWidth={2.4} />
        </span>
      )}

      {pending ? <span className="absolute inset-0 rounded-pill border-2 border-forest-400/60 motion-safe:animate-ping" /> : null}

      {done ? (
        <motion.span
          key="ring"
          className="pointer-events-none absolute inset-0 rounded-pill border-2 border-forest-300"
          initial={{ scale: 1, opacity: 0.65 }}
          animate={{ scale: 1.55, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ) : null}
    </motion.button>
  );
}
