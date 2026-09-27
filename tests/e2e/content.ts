import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

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
