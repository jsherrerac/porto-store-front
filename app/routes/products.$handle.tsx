import {Suspense} from 'react';
import {Await, useLoaderData, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  Analytics,
  getAdjacentAndFirstAvailableVariants,
  getProductOptions,
  getSelectedProductOptions,
  useOptimisticVariant,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductCard} from '~/components/ProductCard';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/product/ProductForm';
import {ProductGallery} from '~/components/product/ProductGallery';
import {SITE} from '~/config/site';
import {PRODUCT_CARD_FRAGMENT} from '~/lib/fragments';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {buildWhatsAppUrl} from '~/lib/whatsapp';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({data}) => {
  if (!data) return [{title: SITE.name}];
  const {product} = data;
  return [
    {title: product.title + ' — ' + SITE.name},
    {name: 'description', content: product.description.slice(0, 155)},
    {property: 'og:title', content: product.title},
    {property: 'og:image', content: product.images.nodes[0]?.url},
    {rel: 'canonical', href: '/products/' + product.handle},
  ];
};

/**
 * Dos tipos de datos con dos prioridades:
 * - El producto es crítico: sin él no hay página, así que se espera (await).
 * - Las recomendaciones van debajo del pliegue: viajan como promesa y llegan
 *   después por streaming, sin retrasar el primer pintado.
 */
export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Response('Falta el producto', {status: 400});
  }

  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions: getSelectedProductOptions(request)},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const recommended = storefront
    .query(RECOMMENDED_QUERY, {
      variables: {productId: product.id},
      cache: storefront.CacheLong(),
    })
    // Si falla, la página igual se muestra: solo falta esa sección.
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {product, recommended};
}

export default function Product() {
  const {product, recommended} = useLoaderData<typeof loader>();
  const whatsappNumber = useRouteLoaderData<RootLoader>('root')?.whatsappNumber;

  // Al hacer clic en una talla, la UI cambia de variante al instante, antes
  // de que termine la navegación (variante "optimista").
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Si la URL llegó sin opciones, se completan con la variante elegida.
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  // La foto de la variante (p. ej. el color elegido) va primero.
  const variantImage = selectedVariant.image;
  const images = variantImage
    ? [
        variantImage,
        ...product.images.nodes.filter((image) => image.url !== variantImage.url),
      ]
    : product.images.nodes;

  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(
        whatsappNumber,
        'Hola PORTO, tengo una pregunta sobre ' +
          product.title +
          ' (' +
          selectedVariant.title +
          ').',
      )
    : null;

  return (
    <>
      <div className="pdp">
        <ProductGallery images={images} title={product.title} />

        <div className="pdp__buy">
          <h1 className="pdp__title">{product.title}</h1>
          <ProductPrice
            price={selectedVariant.price}
            compareAtPrice={selectedVariant.compareAtPrice}
          />
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
          {whatsappUrl && (
            <a
              className="text-link pdp__ask"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preguntar por esta prenda en WhatsApp
            </a>
          )}
          {product.descriptionHtml && (
            <div className="pdp__description">
              <h2 className="pdp__subtitle">Descripción</h2>
              {/* HTML que viene del admin de Shopify, no de usuarios. */}
              <div dangerouslySetInnerHTML={{__html: product.descriptionHtml}} />
            </div>
          )}
          <ul className="pdp__perks">
            <li>Pago seguro en el checkout de Shopify.</li>
            <li>Cambios de talla durante 30 días.</li>
          </ul>
        </div>
      </div>

      <Suspense fallback={null}>
        <Await resolve={recommended}>
          {(data) =>
            data && data.productRecommendations?.length ? (
              <section className="related" aria-labelledby="related-title">
                <h2 id="related-title" className="section-title">
                  También te puede gustar
                </h2>
                <div className="product-grid">
                  {data.productRecommendations.slice(0, 4).map((item) => (
                    <ProductCard key={item.id} product={item} loading="lazy" />
                  ))}
                </div>
              </section>
            ) : null
          }
        </Await>
      </Suspense>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant.price.amount,
              vendor: product.vendor,
              variantId: selectedVariant.id,
              variantTitle: selectedVariant.title,
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 8) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_QUERY = `#graphql
  query Recommended(
    $country: CountryCode
    $language: LanguageCode
    $productId: ID!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      ...ProductCard
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
