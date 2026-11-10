import {Link, useLocation} from 'react-router';
import {SORT_OPTIONS, SORT_PARAM, type SortValue} from '~/lib/sort';

/**
 * Orden del catálogo como enlaces normales: cada opción es una URL.
 * Funciona sin JavaScript, se puede compartir y respeta el botón Atrás.
 */
export function SortLinks({current}: {current: SortValue}) {
  const location = useLocation();

  return (
    <nav className="sort" aria-label="Ordenar productos">
      <span className="sort__label">Ordenar</span>
      <ul className="sort__list">
        {SORT_OPTIONS.map((option) => {
          const params = new URLSearchParams(location.search);
          params.set(SORT_PARAM, option.value);
          // Al cambiar el orden, la paginación vuelve a empezar.
          params.delete('cursor');
          params.delete('direction');

          return (
            <li key={option.value}>
              <Link
                className="sort__option"
                to={{pathname: location.pathname, search: params.toString()}}
                aria-current={option.value === current ? 'true' : undefined}
                preventScrollReset
                replace
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
