import {data, redirect} from 'react-router';
import type {Route} from './+types/api.send-email';
import {singleLine, validateContact} from '~/lib/contact';

/**
 * Endpoint del formulario de contacto. Corre solo en el servidor: aquí vive
 * la llave de Resend y aquí se decide a quién llega el correo.
 *
 * El destinatario NUNCA sale del formulario. Si lo decidiera quien escribe,
 * cualquiera podría usar esta ruta para mandar correos a terceros con
 * nuestra cuenta (un "open relay").
 */
export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();
  const validation = validateContact({
    email: form.get('email'),
    message: form.get('message'),
  });

  if (!validation.ok) {
    return data({ok: false as const, errors: validation.errors}, {status: 400});
  }

  const {RESEND_API_KEY, CONTACT_EMAIL} = context.env;
  if (!RESEND_API_KEY || !CONTACT_EMAIL) {
    console.error('Contact form: RESEND_API_KEY or CONTACT_EMAIL is not set');
    return data(
      {
        ok: false as const,
        errors: {message: 'El formulario no está disponible ahora mismo.'},
      },
      {status: 500},
    );
  }

  const {email, message} = validation.data;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'PORTO <onboarding@resend.dev>',
      to: [CONTACT_EMAIL],
      reply_to: email,
      subject: singleLine('Mensaje desde PORTO de ' + email),
      text: 'Correo: ' + email + '\n\n' + message,
    }),
  });

  if (!response.ok) {
    // Se registra el detalle para nosotros; al visitante, un mensaje claro.
    console.error('Resend error', response.status, await response.text());
    return data(
      {
        ok: false as const,
        errors: {message: 'No se pudo enviar. Intenta de nuevo en un momento.'},
      },
      {status: 502},
    );
  }

  return {ok: true as const};
}

// Abrir /api/send-email en el navegador (GET) lleva a la página de contacto.
export function loader() {
  return redirect('/contacto');
}
