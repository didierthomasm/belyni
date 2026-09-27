import { describe, expect, it } from 'vitest';
import { groupServices } from './services';

const s = (name: string, category: 'cabello' | 'unas' | 'masajes', order = 100) => ({
  name,
  category,
  order,
});

describe('groupServices', () => {
  it('groups in CATEGORIES order and drops empty categories', () => {
    const groups = groupServices([
      s('Masaje', 'masajes'),
      s('Manicura', 'unas'),
      s('Corte', 'cabello'),
    ]);
    expect(groups.map((g) => g.id)).toEqual(['cabello', 'unas', 'masajes']);
    expect(groups[1].label).toBe('Uñas');
  });

  it('sorts by order, then by name in Spanish collation', () => {
    const groups = groupServices([
      s('Peinado', 'cabello', 2),
      s('Ñongo', 'cabello', 1),
      s('Alaciado', 'cabello', 1),
      s('Corte', 'cabello', 1),
    ]);
    expect(groups[0].items.map((i) => i.name)).toEqual(['Alaciado', 'Corte', 'Ñongo', 'Peinado']);
  });

  it('does not mutate the input', () => {
    const input = [s('B', 'cabello', 2), s('A', 'cabello', 1)];
    groupServices(input);
    expect(input.map((i) => i.name)).toEqual(['B', 'A']);
  });

  it('returns [] for no services', () => {
    expect(groupServices([])).toEqual([]);
  });
});
