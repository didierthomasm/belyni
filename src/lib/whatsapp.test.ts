import { describe, expect, it } from 'vitest';
import { bookingMessage, whatsappUrl } from './whatsapp';

describe('whatsappUrl', () => {
  it('builds a wa.me link with country code and no text', () => {
    expect(whatsappUrl('(229) 225-8060')).toBe('https://wa.me/522292258060');
  });

  it('URL-encodes Spanish characters, ampersands and emoji', () => {
    const url = whatsappUrl('2292258060', 'Hola, quiero: Uñas & pestañas 💅');
    expect(url).toBe(
      'https://wa.me/522292258060?text=Hola%2C%20quiero%3A%20U%C3%B1as%20%26%20pesta%C3%B1as%20%F0%9F%92%85',
    );
    expect(decodeURIComponent(new URL(url).searchParams.get('text') ?? '')).toBe(
      'Hola, quiero: Uñas & pestañas 💅',
    );
  });

  it('omits text when message is blank', () => {
    expect(whatsappUrl('2292258060', '   ')).toBe('https://wa.me/522292258060');
  });

  it('throws on an invalid phone instead of building a broken link', () => {
    expect(() => whatsappUrl('123')).toThrow(/Número de teléfono inválido/);
  });
});

describe('bookingMessage', () => {
  it('returns the base message when there is no service', () => {
    expect(bookingMessage('  Hola, quiero agendar una cita. ')).toBe('Hola, quiero agendar una cita.');
  });
  it('appends the service name', () => {
    expect(bookingMessage('Hola, quiero agendar una cita.', 'Corte Dama')).toBe(
      'Hola, quiero agendar una cita. Me interesa: Corte Dama.',
    );
  });
});
