export const HABIT_ICONS = [
  'target', 'run', 'book', 'droplet', 'lotus', 'moon', 'dumbbell', 'pen',
  'guitar', 'broom', 'apple', 'pill', 'dog', 'sun', 'brain', 'clock',
  'water', 'code', 'leaf', 'flame',
];

export const HABIT_ICON_LABELS = {
  target: 'Focus',
  run: 'Move',
  book: 'Read',
  droplet: 'Hydrate',
  lotus: 'Breathe',
  moon: 'Sleep',
  dumbbell: 'Train',
  pen: 'Write',
  guitar: 'Practice',
  broom: 'Tidy',
  apple: 'Eat clean',
  pill: 'Meds',
  dog: 'Pet care',
  sun: 'Morning',
  brain: 'Learn',
  clock: 'Punctual',
  water: 'Water intake',
  code: 'Build',
  leaf: 'Nature',
  flame: 'Consistency',
};

export const HABIT_COLORS = ['#2f9e44', '#1f8057', '#0ca678', '#4fb483', '#66a80f', '#14663f', '#f79726', '#dd7611', '#099268', '#5c940d'];

export const HABIT_PRESETS = [
  { name: 'Deep Work', description: 'One distraction free hour', icon: 'target', color: '#1f8057', daysOfWeek: null, targetCount: 1 },
  { name: 'Morning Run', description: 'Move before the inbox', icon: 'run', color: '#2f9e44', daysOfWeek: [1, 3, 5], targetCount: 1 },
  { name: 'Read 20 Pages', description: 'Paper beats pixels', icon: 'book', color: '#66a80f', daysOfWeek: null, targetCount: 1 },
  { name: 'Hydrate', description: '8 glasses before dinner', icon: 'droplet', color: '#0ca678', daysOfWeek: null, targetCount: 8 },
  { name: 'Meditate', description: 'Ten minutes of quiet', icon: 'lotus', color: '#099268', daysOfWeek: null, targetCount: 1 },
  { name: 'Sleep by 11', description: 'Protect tomorrow focus', icon: 'moon', color: '#14663f', daysOfWeek: null, targetCount: 1 },
];

export const RARITY_STYLE = {
  common: { ring: 'border-forest-200 bg-forest-50', text: 'text-forest-700', glow: 'shadow-none', tile: 'bg-forest-50', icon: 'text-forest-400' },
  rare: { ring: 'border-forest-300 bg-forest-50', text: 'text-forest-700', glow: 'shadow-card', tile: 'bg-forest-100', icon: 'text-forest-600' },
  epic: { ring: 'border-forest-400 bg-forest-100', text: 'text-forest-800', glow: 'shadow-card', tile: 'bg-forest-200', icon: 'text-forest-800' },
  legendary: { ring: 'border-ember-400 bg-ember-200/60', text: 'text-ember-600', glow: 'shadow-lift', tile: 'bg-ember-200', icon: 'text-ember-600' },
  mythic: { ring: 'border-forest-800 bg-forest-50', text: 'text-forest-800', glow: 'shadow-lift', tile: 'bg-forest-900', icon: 'text-ember-400' },
};

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 66, 100, 150, 200, 300, 365];

export function cadenceLabel(daysOfWeek) {
  if (!daysOfWeek) return 'Every day';
  if (daysOfWeek.length === 7) return 'Every day';
  if (daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((d) => daysOfWeek.includes(d))) return 'Weekdays';
  if (daysOfWeek.length === 2 && [0, 6].every((d) => daysOfWeek.includes(d))) return 'Weekends';
  return daysOfWeek.map((d) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d]).join(' · ');
}
