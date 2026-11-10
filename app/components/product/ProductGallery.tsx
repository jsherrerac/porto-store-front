import {Image} from '@shopify/hydrogen';
import type {ProductQuery} from 'storefrontapi.generated';

type GalleryImage = NonNullable<
  ProductQuery['product']
>['images']['nodes'][number];

/**
 * Fotos del producto. En escritorio van apiladas junto a la columna de compra
 * (que se queda fija); en móvil son un carrusel con scroll-snap nativo, sin
 * JavaScript. La primera foto lleva el nombre de transición que comparte con
 * la tarjeta del catálogo (ver ProductCard).
 */
export function ProductGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  if (images.length === 0) {
    return <div className="gallery gallery--empty" aria-hidden="true" />;
  }

  return (
    <div className="gallery" role="group" aria-label={'Fotos de ' + title}>
      {images.map((image, index) => (
        <div
          key={image.id ?? image.url}
          className="gallery__item"
          style={index === 0 ? {viewTransitionName: 'product-image'} : undefined}
        >
          <Image
            alt={image.altText || title + ', foto ' + (index + 1)}
            aspectRatio="1/1"
            data={image}
            loading={index === 0 ? 'eager' : 'lazy'}
            sizes="(min-width: 64rem) 55vw, 100vw"
          />
        </div>
      ))}
    </div>
  );
}
