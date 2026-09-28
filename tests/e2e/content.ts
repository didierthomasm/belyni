import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { isPromotionExpired } from '../../src/lib/promotions';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

export interface Promotion {
  title: string;
  text: string;
  startDate: string;
  endDate: string;
  order: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readSite(): Record<string, any> {
  return parse(readFileSync(join(CONTENT_DIR, 'site', 'index.yaml'), 'utf8'));
}

export function countEntries(collection: string): number {
  const dir = join(CONTENT_DIR, collection);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith('.yaml')).length;
}

export function hoursCount(): number {
  return (readSite().hours ?? []).length;
}

export function readPromotions(): Promotion[] {
  const dir = join(CONTENT_DIR, 'promotions');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => parse(readFileSync(join(dir, f), 'utf8')));
}

// La misma promo que el build renderiza primero (src/pages/index.astro): la
// próxima en vencer que no haya vencido ya, hoy en la zona horaria del salón.
export function firstNonExpiredPromotion(now: Date = new Date()): Promotion | undefined {
  return readPromotions()
    .filter((p) => !isPromotionExpired(p, now))
    .toSorted((a, b) => a.startDate.localeCompare(b.startDate) || a.order - b.order)[0];
}
