import { z } from 'zod';
import { ApiError } from './http.js';

export const HABIT_ICON_NAMES = [
  'target', 'run', 'book', 'droplet', 'lotus', 'moon', 'dumbbell', 'pen', 'guitar', 'broom',
  'apple', 'pill', 'dog', 'sun', 'brain', 'clock', 'water', 'code', 'leaf', 'flame',
  'sprout', 'seed', 'tree', 'pine', 'pot', 'medal', 'chain', 'star', 'flower', 'anchor',
  'trophy', 'sparkle', 'shield', 'crown', 'sunrise', 'chart', 'grid',
];

const iconSchema = z.enum(HABIT_ICON_NAMES);

export const colorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'color must be a hex value');

export const dayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dayKey must be YYYY-MM-DD');

const daysOfWeekSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'pick at least one weekday')
  .max(7)
  .transform((value) => [...new Set(value)].sort((a, b) => a - b));

export const habitCreateSchema = z.object({
  name: z.string().trim().min(2, 'name needs at least 2 characters').max(60),
  description: z.string().trim().max(120).optional().default(''),
  icon: iconSchema.default('sprout'),
  color: colorSchema.default('#2f9e44'),
  daysOfWeek: daysOfWeekSchema.nullable().optional().default(null),
  targetCount: z.number().int().min(1).max(50).default(1),
});

export const habitUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(120).optional(),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
    daysOfWeek: daysOfWeekSchema.nullable().optional(),
    targetCount: z.number().int().min(1).max(50).optional(),
    archived: z.boolean().optional(),
    order: z.number().int().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'nothing to update' });

export const checkInSchema = z.object({
  dayKey: dayKeySchema.optional(),
  mode: z.enum(['toggle', 'count', 'delta']).default('toggle'),
  count: z.number().int().min(0).max(9999).optional(),
  delta: z.number().int().min(-9999).max(9999).optional(),
  note: z.string().trim().max(140).optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).min(1),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  startOfWeek: z.number().int().min(0).max(6).optional(),
  onboarded: z.boolean().optional(),
});

export const readNotificationsSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).optional(),
});

export function parse(schema, payload) {
  const result = schema.safeParse(payload ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    throw new ApiError(422, details[0]?.message ?? 'Invalid request', details);
  }
  return result.data;
}
