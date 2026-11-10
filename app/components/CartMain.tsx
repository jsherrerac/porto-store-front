import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

/** Agrupa las líneas hijas (p. ej. un empaque de regalo) bajo su línea padre. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

/**
 * El carrito. Lo usan el panel lateral y la página /cart.
 *
 * useOptimisticCart aplica al instante las acciones pendientes (agregar,
 * quitar, cambiar cantidad) sin esperar la respuesta del servidor.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const lines = cart?.lines?.nodes ?? [];
  const hasItems = (cart?.totalQuantity ?? 0) > 0;
  const childrenMap = getLineItemChildrenMap(lines);

  if (lines.length === 0) {
    return <CartEmpty />;
  }

  return (
    <section
      className={'cart cart--' + layout}
      aria-label={layout === 'page' ? 'Carrito' : 'Panel del carrito'}
    >
      <ul className="cart__lines">
        {lines.map((line) => {
          // Las líneas hijas se pintan dentro de su línea padre.
          if ('parentRelationship' in line && line.parentRelationship?.parent) {
            return null;
          }
          return (
            <CartLineItem
              key={line.id}
              line={line}
              layout={layout}
              childrenMap={childrenMap}
            />
          );
        })}
      </ul>
      {hasItems && <CartSummary cart={cart} />}
    </section>
  );
}

function CartEmpty() {
  const {close} = useAside();
  return (
    <div className="cart-empty">
      <p>Tu carrito está vacío.</p>
      <Link
        className="button"
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
      >
        Ver el catálogo
      </Link>
    </div>
  );
}
