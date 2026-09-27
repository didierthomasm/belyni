import { collection, config, fields, singleton } from '@keystatic/core';
import { CATEGORIES } from './src/lib/categories';
import { DAYS } from './src/lib/hours';
import { HIGHLIGHT_ICONS } from './src/lib/icons';

// Las imágenes se guardan en src/assets/img/<carpeta> para que Astro las optimice.
// publicPath es relativo al archivo YAML (src/content/<colección>/<slug>.yaml).
const image = (label: string, folder: string, isRequired = true) =>
  fields.image({
    label,
    directory: `src/assets/img/${folder}`,
    publicPath: `../../assets/img/${folder}/`,
    validation: { isRequired },
  });

const text = (
  label: string,
  max: number,
  opts: { multiline?: boolean; description?: string; min?: number } = {},
) =>
  fields.text({
    label,
    description: opts.description,
    multiline: opts.multiline,
    validation: { length: { min: opts.min ?? 1, max } },
  });

const order = fields.integer({
  label: 'Orden',
  description: 'Número menor = aparece primero',
  defaultValue: 100,
  validation: { isRequired: true },
});

const TIME_HELP = 'Formato 24 h: HH:MM, por ejemplo 09:30 o 19:00';

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Belyni' } },
  singletons: {
    site: singleton({
      label: 'Datos del salón',
      path: 'src/content/site/',
      format: { data: 'yaml' },
      schema: {
        name: text('Nombre del salón', 60),
        tagline: text('Frase principal (título grande)', 80),
        intro: text('Presentación corta', 220, { multiline: true }),
        heroImage: image('Foto principal', 'site'),
        heroImageAlt: text('Descripción de la foto principal', 140, {
          description: 'Qué se ve en la foto (para personas con discapacidad visual y para Google)',
        }),
        phone: text('Teléfono para llamadas', 25, {
          description: '10 dígitos, por ejemplo 229 225 8060',
        }),
        whatsapp: text('WhatsApp', 25, { description: '10 dígitos, por ejemplo 229 225 8060' }),
        whatsappMessage: text('Mensaje inicial de WhatsApp', 200, { multiline: true }),
        email: fields.text({ label: 'Correo (opcional)' }),
        address: fields.object(
          {
            street: text('Calle y número', 80),
            neighborhood: text('Colonia', 80),
            city: text('Ciudad', 60),
            region: text('Estado', 60),
            postalCode: fields.text({ label: 'Código postal (opcional)' }),
          },
          { label: 'Dirección' },
        ),
        geo: fields.object(
          {
            lat: fields.number({ label: 'Latitud', validation: { isRequired: true } }),
            lng: fields.number({ label: 'Longitud', validation: { isRequired: true } }),
          },
          { label: 'Coordenadas (para Google)' },
        ),
        mapsUrl: fields.url({
          label: 'Enlace "Cómo llegar" (Google Maps)',
          validation: { isRequired: true },
        }),
        mapsEmbedUrl: fields.url({
          label: 'Enlace del mapa incrustado',
          validation: { isRequired: true },
        }),
        instagram: fields.url({ label: 'Instagram (opcional)' }),
        facebook: fields.url({ label: 'Facebook (opcional)' }),
        hours: fields.array(
          fields.object({
            day: fields.select({
              label: 'Día',
              options: DAYS.map((d) => ({ label: d.label, value: d.id })),
              defaultValue: 'lunes',
            }),
            open: text('Abre', 5, { description: TIME_HELP, min: 5 }),
            close: text('Cierra', 5, { description: TIME_HELP, min: 5 }),
          }),
          {
            label: 'Horario',
            description:
              'Un renglón por turno. Si cierran a mediodía, agrega dos renglones para ese día.',
            itemLabel: (p) =>
              `${p.fields.day.value} ${p.fields.open.value}–${p.fields.close.value}`,
          },
        ),
        highlights: fields.array(
          fields.object({
            icon: fields.select({
              label: 'Ícono',
              options: HIGHLIGHT_ICONS.map((i) => ({ label: i, value: i })),
              defaultValue: 'sparkles',
            }),
            title: text('Título', 40),
            text: text('Texto', 140, { multiline: true }),
          }),
          {
            label: '¿Por qué Belyni? (máximo 4)',
            itemLabel: (p) => p.fields.title.value,
            validation: { length: { max: 4 } },
          },
        ),
        servicesNote: fields.text({
          label: 'Nota bajo "Nuestros servicios" (opcional)',
          multiline: true,
        }),
      },
    }),
  },
  collections: {
    services: collection({
      label: 'Servicios',
      path: 'src/content/services/*',
      slugField: 'name',
      format: { data: 'yaml' },
      columns: ['category', 'priceFrom'],
      schema: {
        name: fields.slug({
          name: { label: 'Nombre', validation: { length: { min: 1, max: 60 } } },
        }),
        category: fields.select({
          label: 'Categoría',
          options: CATEGORIES.map((c) => ({ label: c.label, value: c.id })),
          defaultValue: 'cabello',
        }),
        description: text('Descripción', 160, { multiline: true }),
        priceFrom: fields.integer({
          label: 'Precio desde (MXN, opcional)',
          validation: { min: 0 },
        }),
        durationMin: fields.integer({
          label: 'Duración en minutos (opcional)',
          validation: { min: 0 },
        }),
        image: image('Foto (opcional)', 'services', false),
        imageAlt: fields.text({ label: 'Descripción de la foto' }),
        order,
      },
    }),
    team: collection({
      label: 'Equipo',
      path: 'src/content/team/*',
      slugField: 'name',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({
          name: { label: 'Nombre', validation: { length: { min: 1, max: 60 } } },
        }),
        role: text('Puesto', 60),
        photo: image('Foto', 'team'),
        photoAlt: fields.text({ label: 'Descripción de la foto' }),
        order,
      },
    }),
    gallery: collection({
      label: 'Galería',
      path: 'src/content/gallery/*',
      slugField: 'alt',
      format: { data: 'yaml' },
      schema: {
        alt: fields.slug({
          name: { label: 'Descripción de la foto', validation: { length: { min: 1, max: 140 } } },
        }),
        image: image('Foto', 'gallery'),
        order,
      },
    }),
    brands: collection({
      label: 'Marcas',
      path: 'src/content/brands/*',
      slugField: 'name',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({
          name: { label: 'Marca', validation: { length: { min: 1, max: 40 } } },
        }),
        logo: image('Logo', 'brands'),
        url: fields.url({ label: 'Sitio web (opcional)' }),
        order,
      },
    }),
    reviews: collection({
      label: 'Opiniones',
      path: 'src/content/reviews/*',
      slugField: 'author',
      format: { data: 'yaml' },
      schema: {
        author: fields.slug({
          name: { label: 'Nombre de la clienta', validation: { length: { min: 1, max: 60 } } },
        }),
        text: text('Opinión', 300, { multiline: true }),
        rating: fields.integer({
          label: 'Estrellas (1 a 5)',
          defaultValue: 5,
          validation: { min: 1, max: 5, isRequired: true },
        }),
        order,
      },
    }),
    promotions: collection({
      label: 'Promociones',
      path: 'src/content/promotions/*',
      slugField: 'title',
      format: { data: 'yaml' },
      columns: ['startDate', 'endDate'],
      schema: {
        title: fields.slug({
          name: { label: 'Título', validation: { length: { min: 1, max: 60 } } },
        }),
        text: text('Texto', 160, { multiline: true }),
        startDate: fields.date({ label: 'Empieza', validation: { isRequired: true } }),
        endDate: fields.date({ label: 'Termina (incluido)', validation: { isRequired: true } }),
        order,
      },
    }),
  },
});
