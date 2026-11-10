import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections._index';
import {
  COLLECTION_TILE_FRAGMENT,
  CollectionTile,
} from '~/components/CollectionTile';
import {SITE} from '~/config/site';

export const meta: Route.MetaFunction = () => [
  {title: 'Colecciones — ' + SITE.name},
];

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;
  // La lista de colecciones casi nunca cambia: se guarda en caché una hora
  // (CacheLong) y la mayoría de visitas ni siquiera llegan a Shopify.
  const {collections} = await storefront.query(COLLECTIONS_QUERY, {
    cache: storefront.CacheLong(),
  });
  return {collections: collections.nodes};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Colecciones</h1>
      </header>
      <div className="tile-grid">
        {collections.map((collection, index) => (
          <CollectionTile
            key={collection.id}
            collection={collection}
            loading={index < 3 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  );
}

const COLLECTIONS_QUERY = `#graphql
  ${COLLECTION_TILE_FRAGMENT}
  query StoreCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 24) {
      nodes {
        ...CollectionTile
      }
    }
  }
` as const;
