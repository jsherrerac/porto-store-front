import {Await, Link, useLocation} from 'react-router';
import {Suspense, useId} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {CartMain} from '~/components/CartMain';
import {Cursor} from '~/components/Cursor';
import {Footer} from '~/components/Footer';
import {Header, NavLinks} from '~/components/Header';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {SmoothScroll} from '~/components/SmoothScroll';
import {WhatsAppButton} from '~/components/WhatsAppButton';
import {FOOTER_LINKS} from '~/config/site';
import {buildWhatsAppUrl} from '~/lib/whatsapp';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  whatsappNumber: string | null;
  children?: React.ReactNode;
}

/**
 * El marco que comparten todas las páginas: header, paneles laterales,
 * contenido, footer y los comportamientos globales (scroll suave, cursor).
 */
export function PageLayout({
  cart,
  children = null,
  whatsappNumber,
}: PageLayoutProps) {
  const {pathname} = useLocation();
  const isHome = pathname === '/';
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, 'Hola PORTO, tengo una pregunta.')
    : null;

  return (
    <Aside.Provider>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <SmoothScroll />
      <Cursor />
      <CartAside cart={cart} />
      <SearchAside />
      <MenuAside />
      <Header cart={cart} overlay={isHome} />
      {/* En la home el contenido empieza debajo del header transparente. */}
      <main id="contenido" className={isHome ? 'main main--flush' : 'main'}>
        {children}
      </main>
      <Footer whatsappUrl={whatsappUrl} />
      {whatsappUrl && <WhatsAppButton href={whatsappUrl} />}
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="Carrito">
      <Suspense fallback={<p>Cargando el carrito…</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function MenuAside() {
  return (
    <Aside type="mobile" heading="Menú">
      <nav className="menu-list" aria-label="Menú">
        <NavLinks />
        {FOOTER_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="nav-link">
            {link.label}
          </Link>
        ))}
      </nav>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="Buscar">
      <div className="predictive-search">
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <label className="sr-only" htmlFor="busqueda-rapida">
                Qué estás buscando
              </label>
              <input
                id="busqueda-rapida"
                className="field"
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Camiseta, hoodie, pantalón…"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              <button type="button" className="button" onClick={goToSearch}>
                Buscar
              </button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {collections, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <p>Buscando…</p>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    className="text-button"
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(term.current)}`}
                  >
                    Ver todos los resultados de “{term.current}”
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}
