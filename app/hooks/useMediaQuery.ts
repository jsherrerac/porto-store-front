import {useCallback, useSyncExternalStore} from 'react';

/**
 * Lee una media query de CSS desde React y se actualiza cuando cambia.
 *
 * En el servidor no existe `window`, así que ahí siempre devuelve `false`;
 * useSyncExternalStore se encarga de re-renderizar con el valor real en el
 * navegador sin provocar un error de hidratación.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** true cuando la persona pidió menos movimiento en su sistema operativo. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** true en equipos con mouse o trackpad (no en pantallas táctiles). */
export function useFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
