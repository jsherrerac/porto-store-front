
import type { Route } from './+types/api.send-email';
import type { Env } from '../lib/env';

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Método no permitido' },
      { status: 405 },
    );
  }

  try {
    const body = await request.json() as {
      email: string;
      message: string;
    };

    const { email, message } = body;

    if (
      typeof email !== 'string' ||
      typeof message !== 'string' ||
      !email.trim() ||
      !message.trim()
    ) {
      return Response.json(
        { error: 'Datos inválidos' },
        { status: 400 },
      );
    }

    const env = (context as unknown as { env: Env }).env;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Porto Store <onboarding@resend.dev>',
        to: ['hrcorzosebas@gmail.com'],
        reply_to: email.trim(),
        subject: `Nuevo mensaje de Porto Store: ${email}`,
        text: `Correo: ${email}\n\nMensaje:\n${message}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error de Resend:', result);

      return Response.json(
        { error: 'No se pudo enviar el correo' },
        { status: 500 },
      );
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);

    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
