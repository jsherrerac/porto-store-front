import {Link} from 'react-router';
import {FOOTER_LINKS, NAV_LINKS, SITE} from '~/config/site';

export function Footer({whatsappUrl}: {whatsappUrl: string | null}) {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__intro">
          <p className="site-footer__brand">{SITE.name}</p>
          <p>{SITE.tagline}</p>
        </div>

        <nav aria-label="Tienda">
          <h2 className="site-footer__heading">Tienda</h2>
          <ul className="site-footer__list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} prefetch="intent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Ayuda">
          <h2 className="site-footer__heading">Ayuda</h2>
          <ul className="site-footer__list">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} prefetch="intent">
                  {link.label}
                </Link>
              </li>
            ))}
            {whatsappUrl && (
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="site-footer__legal">
        <p>
          Tienda de demostración: el catálogo viene de mock.shop y no se
          procesan pedidos reales.
        </p>
        <p>
          Diseño y desarrollo:{' '}
          <a href={SITE.author.url} target="_blank" rel="noopener noreferrer">
            {SITE.author.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
