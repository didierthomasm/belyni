import { describe, expect, it } from 'vitest';
import { DAY_IDS, isOpenAt, weeklySchedule, type OpeningHours } from './hours';

// 2026-09-28 es lunes. Veracruz = UTC-6 todo el año (sin horario de verano desde 2022).
const HOURS: OpeningHours[] = [
  { day: 'lunes', open: '10:00', close: '19:00' },
  { day: 'sabado', open: '09:00', close: '14:00' },
  { day: 'sabado', open: '16:00', close: '18:00' },
];

describe('isOpenAt', () => {
  it('is open Monday 10:00 local (16:00 UTC)', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-28T16:00:00Z'))).toBe(true);
  });

  it('is closed Monday 09:59 local', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-28T15:59:00Z'))).toBe(false);
  });

  it('treats closing time as exclusive (19:00 local is closed)', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-29T01:00:00Z'))).toBe(false);
  });

  it('uses salon time even when UTC is already the next day', () => {
    // Lunes 18:30 en Veracruz = martes 00:30 UTC
    expect(isOpenAt(HOURS, new Date('2026-09-29T00:30:00Z'))).toBe(true);
  });

  it('handles split shifts', () => {
    // Sábado 3 oct 2026: 15:00 local cerrado, 16:30 abierto
    expect(isOpenAt(HOURS, new Date('2026-10-03T21:00:00Z'))).toBe(false);
    expect(isOpenAt(HOURS, new Date('2026-10-03T22:30:00Z'))).toBe(true);
  });

  it('is closed on days without hours and when there are no hours at all', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-27T18:00:00Z'))).toBe(false); // domingo
    expect(isOpenAt([], new Date('2026-09-28T16:00:00Z'))).toBe(false);
  });
});

describe('weeklySchedule', () => {
  it('returns 7 rows Monday-first with Cerrado and joined split shifts', () => {
    const rows = weeklySchedule(HOURS);
    expect(rows.map((r) => r.day)).toEqual(DAY_IDS);
    expect(rows[0]).toEqual({ day: 'lunes', label: 'Lunes', text: '10:00 – 19:00' });
    expect(rows[1].text).toBe('Cerrado');
    expect(rows[5].text).toBe('09:00 – 14:00, 16:00 – 18:00');
  });

  it('sorts shifts by opening time regardless of input order', () => {
    const rows = weeklySchedule([...HOURS].reverse());
    expect(rows[5].text).toBe('09:00 – 14:00, 16:00 – 18:00');
  });
});
