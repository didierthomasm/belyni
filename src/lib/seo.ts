import type { DayId, OpeningHours } from './hours';
import { normalizeMxPhone } from './phone';

export interface LocalBusinessInput {
  name: string;
  intro: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    region: string;
    postalCode?: string;
  };
  geo: { lat: number; lng: number };
  hours: OpeningHours[];
  instagram?: string;
  facebook?: string;
}

const SCHEMA_DAY: Record<DayId, string> = {
  lunes: 'Monday',
  martes: 'Tuesday',
  miercoles: 'Wednesday',
  jueves: 'Thursday',
  viernes: 'Friday',
  sabado: 'Saturday',
  domingo: 'Sunday',
};

// Datos estructurados para Google (BeautySalon ⊂ LocalBusiness)
export function buildLocalBusinessJsonLd(
  site: LocalBusinessInput,
  pageUrl: string,
  imageUrl: string,
): Record<string, unknown> {
  const sameAs = [site.instagram, site.facebook].filter((u): u is string => Boolean(u));
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: site.name,
    description: site.intro,
    url: pageUrl,
    image: imageUrl,
    telephone: `+52${normalizeMxPhone(site.phone)}`,
    ...(site.email && { email: site.email }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street}, ${site.address.neighborhood}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      ...(site.address.postalCode && { postalCode: site.address.postalCode }),
      addressCountry: 'MX',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    ...(site.hours.length > 0 && {
      openingHoursSpecification: site.hours.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${SCHEMA_DAY[h.day]}`,
        opens: h.open,
        closes: h.close,
      })),
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

// JSON seguro dentro de <script>: "<" se escapa para que no pueda cerrar la etiqueta
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
