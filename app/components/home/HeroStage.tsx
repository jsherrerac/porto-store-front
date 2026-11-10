import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {usePrefersReducedMotion} from '~/hooks/useMediaQuery';
import {getMotion} from '~/lib/motion';
import {SITE} from '~/config/site';

// lazy + import() parte Three.js en su propio archivo: solo lo descarga
// quien llega a la home, y nunca el servidor.
const ThreeScene = lazy(() => import('./ThreeScene'));

const CLAIMS = [
  'Pocas prendas. Las que te pones de verdad.',
  'Algodón pesado, costuras que aguantan años.',
  'Cortes que no dependen de la temporada.',
];

/**
 * Primera pantalla: se queda fija (pin) mientras la persona scrollea el
 * equivalente a dos pantallas. Ese recorrido mueve dos cosas a la vez:
 * la esfera (vía progressRef) y los textos (vía la línea de tiempo de GSAP).
 */
export function HeroStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  // La escena solo se monta en el cliente, después de hidratar.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const {gsap} = getMotion();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });
      // Los tiempos son "unidades" de la línea; el scrub los reparte en el scroll.
      tl.to('.hero__copy', {opacity: 0, y: -40, duration: 1}, 0.3);
      CLAIMS.forEach((_, i) => {
        const at = 1.2 + i * 1.3;
        const item = `.hero__claim:nth-child(${i + 1})`;
        tl.fromTo(item, {opacity: 0, y: 24}, {opacity: 1, y: 0, duration: 0.6}, at);
        tl.to(item, {opacity: 0, y: -24, duration: 0.6}, at + 0.9);
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={reducedMotion ? 'hero hero--static' : 'hero'}
      data-header-dark
      aria-label="Presentación"
    >
      {mounted && !reducedMotion && (
        <Suspense fallback={null}>
          <ThreeScene progressRef={progressRef} />
        </Suspense>
      )}

      <div className="hero__copy">
        <h1 className="hero__title">{SITE.name}</h1>
        <p className="hero__lede">{SITE.tagline}</p>
        <Link
          className="button button--light"
          to="/collections/all"
          prefetch="intent"
        >
          Ver el catálogo
        </Link>
      </div>

      <ul className="hero__claims">
        {CLAIMS.map((claim) => (
          <li key={claim} className="hero__claim">
            {claim}
          </li>
        ))}
      </ul>
    </section>
  );
}
