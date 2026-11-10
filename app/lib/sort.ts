import type {
  ProductCollectionSortKeys,
  ProductSortKeys,
} from '@shopify/hydrogen/storefront-api-types';

/**
 * El orden del catálogo vive en la URL (?orden=precio-asc). Así se puede
 * compartir el enlace, funciona el botón Atrás y el servidor ya sabe qué
 * pedirle a Shopify sin esperar a JavaScript.
 */
export const SORT_OPTIONS = [
  {value: 'destacados', label: 'Destacados'},
  {value: 'recientes', label: 'Novedades'},
  {value: 'precio-asc', label: 'Precio: menor a mayor'},
  {value: 'precio-desc', label: 'Precio: mayor a menor'},
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const DEFAULT_SORT: SortValue = 'destacados';
export const SORT_PARAM = 'orden';

/** Cualquier valor que no conozcamos cae en el orden por defecto. */
export function parseSort(param: string | null | undefined): SortValue {
  const match = SORT_OPTIONS.find((option) => option.value === param);
  return match ? match.value : DEFAULT_SORT;
}

/** Orden para la consulta `products` (todo el catálogo). */
export function toProductSort(sort: SortValue): {
  sortKey: ProductSortKeys;
  reverse: boolean;
} {
  switch (sort) {
    case 'recientes':
      return {sortKey: 'CREATED_AT', reverse: true};
    case 'precio-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'precio-desc':
      return {sortKey: 'PRICE', reverse: true};
    default:
      return {sortKey: 'BEST_SELLING', reverse: false};
  }
}

/** Orden para `collection.products`: Shopify usa otro enum aquí. */
export function toCollectionSort(sort: SortValue): {
  sortKey: ProductCollectionSortKeys;
  reverse: boolean;
} {
  switch (sort) {
    case 'recientes':
      return {sortKey: 'CREATED', reverse: true};
    case 'precio-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'precio-desc':
      return {sortKey: 'PRICE', reverse: true};
    default:
      return {sortKey: 'COLLECTION_DEFAULT', reverse: false};
  }
}
