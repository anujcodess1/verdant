export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const HEAT_COLORS = ['#e6efe8', '#bde5c9', '#83d0a5', '#41ac79', '#125e3b'];

export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function dayKeyIn(date, timeZone = localTimeZone()) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(date);
}

export function todayKey(timeZone = localTimeZone()) {
  return dayKeyIn(new Date(), timeZone);
}

export function addDays(dayKey, amount) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

export function diffDays(fromKey, toKey) {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86400000);
}

export function weekdayOf(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function formatDay(dayKey, options = {}) {
  if (!dayKey) return '';
  const date = new Date(`${dayKey}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(date);
}

export function relativeDay(dayKey, today = todayKey()) {
  const diff = diffDays(dayKey, today);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff === -1) return 'tomorrow';
  if (diff > 1) return `${diff} days ago`;
  return `in ${Math.abs(diff)} days`;
}

export function startOfWeekKey(dayKey, startOfWeek) {
  return addDays(dayKey, -((weekdayOf(dayKey) - startOfWeek + 7) % 7));
}

export function intensityOf(cell) {
  if (!cell) return 0;
  if (cell.done === 0) return 0;
  if (!cell.eligible) return 1;
  const ratio = cell.done / cell.eligible;
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export function heatColor(cell) {
  return HEAT_COLORS[intensityOf(cell)];
}

export function groupHeatmap(heatmap, startOfWeek, today) {
  if (!heatmap.length) return [];
  const byDay = new Map(heatmap.map((cell) => [cell.dayKey, cell]));
  const firstKey = heatmap[0].dayKey;
  const lastKey = heatmap[heatmap.length - 1].dayKey;
  const weeks = [];
  let cursor = startOfWeekKey(firstKey, startOfWeek);

  for (let guard = 0; guard < 80; guard += 1) {
    const cells = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const key = addDays(cursor, offset);
      if (key < firstKey || key > lastKey) {
        cells.push(null);
        continue;
      }
      cells.push(byDay.get(key) ?? { dayKey: key, done: 0, eligible: 0, perfect: false });
    }
    const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
      new Date(`${addDays(cursor, 2)}T12:00:00Z`),
    );
    const previous = weeks.length ? weeks[weeks.length - 1] : null;
    weeks.push({
      weekStart: cursor,
      cells,
      monthKey: `${cursor.slice(0, 4)}-${cursor.slice(5, 7)}`,
      monthLabel: month,
      showLabel: !previous || previous.monthKey !== `${cursor.slice(0, 4)}-${cursor.slice(5, 7)}`,
      isCurrentWeek: cursor <= today && addDays(cursor, 6) >= today,
    });
    cursor = addDays(cursor, 7);
    if (cursor > lastKey) break;
  }
  return weeks;
}

export function buildMonthMatrix(monthKeyAnchor, startOfWeek) {
  const [year, month] = monthKeyAnchor.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthKeyAnchor}-${String(day).padStart(2, '0')}`);
  }
  const leading = (weekdayOf(cells[0]) - startOfWeek + 7) % 7;
  return [...Array.from({ length: leading }, () => null), ...cells];
}

export function chunkRows(cells, size) {
  const rows = [];
  for (let i = 0; i < cells.length; i += size) rows.push(cells.slice(i, i + size));
  return rows;
}
