import {Link, useViewTransitionState} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {ProductCardFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

/**
 * Tarjeta de producto de todas las rejillas y del carrusel.
 *
 * `viewTransition` activa la View Transitions API al navegar: la foto de la
 * tarjeta y la foto grande de la página de producto comparten nombre de
 * transición, así que el navegador anima una hacia la otra. Donde la API no
 * existe, la navegación es la normal.
 */
export function ProductCard({
  product,
  loading,
  sizes = '(min-width: 64rem) 25vw, (min-width: 40rem) 33vw, 50vw',
}: {
  product: ProductCardFragment;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}) {
  const to = useVariantUrl(product.handle);
  const isTransitioning = useViewTransitionState(to);
  const [front, back] = product.images.nodes;
  const {minVariantPrice, maxVariantPrice} = product.priceRange;
  const hasRange = minVariantPrice.amount !== maxVariantPrice.amount;

  return (
    <Link
      className="product-card"
      to={to}
      prefetch="intent"
      viewTransition
      data-cursor="Ver"
    >
      <div
        className="product-card__media"
        style={
          isTransitioning ? {viewTransitionName: 'product-image'} : undefined
        }
      >
        {front && (
          <Image
            alt={front.altText || product.title}
            aspectRatio="1/1"
            data={front}
            loading={loading}
            sizes={sizes}
          />
        )}
        {back && (
          <Image
            className="product-card__alt"
            alt=""
            aria-hidden="true"
            aspectRatio="1/1"
            data={back}
            loading="lazy"
            sizes={sizes}
          />
        )}
      </div>
      <div className="product-card__info">
        <h3 className="product-card__title">{product.title}</h3>
        <p className="product-card__price">
          {hasRange && 'Desde '}
          <Money as="span" data={minVariantPrice} />
        </p>
      </div>
    </Link>
  );
}
