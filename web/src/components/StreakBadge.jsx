import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';

export function StreakBadge({ count, size = 'md', tone = 'ember', animate = true }) {
  const alive = count > 0;
  const sizes = {
    sm: 'text-[12px] gap-1 px-2 py-0.5',
    md: 'text-[13px] gap-1.5 px-2.5 py-1',
    lg: 'text-[17px] gap-2 px-3.5 py-1.5',
  };
  const glyphs = { sm: 13, md: 15, lg: 19 };
  const palette =
    tone === 'ember'
      ? alive
        ? 'border-ember-300 bg-ember-200/50 text-ember-600'
        : 'border-line bg-white text-ink-mute'
      : alive
        ? 'border-forest-300 bg-forest-50 text-forest-700'
        : 'border-line bg-white text-ink-mute';

  return (
    <span className={`inline-flex items-center rounded-pill border font-black tabular-nums ${sizes[size]} ${palette}`}>
      <motion.span
        className="grid place-items-center"
        animate={alive && animate ? { scale: [1, 1.16, 1], rotate: [-4, 4, -3] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 1.6, repeat: alive ? Infinity : 0, ease: 'easeInOut' }}
      >
        <Icon name="flame" size={glyphs[size]} filled={alive} strokeWidth={alive ? 1.2 : 1.7} className={alive ? 'text-ember-500' : 'text-ink-mute/60'} />
      </motion.span>
      <span>{count}</span>
      <span className="font-bold opacity-70">{count === 1 ? 'day' : 'days'}</span>
    </span>
  );
}

export function MilestoneTrack({ current, next }) {
  const target = next ?? Math.max(current, 1);
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-[11px] font-black uppercase tracking-widest text-ink-mute">
        <span>{current} done</span>
        {next ? <span>{next} to go</span> : <span>max tier</span>}
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-pill bg-forest-100">
        <motion.div
          className="h-full rounded-pill bg-gradient-to-r from-forest-400 to-forest-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 26 }}
        />
      </div>
    </div>
  );
}
