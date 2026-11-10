import {useRouteLoaderData} from 'react-router';
import type {Route} from './+types/contacto';
import {ContactForm} from '~/components/ContactForm';
import {SITE} from '~/config/site';
import {buildWhatsAppUrl} from '~/lib/whatsapp';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = () => [
  {title: 'Contacto — ' + SITE.name},
  {name: 'description', content: 'Escríbenos y te respondemos por correo.'},
];

export default function Contacto() {
  const whatsappNumber = useRouteLoaderData<RootLoader>('root')?.whatsappNumber;

  return (
    <div className="page page--narrow contact">
      <h1 className="page__title">Contacto</h1>
      <p className="contact__lede">
        Tallas, envíos, cambios o lo que sea. Respondemos en uno o dos días
        hábiles.
      </p>
      <ContactForm />
      {whatsappNumber && (
        <p className="contact__alt">
          ¿Prefieres chat?{' '}
          <a
            className="text-link"
            href={buildWhatsAppUrl(whatsappNumber, 'Hola PORTO, tengo una pregunta.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      )}
    </div>
  );
}
