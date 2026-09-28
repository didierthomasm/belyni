export interface ContentFile {
  path: string;
  content: string;
}

export function findPendingMarkers(files: readonly ContentFile[]): string[] {
  return files.flatMap((file) =>
    file.content
      .split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => /(^|\s)#\s*PENDIENTE\b/i.test(line))
      .map(({ line, number }) => `${file.path}:${number}: ${line.trim()}`),
  );
}

export function productionProblems(
  files: readonly ContentFile[],
  site: { hours?: unknown[] | null },
): string[] {
  const pending = findPendingMarkers(files).map((m) => `Dato sin confirmar → ${m}`);
  const missingHours =
    !site.hours || site.hours.length === 0
      ? ['Falta el horario de atención (hours) en src/content/site/index.yaml']
      : [];
  return [...pending, ...missingHours];
}
