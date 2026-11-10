/**
 * Variables de entorno propias del proyecto (las de Hydrogen ya vienen
 * tipadas). En local salen de `.env`; en producción, de Oxygen.
 * Solo las que empiezan por PUBLIC_ pueden llegar al navegador.
 */
export type Env = {
  /** Llave de Resend para enviar el correo de contacto. Solo servidor. */
  RESEND_API_KEY?: string;
  /** Buzón que recibe los mensajes del formulario. Solo servidor. */
  CONTACT_EMAIL?: string;
  /** Número de WhatsApp con indicativo de país, solo dígitos (57300...). */
  PUBLIC_WHATSAPP_NUMBER?: string;
};
