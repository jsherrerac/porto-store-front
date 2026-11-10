import {useEffect, useRef} from 'react';
import Lenis from 'lenis';
import {useAside} from '~/components/Aside';
import {usePrefersReducedMotion} from '~/hooks/useMediaQuery';
import {getMotion} from '~/lib/motion';

/**
 * Scroll suave para todo el sitio (Lenis), sincronizado con ScrollTrigger.
 *
 * - Lenis y GSAP comparten un solo reloj (gsap.ticker). Con dos relojes el
 *   scroll avanzaría dos veces por frame.
 * - Si la persona pidió menos movimiento, no se monta: queda el scroll nativo.
 * - No renderiza nada; solo existe por su efecto.
 */
export function SmoothScroll() {
  const reducedMotion = usePrefersReducedMotion();
  const {type} = useAside();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const {gsap, ScrollTrigger} = getMotion();
    const lenis = new Lenis({duration: 1.1, smoothWheel: true});
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    // gsap.ticker entrega segundos; Lenis espera milisegundos.
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      gsap.ticker.lagSmoothing(500, 33); // valores por defecto de GSAP
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // Con el carrito, la búsqueda o el menú abiertos, la página se queda quieta.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (type === 'closed') lenis.start();
    else lenis.stop();
  }, [type]);

  return null;
}
