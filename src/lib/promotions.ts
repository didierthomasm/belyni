import { SALON_TIME_ZONE } from './hours';

export interface PromotionWindow {
  startDate: string;
  endDate: string;
}

// Día calendario (AAAA-MM-DD) en la zona horaria del salón
export function localDate(date: Date, timeZone: string = SALON_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Inclusivo en ambos extremos; las cadenas AAAA-MM-DD se comparan correctamente como texto
export function isPromotionActive(
  p: PromotionWindow,
  now: Date,
  timeZone: string = SALON_TIME_ZONE,
): boolean {
  const today = localDate(now, timeZone);
  return p.startDate <= today && today <= p.endDate;
}

export function isPromotionExpired(
  p: PromotionWindow,
  now: Date,
  timeZone: string = SALON_TIME_ZONE,
): boolean {
  return localDate(now, timeZone) > p.endDate;
}
