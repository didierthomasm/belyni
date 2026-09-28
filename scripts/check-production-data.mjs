// Bloquea el deploy a producción si hay datos sin confirmar (Node ≥ 22.18 ejecuta .ts directamente)
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { productionProblems } from '../src/lib/production-gate.ts';

const contentDir = join(import.meta.dirname, '..', 'src', 'content');

const files = readdirSync(contentDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
  .map((entry) => {
    const fullPath = join(entry.parentPath, entry.name);
    return { path: relative(process.cwd(), fullPath), content: readFileSync(fullPath, 'utf8') };
  });

const site = parse(readFileSync(join(contentDir, 'site', 'index.yaml'), 'utf8')) ?? {};
const problems = productionProblems(files, site);

if (problems.length > 0) {
  console.error(
    '❌ El sitio no está listo para producción:\n' + problems.map((p) => `  - ${p}`).join('\n'),
  );
  process.exit(1);
}
console.log('✅ Datos de producción confirmados');
