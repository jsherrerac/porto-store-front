import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useId} from 'react';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
};

/**
 * Totales y salida al pago. El checkout no se construye aquí: `checkoutUrl`
 * lleva al checkout alojado por Shopify, que es quien maneja tarjetas,
 * impuestos y envío.
 */
export function CartSummary({cart}: CartSummaryProps) {
  const codes =
    cart?.discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) ?? [];

  return (
    <div className="cart-summary">
      <dl className="cart-summary__row">
        <dt>Subtotal</dt>
        <dd>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money as="span" data={cart.cost.subtotalAmount} />
          ) : (
            '—'
          )}
        </dd>
      </dl>
      <p className="cart-summary__note">
        El envío y los impuestos se calculan en el pago.
      </p>

      <CartDiscount codes={codes} />

      {cart?.checkoutUrl && (
        <a className="button button--full" href={cart.checkoutUrl}>
          Finalizar compra
        </a>
      )}
    </div>
  );
}

function CartDiscount({codes}: {codes: string[]}) {
  const inputId = useId();

  return (
    <details className="cart-discount" open={codes.length > 0}>
      <summary>Tengo un código de descuento</summary>

      {codes.length > 0 && (
        <UpdateDiscountForm>
          <p className="cart-discount__applied">
            Aplicado: <strong>{codes.join(', ')}</strong>{' '}
            <button type="submit" className="text-button">
              Quitar
            </button>
          </p>
        </UpdateDiscountForm>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="cart-discount__form">
          <label htmlFor={inputId} className="sr-only">
            Código de descuento
          </label>
          <input
            id={inputId}
            className="field"
            type="text"
            name="discountCode"
            placeholder="Código"
            autoComplete="off"
          />
          <button type="submit" className="button button--ghost">
            Aplicar
          </button>
        </div>
      </UpdateDiscountForm>
    </details>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{discountCodes: discountCodes || []}}
    >
      {children}
    </CartForm>
  );
}
