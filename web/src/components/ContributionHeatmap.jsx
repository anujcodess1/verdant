import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { HEAT_COLORS, formatDay, groupHeatmap, heatColor } from '../lib/date.js';

const Cell = memo(function Cell({ cell, today, onHover, active }) {
  if (!cell) return <span className="h-3 w-3 rounded-cell sm:h-3.5 sm:w-3.5" />;
  const future = cell.dayKey > today;
  return (
    <span
      onMouseEnter={() => onHover(cell)}
      title={`${formatDay(cell.dayKey)} · ${cell.done} of ${cell.eligible || 0} habits`}
      className={`heat-cell h-3 w-3 rounded-cell sm:h-3.5 sm:w-3.5 ${active ? 'z-10' : ''}`}
      style={{
        backgroundColor: future ? 'rgba(230,239,232,0.4)' : heatColor(cell),
        boxShadow: active ? '0 0 0 2px #15513b' : cell.perfect ? 'inset 0 0 0 1px rgba(21,81,59,0.35)' : 'none',
      }}
    />
  );
});

export function ContributionHeatmap({ heatmap, today, startOfWeek, months }) {
  const [hover, setHover] = useState(null);
  const weeks = useMemo(() => groupHeatmap(heatmap, startOfWeek, today), [heatmap, startOfWeek, today]);
  const streak = useMemo(() => {
    let run = 0;
    for (let offset = 0; offset < heatmap.length; offset += 1) {
      const cell = heatmap[heatmap.length - 1 - offset];
      if (!cell) break;
      if (cell.done > 0) run += 1;
      else if (offset === 0) continue;
      else break;
    }
    return run;
  }, [heatmap]);
  const totals = heatmap.reduce((sum, cell) => sum + cell.done, 0);

  return (
    <section className="surface overflow-hidden p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="label">Consistency</p>
          <h2 className="text-[20px] leading-tight">Contribution forest</h2>
        </div>
        <p className="text-[13px] font-black text-ink-soft">
          {totals.toLocaleString()} check-in{totals === 1 ? '' : 's'} · {streak} day{streak === 1 ? '' : 's'} in a row with activity
        </p>
      </header>

      <div className="mt-3 flex min-h-[92px] items-start gap-2">
        <div className="hide-scroll -mt-px grid shrink-0 grid-flow-row gap-[3px] pt-[15px]">
          {['', 'M', 'W', 'F', ''].map((label, index) => (
            <span key={`${label}-${index}`} className="h-3 text-[9px] font-black leading-3 text-ink-mute sm:h-3.5">
              {label}
            </span>
          ))}
        </div>
        <div className="hide-scroll flex-1 overflow-x-auto pb-1">
          <div className="flex flex-col">
            <div className="mb-1 flex gap-[3px]">
              {weeks.map((week) => (
                <span key={`${week.weekStart}-label`} className="relative h-4 w-3 text-[10px] font-black text-ink-mute sm:w-3.5">
                  {week.showLabel ? <span className="absolute left-0 top-0 whitespace-nowrap">{week.monthLabel}</span> : null}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week) => (
                <div key={week.weekStart} className="grid grid-flow-row gap-[3px]">
                  {week.cells.map((cell, index) => (
                    <Cell
                      key={cell?.dayKey ?? `${week.weekStart}-${index}`}
                      cell={cell}
                      today={today}
                      active={Boolean(hover && cell && hover.dayKey === cell.dayKey)}
                      onHover={setHover}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-ink-mute">
          <span>Less</span>
          {HEAT_COLORS.map((color, index) => (
            <span key={color} className="h-3 w-3 rounded-cell" style={{ backgroundColor: color }} />
          ))}
          <span>More</span>
        </div>
        <motion.div
          key={hover?.dayKey ?? 'empty'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-pill border border-line bg-white px-3 py-1 text-[12px] font-black text-ink-soft"
        >
          {hover ? `${formatDay(hover.dayKey)} · ${hover.done}/${hover.eligible || 0} habits${hover.perfect ? ' · perfect day' : ''}` : 'Hover a square for the day'}
        </motion.div>
      </footer>

      {months?.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line/70 pt-4 sm:grid-cols-6">
          {months.map((month) => (
            <div key={month.key} className="rounded-2xl bg-forest-50/70 px-2.5 py-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-ink-mute">{month.label}</p>
              <p className="text-[19px] font-display font-extrabold leading-tight text-forest-800">
                {month.eligible ? Math.round((month.done / month.eligible) * 100) : 0}%
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-forest-100">
                <div
                  className="h-full rounded-pill bg-forest-500"
                  style={{ width: `${month.eligible ? Math.min((month.done / month.eligible) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
