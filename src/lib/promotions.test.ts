import { describe, expect, it } from 'vitest';
import { isPromotionActive, isPromotionExpired, localDate } from './promotions';

const PROMO = { startDate: '2026-10-01', endDate: '2026-10-31' };

describe('localDate', () => {
  it('returns the calendar day in Veracruz, not UTC', () => {
    // 1 nov 05:30 UTC = 31 oct 23:30 en Veracruz
    expect(localDate(new Date('2026-11-01T05:30:00Z'))).toBe('2026-10-31');
  });
});

describe('isPromotionActive', () => {
  it('is inactive before the start date (local)', () => {
    // 1 oct 05:59 UTC = 30 sep 23:59 local
    expect(isPromotionActive(PROMO, new Date('2026-10-01T05:59:00Z'))).toBe(false);
  });
  it('is active from 00:00 local on the start date', () => {
    expect(isPromotionActive(PROMO, new Date('2026-10-01T06:00:00Z'))).toBe(true);
  });
  it('is still active late on the end date (local), even if UTC is the next day', () => {
    expect(isPromotionActive(PROMO, new Date('2026-11-01T05:30:00Z'))).toBe(true);
  });
  it('is inactive the day after the end date', () => {
    expect(isPromotionActive(PROMO, new Date('2026-11-01T06:00:00Z'))).toBe(false);
  });
  it('supports single-day promotions', () => {
    const oneDay = { startDate: '2026-12-24', endDate: '2026-12-24' };
    expect(isPromotionActive(oneDay, new Date('2026-12-24T18:00:00Z'))).toBe(true);
  });
});

describe('isPromotionExpired', () => {
  it('is false before and during, true after the end date', () => {
    expect(isPromotionExpired(PROMO, new Date('2026-09-15T12:00:00Z'))).toBe(false);
    expect(isPromotionExpired(PROMO, new Date('2026-10-15T12:00:00Z'))).toBe(false);
    expect(isPromotionExpired(PROMO, new Date('2026-11-02T12:00:00Z'))).toBe(true);
  });
});
