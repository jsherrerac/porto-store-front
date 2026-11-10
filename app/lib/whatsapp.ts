/**
 * Enlaces "click to chat" de WhatsApp (https://wa.me/<número>?text=<mensaje>).
 * Es el mecanismo oficial y no necesita API ni backend: abre el chat con el
 * mensaje ya escrito y la persona decide si lo envía.
 */

/** Deja solo los dígitos. Devuelve null si no parece un número internacional. */
export function normalizeWhatsAppNumber(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  // E.164 permite hasta 15 dígitos; menos de 8 no alcanza para país + número.
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function buildWhatsAppUrl(number: string, message?: string): string {
  const base = 'https://wa.me/' + number;
  const text = message?.trim();
  return text ? base + '?text=' + encodeURIComponent(text) : base;
}
