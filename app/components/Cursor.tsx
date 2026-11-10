import {useEffect, useRef} from 'react';
import {
  useFinePointer,
  usePrefersReducedMotion,
} from '~/hooks/useMediaQuery';
import {getMotion} from '~/lib/motion';

/**
 * Anillo que sigue al cursor y muestra una etiqueta sobre los elementos que
 * tengan `data-cursor="Texto"` (por ejemplo, "Ver" sobre una prenda).
 *
 * El cursor del sistema nunca se oculta: esto es un adorno, no un reemplazo.
 * Solo se monta con mouse o trackpad y sin "reducir movimiento".
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!enabled || !ring || !label) return;

    const {gsap} = getMotion();
    const moveX = gsap.quickTo(ring, 'x', {duration: 0.35, ease: 'power3'});
    const moveY = gsap.quickTo(ring, 'y', {duration: 0.35, ease: 'power3'});

    const onPointerMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      ring.classList.add('is-visible');
    };

    // Un solo listener en el documento (delegación) en vez de uno por tarjeta.
    const onPointerOver = (event: PointerEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest('[data-cursor]')
          : null;
      const text = target?.getAttribute('data-cursor') ?? '';
      label.textContent = text;
      ring.classList.toggle('has-label', text !== '');
    };

    const onLeaveWindow = () => ring.classList.remove('is-visible');

    window.addEventListener('pointermove', onPointerMove, {passive: true});
    document.addEventListener('pointerover', onPointerOver, {passive: true});
    document.documentElement.addEventListener('pointerleave', onLeaveWindow);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      document.documentElement.removeEventListener(
        'pointerleave',
        onLeaveWindow,
      );
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={ringRef} className="cursor-ring" aria-hidden="true">
      <span ref={labelRef} className="cursor-ring__label" />
    </div>
  );
}
