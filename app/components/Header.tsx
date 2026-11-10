import {Suspense, useEffect, useState} from 'react';
import {Await, Link, useAsyncValue, useLocation} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {NAV_LINKS, SITE, type NavLink} from '~/config/site';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  /** En la home el header flota encima del escenario oscuro. */
  overlay: boolean;
}

export function Header({cart, overlay}: HeaderProps) {
  const {open} = useAside();
  const overDark = useOverDark(overlay);

  return (
    <header className="site-header" data-tone={overDark ? 'dark' : 'light'}>
      <Link
        to="/"
        className="site-header__brand"
        aria-label={SITE.name + ', ir al inicio'}
        prefetch="intent"
      >
        {SITE.name}
      </Link>

      <nav className="site-header__nav" aria-label="Principal">
        <NavLinks />
      </nav>

      <div className="site-header__actions">
        <button
          type="button"
          className="nav-link"
          onClick={() => open('search')}
        >
          Buscar
        </button>
        <CartToggle cart={cart} />
        <button
          type="button"
          className="nav-link site-header__menu"
          onClick={() => open('mobile')}
        >
          Menú
        </button>
      </div>
    </header>
  );
}

/** Los mismos enlaces sirven para el header y para el menú móvil. */
export function NavLinks() {
  const location = useLocation();
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          prefetch="intent"
          className="nav-link"
          aria-current={isCurrent(link, location) ? 'page' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

/**
 * NavLink de React Router solo compara la ruta. "Novedades" es la misma ruta
 * que el catálogo pero con ?orden=recientes, así que aquí también se compara
 * la query cuando el enlace trae una.
 */
function isCurrent(
  link: NavLink,
  location: {pathname: string; search: string},
): boolean {
  const [path, query] = link.to.split('?');
  if (location.pathname !== path) return false;
  if (!query) return true;

  const wanted = new URLSearchParams(query);
  const actual = new URLSearchParams(location.search);
  for (const [key, value] of wanted) {
    if (actual.get(key) !== value) return false;
  }
  return true;
}

/**
 * Devuelve true mientras la franja superior de la pantalla está sobre un
 * elemento marcado con `data-header-dark`. El header usa eso para pasar de
 * texto blanco transparente a fondo blanco con texto negro.
 */
function useOverDark(enabled: boolean): boolean {
  // El valor inicial coincide con lo que se ve al cargar la home, así el
  // HTML del servidor ya llega con el tono correcto y no hay parpadeo.
  const [overDark, setOverDark] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setOverDark(false);
      return;
    }
    const stage = document.querySelector('[data-header-dark]');
    if (!stage) {
      setOverDark(false);
      return;
    }
    // rootMargin recorta el área observada a una franja en el borde superior.
    const observer = new IntersectionObserver(
      ([entry]) => setOverDark(entry.isIntersecting),
      {rootMargin: '0px 0px -96% 0px'},
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [enabled]);

  return overDark;
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      className="nav-link"
      onClick={(event) => {
        // Sin JavaScript este enlace lleva a /cart; con JavaScript abre el panel.
        event.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Carrito{' '}
      <span className="cart-count" aria-label={count + ' productos'}>
        {count}
      </span>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  // useOptimisticCart suma lo que se acaba de agregar antes de que el
  // servidor responda: el contador cambia al instante.
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
