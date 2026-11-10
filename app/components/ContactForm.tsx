import {useFetcher} from 'react-router';
import type {ContactErrors} from '~/lib/contact';
import {MESSAGE_MAX_LENGTH} from '~/lib/contact';

type ContactResult = {ok: true} | {ok: false; errors: ContactErrors};

/**
 * Formulario de contacto. useFetcher lo envía al action de /api/send-email
 * sin cambiar de página. Si JavaScript no cargó, el <form> se envía igual,
 * como un formulario HTML normal.
 */
export function ContactForm() {
  const fetcher = useFetcher<ContactResult>();
  const result = fetcher.data;
  const sending = fetcher.state !== 'idle';
  const errors = result && !result.ok ? result.errors : {};

  if (result?.ok) {
    return (
      <p className="contact__done" role="status">
        Mensaje enviado. Te respondemos al correo que dejaste.
      </p>
    );
  }

  return (
    <fetcher.Form
      method="post"
      action="/api/send-email"
      className="contact__form"
      noValidate
    >
      <div className="field-group">
        <label htmlFor="contact-email">Tu correo</label>
        <input
          id="contact-email"
          className="field"
          type="email"
          name="email"
          autoComplete="email"
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
        />
        {errors.email && (
          <p id="contact-email-error" className="field-error">
            {errors.email}
          </p>
        )}
      </div>

      <div className="field-group">
        <label htmlFor="contact-message">Mensaje</label>
        <textarea
          id="contact-message"
          className="field"
          name="message"
          rows={5}
          maxLength={MESSAGE_MAX_LENGTH}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            errors.message ? 'contact-message-error' : undefined
          }
        />
        {errors.message && (
          <p id="contact-message-error" className="field-error">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" className="button" disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </fetcher.Form>
  );
}
