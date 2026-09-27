import { z } from 'astro/zod';
import { DAY_IDS } from './hours';
import { isValidMxPhone } from './phone';

// Keystatic guarda los campos vacíos como '' o null: los tratamos como "sin valor"
export const emptyToUndefined = (value: unknown): unknown =>
  value === '' || value === null ? undefined : value;

// YAML interpreta dígitos sin comillas (teléfono, código postal) como número
export const numberToString = (value: unknown): unknown =>
  typeof value === 'number' ? String(value) : value;

export const optionalText = z.preprocess(
  (v) => emptyToUndefined(numberToString(v)),
  z.string().optional(),
);
export const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
export const optionalInt = z.preprocess(
  emptyToUndefined,
  z.number().int().nonnegative().optional(),
);

export const phoneSchema = z.preprocess(
  numberToString,
  z.string().refine(isValidMxPhone, 'Teléfono inválido: usa 10 dígitos, por ejemplo 229 225 8060'),
);

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM de 24 horas, por ejemplo 09:30');

export const openingHoursSchema = z
  .object({ day: z.enum(DAY_IDS), open: timeSchema, close: timeSchema })
  .refine((h) => h.open < h.close, {
    message: 'La hora de cierre debe ser posterior a la de apertura',
    path: ['close'],
  });
