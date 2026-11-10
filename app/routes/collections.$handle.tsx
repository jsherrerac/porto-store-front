import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import type {ProductCardFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductCard} from '~/components/ProductCard';
import {SortLinks} from '~/components/SortLinks';
import {collectionLabel, SITE} from '~/config/site';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {parseSort, SORT_PARAM, toCollectionSort} from '~/lib/sort';

export const meta: Route.MetaFunction = ({data}) => {
  const label = data
    ? collectionLabel(data.collection.handle, data.collection.title)
    : 'Colección';
  return [
    {title: label + ' — ' + SITE.name},
    {name: 'description', content: 'Ropa de ' + label + ' en ' + SITE.name + '.'},
  ];
};

/**
 * Corre en el servidor en cada visita a /collections/<handle>.
 * Lee el handle de la ruta y el orden de la query (?orden=...), y le pide a
 * Shopify exactamente esa página de productos ya ordenada.
 */
export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const sort = parseSort(new URL(request.url).searchParams.get(SORT_PARAM));
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...toCollectionSort(sort), ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  // El handle puede venir traducido por Shopify: se redirige al canónico.
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {collection, sort};
}

export default function Collection() {
  const {collection, sort} = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">
          {collectionLabel(collection.handle, collection.title)}
        </h1>
        <SortLinks current={sort} />
      </header>

      <PaginatedResourceSection<ProductCardFragment>
        connection={collection.products}
        resourcesClassName="product-grid"
      >
        {({node: product, index}) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={index < 4 ? 'eager' : 'lazy'}
          />
        )}
      </PaginatedResourceSection>

      <Analytics.CollectionView
        data={{collection: {id: collection.id, handle: collection.handle}}}
      />
    </div>
  );
}

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
