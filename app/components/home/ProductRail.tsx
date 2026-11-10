import {useEffect, useRef} from 'react';
import {Link} from 'react-router';
import type {ProductCardFragment} from 'storefrontapi.generated';
import {ProductCard} from '~/components/ProductCard';
import {usePrefersReducedMotion} from '~/hooks/useMediaQuery';
import {getMotion} from '~/lib/motion';

/**
 * Galería horizontal movida por el scroll vertical.
 *
 * La sección se fija (pin) y la tira se desplaza en x exactamente lo que le
 * sobra respecto a la pantalla: scrollWidth − innerWidth. Esa misma distancia
 * es la duración del pin, así 1px de rueda es 1px de desplazamiento.
 * En móvil, con "reducir movimiento" o sin JavaScript, queda una tira con
 * scroll horizontal normal.
 */
export function ProductRail({products}: {products: ProductCardFragment[]}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || reducedMotion) return;

    const {gsap} = getMotion();
    const mm = gsap.matchMedia();
    // matchMedia de GSAP crea la animación solo en escritorio y la deshace
    // sola si la ventana se angosta.
    mm.add('(min-width: 48rem)', () => {
      section.classList.add('rail--pinned');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      return () => section.classList.remove('rail--pinned');
    });
    return () => mm.revert();
  }, [reducedMotion, products.length]);

  return (
    <section ref={sectionRef} className="rail" aria-labelledby="rail-title">
      <div ref={trackRef} className="rail__track">
        <div className="rail__intro">
          <h2 id="rail-title" className="rail__title">
            Destacados
          </h2>
          <Link to="/collections/all" className="text-link" prefetch="intent">
            Ver todo el catálogo
          </Link>
        </div>
        {products.map((product, index) => (
          <div key={product.id} className="rail__item">
            <ProductCard
              product={product}
              loading={index < 2 ? 'eager' : 'lazy'}
              sizes="(min-width: 48rem) 30vw, 72vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
