import { describe, expect, it } from 'vitest';
import { buildLocalBusinessJsonLd, serializeJsonLd, type LocalBusinessInput } from './seo';

const SITE: LocalBusinessInput = {
  name: 'Belyni',
  intro: 'Salón de belleza en Veracruz.',
  phone: '229 225 8060',
  address: {
    street: 'Juan Enríquez 431',
    neighborhood: 'Ricardo Flores Magón',
    city: 'Veracruz',
    region: 'Veracruz',
  },
  geo: { lat: 19.18, lng: -96.12 },
  hours: [
    { day: 'lunes', open: '10:00', close: '19:00' },
    { day: 'sabado', open: '09:00', close: '14:00' },
  ],
  instagram: 'https://www.instagram.com/belynisalon/',
};

describe('buildLocalBusinessJsonLd', () => {
  const ld = buildLocalBusinessJsonLd(SITE, 'https://belyni.mx/', 'https://belyni.mx/og.jpg');

  it('describes a BeautySalon with international phone and MX address', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BeautySalon');
    expect(ld.telephone).toBe('+522292258060');
    expect(ld.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: 'Juan Enríquez 431, Ricardo Flores Magón',
      addressLocality: 'Veracruz',
      addressCountry: 'MX',
    });
    expect(ld).not.toHaveProperty('address.postalCode');
  });

  it('maps opening hours to schema.org days', () => {
    expect(ld.openingHoursSpecification).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Monday',
        opens: '10:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Saturday',
        opens: '09:00',
        closes: '14:00',
      },
    ]);
  });

  it('lists only existing social profiles and omits empty hours/email', () => {
    expect(ld.sameAs).toEqual(['https://www.instagram.com/belynisalon/']);
    expect(ld).not.toHaveProperty('email');
    const noHours = buildLocalBusinessJsonLd(
      { ...SITE, hours: [], instagram: undefined },
      'https://belyni.mx/',
      'x',
    );
    expect(noHours).not.toHaveProperty('openingHoursSpecification');
    expect(noHours).not.toHaveProperty('sameAs');
  });
});

describe('serializeJsonLd', () => {
  it('cannot close the script tag or inject markup', () => {
    const out = serializeJsonLd({ name: 'Belyni </script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('Belyni </script><script>alert(1)</script>');
  });
});
