import {useEffect, useRef} from 'react';
import {usePrefersReducedMotion} from '~/hooks/useMediaQuery';
import {getMotion} from '~/lib/motion';

const WORDS =
  'Diseñamos poco y lo diseñamos para que dure: una camiseta que al tercer año sigue siendo tu camiseta.'.split(
    ' ',
  );

/** Texto que se enciende palabra por palabra a medida que la persona baja. */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = ref.current;
    if (!section || reducedMotion) return;
    const {gsap} = getMotion();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.manifesto__word',
        {opacity: 0.15},
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.5,
          },
        },
      );
    }, section);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={ref} className="manifesto">
      <p className="manifesto__text">
        {WORDS.map((word, i) => (
          // La lista es fija y nunca se reordena: el índice sirve de key.
          // eslint-disable-next-line react/no-array-index-key
          <span key={i} className="manifesto__word">
            {word}{' '}
          </span>
        ))}
      </p>
    </section>
  );
}
