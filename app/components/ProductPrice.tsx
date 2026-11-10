import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

/** Precio, con el precio anterior tachado cuando hay rebaja. */
export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  if (!price) return null;

  const onSale =
    compareAtPrice && Number(compareAtPrice.amount) > Number(price.amount);

  return (
    <div className="price">
      <Money as="span" data={price} />
      {onSale && (
        <s className="price__before">
          <span className="sr-only">Antes: </span>
          <Money as="span" data={compareAtPrice} />
        </s>
      )}
    </div>
  );
}
