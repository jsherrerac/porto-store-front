import type {CollectionTileFragment} from 'storefrontapi.generated';
import {CollectionTile} from '~/components/CollectionTile';

/** Las tres entradas grandes al catálogo: Hombre, Mujer, Unisex. */
export function Departments({
  collections,
}: {
  collections: CollectionTileFragment[];
}) {
  if (collections.length === 0) return null;
  return (
    <section className="departments" aria-labelledby="departments-title">
      <h2 id="departments-title" className="section-title">
        Compra por línea
      </h2>
      <div className="tile-grid tile-grid--three">
        {collections.map((collection) => (
          <CollectionTile
            key={collection.id}
            collection={collection}
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
