import { normalizeMxPhone } from './phone';

// Construye el enlace de WhatsApp (wa.me) con mensaje prellenado opcional
export function whatsappUrl(phone: string, message?: string): string {
  const base = `https://wa.me/52${normalizeMxPhone(phone)}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// Mensaje de reserva; si hay servicio, se agrega al final
export function bookingMessage(baseMessage: string, serviceName?: string): string {
  const base = baseMessage.trim();
  return serviceName ? `${base} Me interesa: ${serviceName}.` : base;
}
