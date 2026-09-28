import { describe, expect, it } from 'vitest';
import { formatMxPhone, isValidMxPhone, normalizeMxPhone, telHref } from './phone';

describe('normalizeMxPhone', () => {
  it.each([
    ['2292258060', '2292258060'],
    ['229 225 8060', '2292258060'],
    ['(229) 225-8060', '2292258060'],
    ['229.225.80.60', '2292258060'],
    ['+52 229 225 8060', '2292258060'],
    ['52 2292258060', '2292258060'],
    ['+52 1 229 225 8060', '2292258060'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizeMxPhone(raw)).toBe(expected);
  });

  it.each(['', '12345', '229 225 806', '+1 555 123 4567 89', 'llámanos'])('rejects %s', (raw) => {
    expect(() => normalizeMxPhone(raw)).toThrow(/Número de teléfono inválido/);
  });

  it.each(['+52 1 229 225 806', '0229225806', '1229225806'])(
    'rejects impossible national numbers starting with 0 or 1: %s',
    (raw) => {
      expect(() => normalizeMxPhone(raw)).toThrow(/Número de teléfono inválido/);
    },
  );
});

describe('isValidMxPhone', () => {
  it('returns true for valid and false for invalid numbers', () => {
    expect(isValidMxPhone('229 225 8060')).toBe(true);
    expect(isValidMxPhone('229 000')).toBe(false);
  });
});

describe('telHref / formatMxPhone', () => {
  it('builds an international tel: link', () => {
    expect(telHref('(229) 225-8060')).toBe('tel:+522292258060');
  });
  it('formats for display as 3-3-4', () => {
    expect(formatMxPhone('+52 1 2292258060')).toBe('229 225 8060');
  });
});
