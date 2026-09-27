import { CATEGORIES, type CategoryId } from './categories';

interface GroupableService {
  name: string;
  category: CategoryId;
  order: number;
}

export interface ServiceGroup<T> {
  id: CategoryId;
  label: string;
  items: T[];
}

export function groupServices<T extends GroupableService>(
  services: readonly T[],
): ServiceGroup<T>[] {
  const compare = (a: T, b: T) => a.order - b.order || a.name.localeCompare(b.name, 'es');
  return CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    items: services.filter((s) => s.category === id).toSorted(compare),
  })).filter((group) => group.items.length > 0);
}
