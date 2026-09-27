// Íconos que la dueña puede elegir para los "highlights" (Por qué Belyni)
export const HIGHLIGHT_ICONS = [
  'sparkles',
  'leaf',
  'shield-check',
  'heart',
  'award',
  'gem',
] as const;
export type HighlightIcon = (typeof HIGHLIGHT_ICONS)[number];

// Todos los íconos usados en el sitio, por set de Iconify
export const ICON_INCLUDE = {
  lucide: [
    ...HIGHLIGHT_ICONS,
    'menu',
    'x',
    'phone',
    'mail',
    'map-pin',
    'clock',
    'navigation',
    'map',
    'star',
  ],
  'simple-icons': ['whatsapp', 'instagram', 'facebook'],
};
