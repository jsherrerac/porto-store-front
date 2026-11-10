import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

/**
 * Paginación por cursores de la Storefront API ("ver más"), no por número de
 * página: Shopify devuelve un cursor y con él se pide el siguiente bloque.
 * <Pagination> de Hydrogen guarda los bloques ya cargados al navegar.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink}) => (
        <div className="paginated">
          <PreviousLink className="button button--ghost paginated__link">
            {isLoading ? 'Cargando…' : 'Ver las anteriores'}
          </PreviousLink>
          <div className={resourcesClassName}>
            {nodes.map((node, index) => children({node, index}))}
          </div>
          <NextLink className="button button--ghost paginated__link">
            {isLoading ? 'Cargando…' : 'Ver más prendas'}
          </NextLink>
        </div>
      )}
    </Pagination>
  );
}
