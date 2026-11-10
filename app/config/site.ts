/**
 * Datos fijos de la tienda. Lo que cambia según el entorno (número de
 * WhatsApp, correo de contacto) vive en variables de entorno, no aquí.
 */
export const SITE = {
  name: 'PORTO',
  tagline: 'Ropa esencial hecha para durar.',
  description:
    'PORTO es una tienda de ropa esencial: pocas prendas, buenas telas y cortes que no pasan de moda.',
  author: {
    name: 'Sebastián Herrera',
    url: 'https://github.com/jsherrerac',
  },
} as const;

export type NavLink = {label: string; to: string};

export const NAV_LINKS: NavLink[] = [
  {label: 'Hombre', to: '/collections/men'},
  {label: 'Mujer', to: '/collections/women'},
  {label: 'Unisex', to: '/collections/unisex'},
  {label: 'Novedades', to: '/collections/all?orden=recientes'},
];

export const FOOTER_LINKS: NavLink[] = [
  {label: 'Todo el catálogo', to: '/collections/all'},
  {label: 'Colecciones', to: '/collections'},
  {label: 'Contacto', to: '/contacto'},
  {label: 'Políticas', to: '/policies'},
];

/**
 * El catálogo de mock.shop viene en inglés. Aquí se traducen los nombres de
 * las colecciones que conocemos; las demás muestran el título que mande la API.
 */
const COLLECTION_LABELS: Record<string, string> = {
  men: 'Hombre',
  women: 'Mujer',
  unisex: 'Unisex',
  tops: 'Partes de arriba',
  bottoms: 'Pantalones',
  accessories: 'Accesorios',
  shoes: 'Calzado',
  featured: 'Destacados',
};

export function collectionLabel(handle: string, fallback: string): string {
  return COLLECTION_LABELS[handle] ?? fallback;
}
