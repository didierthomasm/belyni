// Categorías fijas de servicios (el orden aquí es el orden en la página)
export const CATEGORIES = [
  { id: 'cabello', label: 'Cabello' },
  { id: 'color', label: 'Color' },
  { id: 'unas', label: 'Uñas' },
  { id: 'tratamientos', label: 'Tratamientos' },
  { id: 'masajes', label: 'Masajes' },
  { id: 'maquillaje', label: 'Maquillaje' },
  { id: 'cejas-pestanas', label: 'Cejas y pestañas' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
