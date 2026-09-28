import { describe, expect, it } from 'vitest';
import { navItems } from './nav';

describe('navItems', () => {
  it('keeps only visible sections, in order, as anchor links', () => {
    expect(
      navItems([
        { id: 'servicios', label: 'Servicios', visible: true },
        { id: 'galeria', label: 'Galería', visible: false },
        { id: 'contacto', label: 'Contacto', visible: true },
      ]),
    ).toEqual([
      { href: '#servicios', label: 'Servicios' },
      { href: '#contacto', label: 'Contacto' },
    ]);
  });
});
