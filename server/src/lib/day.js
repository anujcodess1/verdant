const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const formatterCache = new Map();
const partsCache = new Map();

function getFormatter(timeZone, style) {
  const key = `${timeZone}::${style}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    const options =
      style === 'iso'
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          };
    formatter = new Intl.DateTimeFormat(style === 'iso' ? 'en-CA' : 'en-US', {
      ...options,
      timeZone,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function normalizeTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    getFormatter(timeZone, 'iso');
    return timeZone;
  } catch {
    return 'UTC';
  }
}

export function isValidDayKey(value) {
  return typeof value === 'string' && DAY_KEY_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function dayKeyOf(instant, timeZone) {
  return getFormatter(normalizeTimeZone(timeZone), 'iso').format(instant);
}

export function offsetMinutesOf(instant, timeZone) {
  const tz = normalizeTimeZone(timeZone);
  const parts = getFormatter(tz, 'clock').formatToParts(instant);
  const map = {};
  for (const part of parts) map[part.type] = part.value;
  const hour = Number(map.hour) % 24;
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), hour, Number(map.minute), Number(map.second));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

export function dayStartUtc(dayKey, timeZone) {
  const tz = normalizeTimeZone(timeZone);
  const [year, month, day] = dayKey.split('-').map(Number);
  const nominal = Date.UTC(year, month - 1, day);
  const firstOffset = offsetMinutesOf(new Date(nominal), tz);
  let ms = nominal - firstOffset * 60000;
  const secondOffset = offsetMinutesOf(new Date(ms), tz);
  if (secondOffset !== firstOffset) ms = nominal - secondOffset * 60000;
  return new Date(ms);
}

export function addDays(dayKey, amount) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + amount));
  return shifted.toISOString().slice(0, 10);
}

export function diffDays(fromKey, toKey) {
  const a = Date.parse(`${fromKey}T00:00:00Z`);
  const b = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function weekdayOf(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function startOfWeekKey(dayKey, startOfWeek = 1) {
  return addDays(dayKey, -((weekdayOf(dayKey) - startOfWeek + 7) % 7));
}

export function todayKey(timeZone) {
  return dayKeyOf(new Date(), timeZone);
}

export function nowParts(timeZone) {
  const tz = normalizeTimeZone(timeZone);
  const formatter = getFormatter(tz, 'clock');
  const key = `${tz}|${Math.floor(Date.now() / 1000)}`;
  let cached = partsCache.get(key);
  if (!cached) {
    cached = formatter.formatToParts(new Date());
    if (partsCache.size > 2000) partsCache.clear();
    partsCache.set(key, cached);
  }
  const map = {};
  for (const part of cached) map[part.type] = part.value;
  const dayKey = `${map.year}-${map.month}-${map.day}`;
  return {
    dayKey,
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    weekday: weekdayOf(dayKey),
  };
}

export function dayKeysBetween(fromKey, toKey) {
  const count = diffDays(fromKey, toKey);
  const keys = [];
  for (let i = 0; i <= count; i += 1) keys.push(addDays(fromKey, i));
  return keys;
}
