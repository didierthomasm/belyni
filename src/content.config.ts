import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_IDS } from './lib/categories';
import {
  emptyToUndefined,
  openingHoursSchema,
  optionalInt,
  optionalText,
  optionalUrl,
  phoneSchema,
} from './lib/content-schema';
import { HIGHLIGHT_ICONS } from './lib/icons';

// Un archivo YAML por entrada (misma estructura que usa Keystatic)
const yamlIn = (dir: string) => glob({ base: `./src/content/${dir}`, pattern: '*.yaml' });
const order = z.number().int().default(100);

const site = defineCollection({
  loader: yamlIn('site'),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      tagline: z.string().min(1).max(80),
      intro: z.string().min(1).max(220),
      heroImage: image(),
      heroImageAlt: z.string().min(1),
      phone: phoneSchema,
      whatsapp: phoneSchema,
      whatsappMessage: z.string().min(1).max(200),
      email: z.preprocess(emptyToUndefined, z.email().optional()),
      address: z.object({
        street: z.string().min(1),
        neighborhood: z.string().min(1),
        city: z.string().min(1),
        region: z.string().min(1),
        postalCode: optionalText,
      }),
      geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
      mapsUrl: z.url(),
      mapsEmbedUrl: z.url(),
      instagram: optionalUrl,
      facebook: optionalUrl,
      hours: z.preprocess((v) => v ?? [], z.array(openingHoursSchema)),
      highlights: z.preprocess(
        (v) => v ?? [],
        z
          .array(
            z.object({
              icon: z.enum(HIGHLIGHT_ICONS),
              title: z.string().min(1).max(40),
              text: z.string().min(1).max(140),
            }),
          )
          .max(4),
      ),
      servicesNote: optionalText,
    }),
});

const services = defineCollection({
  loader: yamlIn('services'),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1).max(60),
      category: z.enum(CATEGORY_IDS),
      description: z.string().min(1).max(160),
      priceFrom: optionalInt,
      durationMin: optionalInt,
      image: z.preprocess(emptyToUndefined, image().optional()),
      imageAlt: optionalText,
      order,
    }),
});

const team = defineCollection({
  loader: yamlIn('team'),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1).max(60),
      role: z.string().min(1).max(60),
      photo: image(),
      photoAlt: optionalText,
      order,
    }),
});

const gallery = defineCollection({
  loader: yamlIn('gallery'),
  schema: ({ image }) => z.object({ image: image(), alt: z.string().min(1).max(140), order }),
});

const brands = defineCollection({
  loader: yamlIn('brands'),
  schema: ({ image }) =>
    z.object({ name: z.string().min(1).max(40), logo: image(), url: optionalUrl, order }),
});

const reviews = defineCollection({
  loader: yamlIn('reviews'),
  schema: z.object({
    author: z.string().min(1).max(60),
    text: z.string().min(1).max(300),
    rating: z.number().int().min(1).max(5).default(5),
    order,
  }),
});

export const collections = { site, services, team, gallery, brands, reviews };
