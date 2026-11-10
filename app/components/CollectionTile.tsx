import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {CollectionTileFragment} from 'storefrontapi.generated';
import {collectionLabel} from '~/config/site';

export const COLLECTION_TILE_FRAGMENT = `#graphql
  fragment CollectionTile on Collection {
    id
    handle
    title
    image {
      id
      url
      altText
      width
      height
    }
  }
` as const;

/** Enlace grande a una colección: foto y nombre. */
export function CollectionTile({
  collection,
  loading,
  sizes = '(min-width: 48rem) 33vw, 100vw',
}: {
  collection: CollectionTileFragment;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}) {
  const label = collectionLabel(collection.handle, collection.title);

  return (
    <Link
      className="tile"
      to={'/collections/' + collection.handle}
      prefetch="intent"
    >
      <div className="tile__media">
        {collection.image && (
          <Image
            alt=""
            aspectRatio="4/5"
            data={collection.image}
            loading={loading}
            sizes={sizes}
          />
        )}
      </div>
      <span className="tile__label">{label}</span>
    </Link>
  );
}
