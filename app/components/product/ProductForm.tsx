import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

/** Shopify manda los nombres de opción en inglés; aquí se muestran en español. */
const OPTION_LABELS: Record<string, string> = {
  Size: 'Talla',
  Color: 'Color',
};

/**
 * Selector de variantes (talla, color) y botón de compra.
 *
 * La variante elegida vive en la URL (?Size=M&Color=Black): elegir una opción
 * es navegar. Así el servidor renderiza la variante correcta, el enlace se
 * puede compartir y el botón Atrás funciona.
 */
export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductVariantFragment;
}) {
  const navigate = useNavigate();
  const {open} = useAside();

  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // Una opción con un solo valor no es una elección: no se muestra.
        if (option.optionValues.length === 1) return null;
        const label = OPTION_LABELS[option.name] ?? option.name;
        const selected = option.optionValues.find((value) => value.selected);

        return (
          <fieldset className="option" key={option.name}>
            <legend className="option__legend">
              {label}
              {selected && (
                <span className="option__current">{selected.name}</span>
              )}
            </legend>
            <div className="option__values">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected: isSelected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;
                const className =
                  'option__value' +
                  (swatch?.color ? ' option__value--swatch' : '') +
                  (available ? '' : ' is-unavailable');
                const content = swatch?.color ? (
                  <>
                    <span
                      className="option__swatch"
                      style={{backgroundColor: swatch.color}}
                    />
                    <span className="sr-only">{name}</span>
                  </>
                ) : (
                  name
                );

                // Algunas tiendas modelan cada color como un producto aparte:
                // entonces la opción es un enlace a otro producto.
                if (isDifferentProduct) {
                  return (
                    <Link
                      key={option.name + name}
                      className={className}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      aria-current={isSelected ? 'true' : undefined}
                      title={name}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    type="button"
                    key={option.name + name}
                    className={className}
                    aria-pressed={isSelected}
                    title={name}
                    disabled={!exists}
                    onClick={() => {
                      if (!isSelected) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => open('cart')}
        lines={
          selectedVariant
            ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Agregar al carrito' : 'Agotado'}
      </AddToCartButton>
    </div>
  );
}
