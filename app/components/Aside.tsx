import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useLocation} from 'react-router';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * Panel lateral con fondo oscurecido: lo usan el carrito, la búsqueda y el
 * menú móvil. Solo uno puede estar abierto a la vez (lo decide el Provider).
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: ReactNode;
  type: AsideType;
  heading: ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) return;

    // Accesibilidad: al abrir, el foco entra al panel; al cerrar, vuelve al
    // botón que lo abrió. Escape cierra.
    const opener = document.activeElement;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [close, expanded]);

  return (
    <div
      className={expanded ? 'overlay is-open' : 'overlay'}
      aria-hidden={!expanded}
    >
      <button
        type="button"
        className="overlay__backdrop"
        onClick={close}
        aria-label="Cerrar"
        tabIndex={-1}
      />
      <aside
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <header className="panel__header">
          <h2 className="panel__title" id={id}>
            {heading}
          </h2>
          <button type="button" className="text-button" onClick={close}>
            Cerrar
          </button>
        </header>
        {/* data-lenis-prevent: el scroll de adentro es nativo, no el suave */}
        <div className="panel__body" data-lenis-prevent>
          {children}
        </div>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const location = useLocation();

  // close/open deben conservar su identidad entre renders: varios efectos
  // dependen de ellas y se volverían a ejecutar sin necesidad.
  const close = useCallback(() => setType('closed'), []);
  const open = useCallback((mode: AsideType) => setType(mode), []);

  // Al navegar a otra página, el panel se cierra solo.
  useEffect(() => {
    setType('closed');
  }, [location.pathname, location.search]);

  // Con un panel abierto, la página de atrás no debe moverse.
  useEffect(() => {
    document.documentElement.classList.toggle('has-overlay', type !== 'closed');
    return () => document.documentElement.classList.remove('has-overlay');
  }, [type]);

  const value = useMemo(() => ({type, open, close}), [type, open, close]);

  return (
    <AsideContext.Provider value={value}>{children}</AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
