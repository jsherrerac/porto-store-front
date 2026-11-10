/**
 * Validación del formulario de contacto. Corre en el servidor (la del
 * navegador es solo una ayuda): nunca se confía en lo que llega del cliente.
 */
export type ContactFields = {email: string; message: string};
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;

export type ContactValidation =
  | {ok: true; data: ContactFields}
  | {ok: false; errors: ContactErrors};

export const MESSAGE_MAX_LENGTH = 2000;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateContact(input: {
  email: unknown;
  message: unknown;
}): ContactValidation {
  const email = asText(input.email);
  const message = asText(input.message);
  const errors: ContactErrors = {};

  if (!email) {
    errors.email = 'Escribe tu correo para poder responderte.';
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Ese correo no parece válido. Revísalo.';
  }

  if (!message) {
    errors.message = 'Escribe tu mensaje.';
  } else if (message.length > MESSAGE_MAX_LENGTH) {
    errors.message =
      'El mensaje es muy largo: máximo ' + MESSAGE_MAX_LENGTH + ' caracteres.';
  }

  if (Object.keys(errors).length > 0) return {ok: false, errors};
  return {ok: true, data: {email, message}};
}

/**
 * Un salto de línea dentro de un encabezado de correo permite inyectar
 * encabezados nuevos. El asunto solo puede ocupar una línea.
 */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}
