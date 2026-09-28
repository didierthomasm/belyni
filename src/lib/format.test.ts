import { describe, expect, it } from 'vitest';
import { formatDuration, formatPrice } from './format';

describe('formatPrice', () => {
  it.each([
    [0, '$0'],
    [500, '$500'],
    [1500, '$1,500'],
    [12500, '$12,500'],
  ])('formats %i MXN as %s', (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [30, '30 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [150, '2 h 30 min'],
  ])('formats %i minutes as %s', (value, expected) => {
    expect(formatDuration(value)).toBe(expected);
  });
});
