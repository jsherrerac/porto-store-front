import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {COLLECTION_TILE_FRAGMENT} from '~/components/CollectionTile';
import {Departments} from '~/components/home/Departments';
import {Essentials} from '~/components/home/Essentials';
import {HeroStage} from '~/components/home/HeroStage';
import {Manifesto} from '~/components/home/Manifesto';
import {ProductRail} from '~/components/home/ProductRail';
import {SITE} from '~/config/site';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';

export const meta: Route.MetaFunction = () => [
  {title: SITE.name + ' — ' + SITE.tagline},
  {name: 'description', content: SITE.description},
];

/**
 * Todo lo que necesita la home sale de UNA consulta GraphQL. Los alias
 * (featured:, men:, women:...) permiten pedir el mismo campo varias veces
 * con argumentos distintos en una sola ida a Shopify.
 */
export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;
  const data = await storefront.query(HOME_QUERY, {
    // La portada cambia poco: un minuto de caché y luego se revalida en
    // segundo plano (stale-while-revalidate) sin hacer esperar a nadie.
    cache: storefront.CacheShort(),
  });

  const featured = data.featured?.products.nodes ?? [];
  return {
    products: featured.length > 0 ? featured : data.latest.nodes,
    departments: [data.men, data.women, data.unisex].filter(
      (collection) => collection != null,
    ),
  };
}

export default function Homepage() {
  const {products, departments} = useLoaderData<typeof loader>();

  return (
    <>
      <HeroStage />
      <Manifesto />
      <ProductRail products={products} />
      <Departments collections={departments} />
      <Essentials />
      <section className="closing" aria-labelledby="closing-title">
        <h2 id="closing-title" className="closing__title">
          ¿Dudas con la talla?
        </h2>
        <p className="closing__text">
          Te ayudamos a escoger antes de comprar.
        </p>
        <Link className="button" to="/contacto">
          Escríbenos
        </Link>
      </section>
    </>
  );
}

const HOME_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  ${COLLECTION_TILE_FRAGMENT}
  query Home($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    featured: collection(handle: "featured") {
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    latest: products(first: 8, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCard
      }
    }
    men: collection(handle: "men") {
      ...CollectionTile
    }
    women: collection(handle: "women") {
      ...CollectionTile
    }
    unisex: collection(handle: "unisex") {
      ...CollectionTile
    }
  }
` as const;
