import { getEntry, type CollectionEntry } from 'astro:content';

export type SiteData = CollectionEntry<'site'>['data'];

export async function getSite(): Promise<SiteData> {
  const entry = await getEntry('site', 'index');
  if (!entry) throw new Error('Falta el archivo de configuración src/content/site/index.yaml');
  return entry.data;
}
