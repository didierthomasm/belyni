import { describe, expect, it } from 'vitest';
import {
  emptyToUndefined,
  openingHoursSchema,
  optionalInt,
  optionalText,
  optionalUrl,
  phoneSchema,
  timeSchema,
} from './content-schema';

describe('empty values written by the CMS', () => {
  it('maps "" and null to undefined, keeps everything else', () => {
    expect(emptyToUndefined('')).toBeUndefined();
    expect(emptyToUndefined(null)).toBeUndefined();
    expect(emptyToUndefined(0)).toBe(0);
    expect(emptyToUndefined('x')).toBe('x');
  });
  it('optionalText / optionalUrl / optionalInt accept empty values', () => {
    expect(optionalText.parse('')).toBeUndefined();
    expect(optionalUrl.parse(null)).toBeUndefined();
    expect(optionalInt.parse(null)).toBeUndefined();
    expect(optionalInt.parse(45)).toBe(45);
  });
  it('optionalUrl still rejects garbage', () => {
    expect(optionalUrl.safeParse('instagram belyni').success).toBe(false);
  });
  it('optionalInt rejects negatives and decimals', () => {
    expect(optionalInt.safeParse(-5).success).toBe(false);
    expect(optionalInt.safeParse(1.5).success).toBe(false);
  });
  it('optionalText accepts YAML-parsed numeric digits (e.g. a postal code)', () => {
    expect(optionalText.parse(91700)).toBe('91700');
  });
});

describe('phoneSchema', () => {
  it('accepts human formats and rejects invalid numbers with a Spanish message', () => {
    expect(phoneSchema.parse('(229) 225-8060')).toBe('(229) 225-8060');
    const result = phoneSchema.safeParse('229 000');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/10 dígitos/);
  });
  it('accepts YAML-parsed numeric digits (owner typed digits with no quotes)', () => {
    expect(phoneSchema.parse(2292258060)).toBe('2292258060');
  });
});

describe('timeSchema / openingHoursSchema', () => {
  it('accepts HH:MM 24h and rejects other formats', () => {
    expect(timeSchema.safeParse('09:30').success).toBe(true);
    expect(timeSchema.safeParse('9:30').success).toBe(false);
    expect(timeSchema.safeParse('24:00').success).toBe(false);
    expect(timeSchema.safeParse('7 pm').success).toBe(false);
  });
  it('rejects closing before opening', () => {
    const result = openingHoursSchema.safeParse({ day: 'lunes', open: '19:00', close: '10:00' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/cierre/);
  });
  it('rejects unknown days', () => {
    expect(
      openingHoursSchema.safeParse({ day: 'monday', open: '10:00', close: '19:00' }).success,
    ).toBe(false);
  });
});
