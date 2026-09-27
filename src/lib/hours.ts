// Horario del salón, siempre evaluado en la hora local de Veracruz
export const DAYS = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
] as const;

export type DayId = (typeof DAYS)[number]['id'];
export const DAY_IDS = DAYS.map((d) => d.id) as [DayId, ...DayId[]];

export interface OpeningHours {
  day: DayId;
  open: string;
  close: string;
}

export interface HoursRow {
  day: DayId;
  label: string;
  text: string;
}

export const SALON_TIME_ZONE = 'America/Mexico_City';

const WEEKDAY_TO_DAY: Record<string, DayId> = {
  Mon: 'lunes',
  Tue: 'martes',
  Wed: 'miercoles',
  Thu: 'jueves',
  Fri: 'viernes',
  Sat: 'sabado',
  Sun: 'domingo',
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function localDayAndMinutes(date: Date, timeZone: string): { day: DayId; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: WEEKDAY_TO_DAY[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function isOpenAt(
  hours: readonly OpeningHours[],
  date: Date,
  timeZone: string = SALON_TIME_ZONE,
): boolean {
  const { day, minutes } = localDayAndMinutes(date, timeZone);
  return hours.some(
    (h) => h.day === day && minutes >= toMinutes(h.open) && minutes < toMinutes(h.close),
  );
}

export function weeklySchedule(hours: readonly OpeningHours[]): HoursRow[] {
  return DAYS.map(({ id, label }) => {
    const shifts = hours
      .filter((h) => h.day === id)
      .toSorted((a, b) => toMinutes(a.open) - toMinutes(b.open));
    const text = shifts.length
      ? shifts.map((s) => `${s.open} – ${s.close}`).join(', ')
      : 'Cerrado';
    return { day: id, label, text };
  });
}
