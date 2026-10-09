import { motion } from 'framer-motion';
import { Icon } from './Icon.jsx';
import { formatDay } from '../lib/date.js';

function Ring({ value, size = 132, stroke = 12, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ddefe2" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#pulseGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value) }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
        />
        <defs>
          <linearGradient id="pulseGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4fb483" />
            <stop offset="100%" stopColor="#14663f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative z-10 text-center">{children}</div>
    </div>
  );
}

function Metric({ icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line/80 bg-white px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="label">{label}</p>
        <p className="-mt-1 truncate text-[17px] font-display font-extrabold leading-tight text-forest-900">{value}</p>
        {hint ? <p className="truncate text-[11px] font-bold text-ink-mute">{hint}</p> : null}
      </div>
    </div>
  );
}

export function TodayPulse({ dashboard }) {
  const { totals, habits, today } = dashboard;
  const ratio = totals.todayEligible ? totals.todayDone / totals.todayEligible : 0;
  const allDone = totals.todayEligible > 0 && totals.todayDone === totals.todayEligible;
  const pending = habits.filter((habit) => habit.today.eligible && !habit.today.done).slice(0, 3);
  const hero = habits.find((habit) => habit.stats.currentStreak === totals.currentOverall && totals.currentOverall > 0);

  return (
    <section className="surface grain relative overflow-hidden p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Ring value={ratio}>
          <p className="font-display text-[34px] font-extrabold leading-none text-forest-900">
            {totals.todayDone}
            <span className="text-[20px] text-ink-mute">/{totals.todayEligible}</span>
          </p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-ink-mute">today</p>
        </Ring>

        <div className="min-w-0 flex-1">
          <p className="label">{formatDay(today, { month: undefined, day: undefined, weekday: 'long' })} · {today.slice(5)}</p>
          <h1 className="mt-0.5 text-[26px] leading-tight sm:text-[30px]">
            {allDone ? 'Canopy complete' : pending.length ? 'Still growing' : 'Ready when you are'}
          </h1>
          <p className="mt-1 text-[14px] font-bold text-ink-soft">
            {allDone
              ? 'Every scheduled habit is logged. The forest is thriving.'
              : pending.length === 1
                ? 'One habit left today.'
                : pending.length
                  ? 'Next up:'
                  : 'Nothing is scheduled for today. Bonus check-ins still count.'}
          </p>

          {pending.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pending.map((habit) => (
                <span key={habit.id} className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white px-2.5 py-1 text-[12px] font-black" style={{ color: habit.color }}>
                  <Icon name={habit.icon} size={14} />
                  <span className="text-ink">{habit.name}</span>
                </span>
              ))}
            </div>
          ) : null}

          {allDone ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="mt-3 inline-flex items-center gap-2 rounded-pill bg-forest-700 px-4 py-2 text-[13px] font-black text-white"
            >
              <Icon name="trophy" size={15} />
              Perfect day unlocked
            </motion.div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric icon="flame" label="Longest live streak" value={`${totals.currentOverall}d`} hint={hero ? hero.name : 'no live streak'} />
            <Metric icon="pine" label="Total check-ins" value={totals.totalCompleted.toLocaleString()} hint="all time" />
            <Metric icon="chart" label="30 day rhythm" value={`${totals.avgCompletionRate}%`} hint={`${totals.activeHabits} habits`} />
          </div>
        </div>
      </div>
    </section>
  );
}
