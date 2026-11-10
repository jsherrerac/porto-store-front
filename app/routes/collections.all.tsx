import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {ProductCardFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductCard} from '~/components/ProductCard';
import {SortLinks} from '~/components/SortLinks';
import {SITE} from '~/config/site';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {parseSort, SORT_PARAM, toProductSort} from '~/lib/sort';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.sort === 'recientes' ? 'Novedades' : 'Todo el catálogo';
  return [
    {title: title + ' — ' + SITE.name},
    {name: 'description', content: 'Todas las prendas de ' + SITE.name + '.'},
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  const sort = parseSort(new URL(request.url).searchParams.get(SORT_PARAM));
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  const {products} = await context.storefront.query(CATALOG_QUERY, {
    variables: {...toProductSort(sort), ...paginationVariables},
  });

  return {products, sort};
}

export default function Catalog() {
  const {products, sort} = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">
          {sort === 'recientes' ? 'Novedades' : 'Todo el catálogo'}
        </h1>
        <SortLinks current={sort} />
      </header>

      <PaginatedResourceSection<ProductCardFragment>
        connection={products}
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
    </div>
  );
}

const CATALOG_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
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
        startCursor
        endCursor
      }
    }
  }
` as const;
