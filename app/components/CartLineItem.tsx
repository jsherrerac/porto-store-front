import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/** Una línea del carrito: foto, nombre, variante, precio y cantidad. */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];

  // Shopify llama "Default Title" a la variante de un producto sin opciones.
  const options = selectedOptions.filter(
    (option) => option.value !== 'Default Title',
  );

  return (
    <li className="cart-line">
      <div className="cart-line__media">
        {image && (
          <Image
            alt={title}
            aspectRatio="1/1"
            data={image}
            loading="lazy"
            sizes="96px"
            width={96}
            height={96}
          />
        )}
      </div>

      <div className="cart-line__body">
        <Link
          className="cart-line__title"
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') close();
          }}
        >
          {product.title}
        </Link>
        {options.length > 0 && (
          <p className="cart-line__options">
            {options.map((option) => option.value).join(', ')}
          </p>
        )}
        <CartLineQuantity line={line} />
      </div>

      <ProductPrice price={line?.cost?.totalAmount} />

      {lineItemChildren ? (
        <ul className="cart-line__children">
          {lineItemChildren.map((childLine) => (
            <CartLineItem
              childrenMap={childrenMap}
              key={childLine.id}
              line={childLine}
              layout={layout}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Controles de cantidad. Se desactivan mientras la línea es "optimista":
 * existe en pantalla, pero el servidor todavía no confirmó que se agregó.
 */
function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Math.max(0, quantity - 1);
  const nextQuantity = quantity + 1;

  return (
    <div className="quantity">
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          type="submit"
          className="quantity__step"
          aria-label="Quitar una unidad"
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
        >
          &#8722;
        </button>
      </CartLineUpdateButton>
      <span className="quantity__value" aria-label={'Cantidad: ' + quantity}>
        {quantity}
      </span>
      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          type="submit"
          className="quantity__step"
          aria-label="Agregar una unidad"
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
        >
          &#43;
        </button>
      </CartLineUpdateButton>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button className="text-button" disabled={disabled} type="submit">
        Quitar
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * Todas las acciones sobre una misma línea comparten esta llave. Si alguien
 * hace clic en + y − muy rápido, la última petición cancela a la anterior
 * en vez de competir con ella.
 */
function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
