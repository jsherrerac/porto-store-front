import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Link,
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import tokenStyles from '~/styles/tokens.css?url';
import appStyles from '~/styles/app.css?url';
import {PageLayout} from './components/PageLayout';
import {SITE} from './config/site';
import {normalizeWhatsAppNumber} from './lib/whatsapp';

export type RootLoader = typeof loader;

/**
 * El loader raíz corre en cada navegación. Solo se vuelve a ejecutar cuando
 * hubo una mutación (por ejemplo, agregar al carrito) o una recarga manual:
 * así se evita repetir sus consultas en cada cambio de página.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    // La fuente se usa arriba del todo: precargarla evita el salto de texto.
    {
      rel: 'preload',
      href: '/fonts/archivo-latin-wdth.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous' as const,
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export const meta: Route.MetaFunction = () => [
  {title: SITE.name + ' — ' + SITE.tagline},
  {name: 'description', content: SITE.description},
];

export async function loader({context}: Route.LoaderArgs) {
  const {storefront, env, cart} = context;

  return {
    // Sin await: el carrito viaja como promesa y la página no lo espera
    // para empezar a pintarse (streaming). El header lo resuelve con <Await>.
    cart: cart.get(),
    whatsappNumber: normalizeWhatsAppNumber(env.PUBLIC_WHATSAPP_NUMBER),
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  };
}

/**
 * Layout envuelve tanto a la app como al ErrorBoundary. Por eso el marco de
 * la tienda (header, carrito, footer) vive aquí: un 404 sigue teniendo
 * navegación en vez de quedar como una página suelta.
 */
export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        {/* Las hojas de estilo van aquí y no en links() por un bug de HMR
            de React Router al editar y navegar en desarrollo. */}
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={tokenStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <PageLayout cart={data.cart} whatsappNumber={data.whatsappNumber}>
              {children}
            </PageLayout>
          </Analytics.Provider>
        ) : (
          // Si falló el propio loader raíz no hay datos para el marco.
          children
        )}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  // En producción no se muestra el detalle técnico del error al visitante.
  if (!notFound) console.error(error);

  return (
    <div className="error-page">
      <p className="error-page__code">
        {isRouteErrorResponse(error) ? error.status : 500}
      </p>
      <h1 className="error-page__title">
        {notFound ? 'Esta página no existe' : 'Algo falló de nuestro lado'}
      </h1>
      <p>
        {notFound
          ? 'Puede que el enlace esté mal escrito o que la prenda ya no esté.'
          : 'Vuelve a intentarlo en un momento.'}
      </p>
      <Link className="button" to="/collections/all">
        Ver el catálogo
      </Link>
    </div>
  );
}
