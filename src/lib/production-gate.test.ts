import { describe, expect, it } from 'vitest';
import { findPendingMarkers, productionProblems } from './production-gate';

const files = [
  {
    path: 'src/content/site/index.yaml',
    content: 'name: Belyni\nphone: 229 # PENDIENTE: confirmar\n',
  },
  { path: 'src/content/services/corte.yaml', content: 'name: Corte\n' },
];

describe('findPendingMarkers', () => {
  it('reports file and line of every PENDIENTE (case-insensitive)', () => {
    expect(findPendingMarkers([...files, { path: 'x.yaml', content: 'a\nb # pendiente' }])).toEqual(
      [
        'src/content/site/index.yaml:2: phone: 229 # PENDIENTE: confirmar',
        'x.yaml:2: b # pendiente',
      ],
    );
  });
  it('returns [] when everything is confirmed', () => {
    expect(findPendingMarkers([files[1]])).toEqual([]);
  });
});

describe('productionProblems', () => {
  it('requires opening hours', () => {
    expect(productionProblems([files[1]], { hours: [] })).toEqual([
      'Falta el horario de atención (hours) en src/content/site/index.yaml',
    ]);
    expect(productionProblems([files[1]], { hours: null })).toHaveLength(1);
  });
  it('passes with confirmed data and hours', () => {
    expect(productionProblems([files[1]], { hours: [{ day: 'lunes' }] })).toEqual([]);
  });
  it('lists pending markers as problems', () => {
    expect(productionProblems(files, { hours: [{}] })[0]).toMatch(
      /^Dato sin confirmar → src\/content\/site/,
    );
  });
});
