import { useEffect, useRef, useState } from 'react';
import { useLoaderData, Link } from 'react-router';
import type { Route } from './+types/_index';
import { Image } from '@shopify/hydrogen';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'PORTO — Store' }];
};

export async function loader({ context }: Route.LoaderArgs) {
  const { products } = await context.storefront.query(HOMEPAGE_PRODUCTS_QUERY);
  return { products: products.nodes };
}

export default function Homepage() {
  const { products } = useLoaderData<typeof loader>();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [emailStatus, setEmailStatus] = useState('');

  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorFollowerRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textSectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const pillarsSectionRef = useRef<HTMLElement>(null);
  const pillar1Ref = useRef<HTMLDivElement>(null);
  const pillar2Ref = useRef<HTMLDivElement>(null);
  const pillar3Ref = useRef<HTMLDivElement>(null);
  const pillar4Ref = useRef<HTMLDivElement>(null);
  const magneticButtonRef = useRef<HTMLButtonElement>(null);

  //mouse
  useEffect(()=>{
    const dot = cursorDotRef.current;
    const follower= cursorFollowerRef.current;
    if (!dot||!follower) return;
      const moveDot = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
      const moveDotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
      const moveFollower = gsap.quickTo(follower, "x", { duration: 0.5, ease: "power3" });
      const moveFollowerY = gsap.quickTo(follower, "y", { duration: 0.5, ease: "power3" });
      const onMouseMove=(e:MouseEvent)=>{
        moveDot(e.clientX); moveDotY(e.clientY); moveFollower(e.clientX); moveFollowerY(e.clientY);
      }
      window.addEventListener('mousemove', onMouseMove);
      return()=>window.removeEventListener('mousemove', onMouseMove);

  },[]);
  // 1. Preloader con sessionStorage para que no canse al volver de los productos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const hasLoaded = sessionStorage.getItem('porto_loaded');
    if (hasLoaded) {
      setLoading(false);
      if (preloaderRef.current) preloaderRef.current.style.display = 'none';
      return;
    }

    document.body.style.overflow = 'hidden';
    

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        gsap.to(preloaderRef.current, {
          y: '-100%', duration: 1.2, ease: 'expo.inOut',
          onComplete: () => {
            setLoading(false);
            sessionStorage.setItem('porto_loaded', 'true');
            document.body.style.overflow = 'auto';
          }
        });
        gsap.fromTo('.hero-title', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, delay: 0.5, ease: 'power4.out' });
        gsap.fromTo('.hero-subtitle', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, delay: 0.7, ease: 'power4.out' });
      } else {
        setProgress(currentProgress);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // 2. Animaciones Scroll
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    if (heroBgRef.current) gsap.to(heroBgRef.current, { y: '20%', ease: 'none', scrollTrigger: { trigger: heroBgRef.current, start: 'top top', end: 'bottom top', scrub: true } });

    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      canvas.width = 1000; canvas.height = 1000;
      const frameCount = 160; 
      const currentFrame = (index: number) => `/frames/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.png`;
      const images: HTMLImageElement[] = [];
      const shoe3D = { frame: 0 };

      for (let i = 0; i < frameCount; i++) {
        const img = new window.Image(); 
        img.src = currentFrame(i);
        images.push(img);
      }

      function render() {
        if (!context || !canvas || !images[shoe3D.frame]) return;
        const img = images[shoe3D.frame];
        if (img.complete) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
      images[0].onload = render;

      const tl3D = gsap.timeline({ scrollTrigger: { trigger: canvasContainerRef.current, pin: true, scrub: 1.2, end: '+=3000' } });
      tl3D.to(shoe3D, { frame: frameCount - 1, snap: 'frame', ease: 'none', onUpdate: render }, 0);
      tl3D.fromTo('.callout-1', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.1 }, 0.2).to('.callout-1', { opacity: 0, x: -30, duration: 0.1 }, 0.4);
      tl3D.fromTo('.callout-2', { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.1 }, 0.5).to('.callout-2', { opacity: 0, x: 30, duration: 0.1 }, 0.7);
    }

    const carousel = carouselRef.current;
    const cards = gsap.utils.toArray('.card-tilt-wrapper');
    if (carousel && cards.length) {
      const totalScroll = carousel.scrollWidth - window.innerWidth;
      gsap.to(carousel, {
        x: -totalScroll, ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current, pin: true, scrub: 1.5, end: () => `+=${totalScroll}`, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const velocity = self.getVelocity(); 
            const rotateAmount = gsap.utils.clamp(-4, 4, velocity / 800); 
            gsap.to(cards, { rotateZ: rotateAmount, ease: 'power1.out', overwrite: 'auto', duration: 0.2 });
            if (Math.abs(velocity) < 5) gsap.to(cards, { rotateZ: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
          }
        },
      });
    }

    if (textSectionRef.current && wordsRef.current.length > 0) {
      gsap.fromTo(wordsRef.current, { opacity: 0, y: 50, rotateX: -45 }, { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: textSectionRef.current, start: 'top 60%', end: '+=800', scrub: 1 } });
    }

    if (pillarsSectionRef.current) {
      const tlPillars = gsap.timeline({ scrollTrigger: { trigger: pillarsSectionRef.current, pin: true, scrub: 1.5, start: 'top top', end: '+=1500' } });
      tlPillars.fromTo([pillar1Ref.current, pillar2Ref.current, pillar3Ref.current, pillar4Ref.current], { y: '100vh' }, { y: '0', ease: 'power3.out', stagger: 0.1, duration: 1.5 });
      tlPillars.to([pillar2Ref.current, pillar3Ref.current, pillar4Ref.current], { height: '100%', ease: 'power2.inOut', stagger: 0.1, duration: 1.5 }, "<0.5");
    }

    const magneticBtn = magneticButtonRef.current;
    if (magneticBtn) {
      magneticBtn.addEventListener('mousemove', (e) => {
        const rect = magneticBtn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
        gsap.to(magneticBtn, { x, y, duration: 0.3, ease: 'power3.out' });
      });
      magneticBtn.addEventListener('mouseleave', () => gsap.to(magneticBtn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' }));
    }

    return () => { lenis.destroy(); ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); };
  }, [loading]);

  // Función para manejar el envío de correo desde el formulario del footer
  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData= new FormData(form);
    const email = formData.get('email');
    const message = formData.get('message');

    setEmailStatus('Enviando...');
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });
      if (res.ok) {
        setEmailStatus('¡Mensaje enviado con éxito!');
        form.reset();
      } else {
        setEmailStatus('Error al enviar. Intenta de nuevo.');
      }
    } catch {
      setEmailStatus('Error de conexión.');
    }
  };

  return (
    <div style={{ backgroundColor: '#2E3532', color: '#E0E2DB', minHeight: '100vh', overflowX: 'hidden', fontFamily: '"Inter", sans-serif', cursor: 'none' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        * { cursor: none !important; }
        
        /* ADIÓS AL EFECTO DE HUNDIRSE: Solo dejamos una transición sutil de brillo o borde limpio */
        .product-card { transition: border-color 0.4s ease, box-shadow 0.4s ease; }
        .product-card:hover { border-color: #8B2635 !important; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .product-card:hover .product-image { transform: scale(1.05); }
        .product-image { transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); }

        .callout-line { width: 60px; height: 1px; background-color: #8B2635; margin-right: 15px; }
        .callout-line-reverse { width: 60px; height: 1px; background-color: #8B2635; margin-left: 15px; }
        
        .cursor-dot { pointer-events: none; position: fixed; top: 0; left: 0; width: 8px; height: 8px; background-color: #8B2635; border-radius: 50%; z-index: 10000; transform: translate(-50%, -50%); }
        .cursor-follower { pointer-events: none; position: fixed; top: 0; left: 0; width: 40px; height: 40px; border: 1px solid rgba(224, 226, 219, 0.5); border-radius: 50%; z-index: 9999; transform: translate(-50%, -50%); transition: width 0.3s, height 0.3s, background-color 0.3s; }
        a:hover ~ .cursor-follower, button:hover ~ .cursor-follower { width: 60px; height: 60px; background-color: rgba(139, 38, 53, 0.2); border-color: transparent; }
      `}</style>

      <div ref={cursorDotRef} className="cursor-dot" />
      <div ref={cursorFollowerRef} className="cursor-follower" />

      <div ref={preloaderRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#121212', zIndex: 9998, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '3rem', color: '#E0E2DB', marginBottom: '1rem', letterSpacing: '0.2em' }}>PORTO</h1>
        <div style={{ fontSize: '1.2rem', color: '#8B2635', fontWeight: 'bold' }}>{progress}%</div>
        <div style={{ width: '200px', height: '2px', backgroundColor: '#2E3532', marginTop: '1rem', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#8B2635', transition: 'width 0.2s ease' }} />
        </div>
      </div>

      {/* SECCIÓN 1: HERO */}
      <section style={{ height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>
        <div ref={heroBgRef} style={{ position: 'absolute', top: '-10%', left: 0, width: '100%', height: '120%', backgroundImage: 'url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(28, 33, 31, 0.7)', zIndex: 1 }} />
        <div style={{ zIndex: 2 }}>
          <h1 className="hero-title" style={{ fontSize: '6rem', color: '#E0E2DB', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>PORTO</h1>
          <p className="hero-subtitle" style={{ color: '#D2D4C8', fontSize: '1.4rem', marginTop: '1rem', fontWeight: 300, letterSpacing: '0.05em' }}>La estética de lo esencial.</p>
        </div>
      </section>

      {/* SECCIÓN 2: CANVAS 3D */}
      <section ref={canvasContainerRef} style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', overflow: 'hidden', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', objectFit: 'contain', maxWidth: '70vw', maxHeight: '70vh', zIndex: 1 }} />
        <div className="callout-1" style={{ position: 'absolute', top: '40%', left: '12%', zIndex: 2, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', color: '#E0E2DB' }}>Cuello Reforzado</span>
            <span style={{ color: '#D2D4C8', fontSize: '0.9rem' }}>Estructura indeformable.</span>
          </div>
          <div className="callout-line-reverse" />
        </div>
        <div className="callout-2" style={{ position: 'absolute', top: '60%', right: '12%', zIndex: 2, display: 'flex', alignItems: 'center' }}>
          <div className="callout-line" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', color: '#E0E2DB' }}>Textura 240g</span>
            <span style={{ color: '#D2D4C8', fontSize: '0.9rem' }}>Caída pesada perfecta.</span>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: CARRUSEL LIMPIO (SIN HUNDIRSE) */}
      <section ref={containerRef} style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <div ref={carouselRef} style={{ display: 'flex', gap: '8rem', padding: '0 10vw', height: '100%', alignItems: 'center', width: 'max-content' }}>
          <div style={{ minWidth: '400px' }}>
            <h2 style={{ color: '#8B2635', fontSize: '4rem', margin: 0, fontFamily: '"Playfair Display", serif' }}>CATÁLOGO</h2>
            <p style={{ color: '#D2D4C8', fontSize: '1.4rem', fontWeight: 300 }}>Piezas maestras diseñadas para el impacto.</p>
          </div>
          {products.map((product, index) => (
            <div key={product.id} className="card-tilt-wrapper" style={{ transformOrigin: 'center bottom', minWidth: '40vw', height: '80vh' }}>
              <Link className="product-card" to={`/products/${product.handle}`} style={{ width: '100%', height: '100%', backgroundColor: '#121212', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #2E3532', textDecoration: 'none', color: '#E0E2DB' }}>
                <div style={{ height: '75%', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
                  {product.featuredImage && ( <Image className="product-image" data={product.featuredImage} sizes="800px" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> )}
                </div>
                <div style={{ marginTop: '1.5rem', height: '25%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span style={{ color: '#8B2635', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.1em' }}>0{index + 1} / EDICIÓN</span>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '2.2rem', fontFamily: '"Playfair Display", serif' }}>{product.title}</h3>
                  <p style={{ color: '#D2D4C8', margin: 0, fontSize: '1.4rem', fontWeight: 300 }}>${product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 4: TEXTO REVELADO */}
      <section ref={textSectionRef} style={{ minHeight: '100vh', padding: '8rem 2rem', backgroundColor: '#121212', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', perspective: '1000px' }}>
        <span style={{ color: '#8B2635', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem', fontWeight: 600 }}>Diseño Atemporal</span>
        <h2 style={{ fontSize: '4.5rem', margin: '0', maxWidth: '1000px', lineHeight: '1.3', fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
          {"Diseñado para resistir el paso del tiempo y mantener una silueta impecable.".split(' ').map((word, index) => (
            <span key={index} ref={(el) => (wordsRef.current[index] = el)} style={{ display: 'inline-block', marginRight: '0.3em', opacity: 0 }}>{word}</span>
          ))}
        </h2>
      </section>

      {/* SECCIÓN 5: PILARES */}
      <section ref={pillarsSectionRef} style={{ height: '100vh', width: '100vw', backgroundColor: '#1C211F', display: 'flex', alignItems: 'flex-end', padding: '0 2vw', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '85vh', width: '100%', gap: '1.5vw', alignItems: 'flex-end' }}>
          <div ref={pillar1Ref} style={{ flex: 1, height: '100%', background: 'linear-gradient(180deg, #2E3532 0%, #1C211F 100%)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', padding: '4rem 3rem', borderTop: '6px solid #8B2635', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '-1rem', right: '1rem', fontSize: '10rem', fontWeight: 800, color: 'rgba(224, 226, 219, 0.04)', lineHeight: 1 }}>01</span>
            <h3 style={{ fontSize: '2.5rem', margin: '0 0 1.5rem 0', fontFamily: '"Playfair Display", serif', color: '#E0E2DB', zIndex: 1 }}>100% Auténtico</h3>
            <p style={{ color: '#D2D4C8', fontSize: '1.2rem', lineHeight: '1.7', zIndex: 1 }}>Nuestros materiales superan las pruebas más estrictas.</p>
          </div>
          <div ref={pillar2Ref} style={{ flex: 1, height: '60%', background: 'linear-gradient(180deg, #2E3532 0%, #1C211F 100%)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', padding: '4rem 3rem', borderTop: '6px solid #8B2635', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '-1rem', right: '1rem', fontSize: '10rem', fontWeight: 800, color: 'rgba(224, 226, 219, 0.04)', lineHeight: 1 }}>02</span>
            <h3 style={{ fontSize: '2.5rem', margin: '0 0 1.5rem 0', fontFamily: '"Playfair Display", serif', color: '#E0E2DB', zIndex: 1 }}>"Simplemente perfecto"</h3>
            <p style={{ color: '#D2D4C8', fontSize: '1.2rem', fontStyle: 'italic', zIndex: 1 }}>— Reseña verificada de cliente en Bogotá.</p>
          </div>
          <div ref={pillar3Ref} style={{ flex: 1, height: '45%', background: 'linear-gradient(180deg, #2E3532 0%, #1C211F 100%)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', padding: '4rem 3rem', borderTop: '6px solid #8B2635', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '-1rem', right: '1rem', fontSize: '10rem', fontWeight: 800, color: 'rgba(224, 226, 219, 0.04)', lineHeight: 1 }}>03</span>
            <h3 style={{ fontSize: '2.5rem', margin: '0 0 1.5rem 0', fontFamily: '"Playfair Display", serif', color: '#E0E2DB', zIndex: 1 }}>Costuras Invisibles</h3>
            <p style={{ color: '#D2D4C8', fontSize: '1.2rem', lineHeight: '1.7', zIndex: 1 }}>Tecnología que oculta el hilo y protege contra desgaste.</p>
          </div>
          <div ref={pillar4Ref} style={{ flex: 1, height: '30%', background: 'linear-gradient(180deg, #2E3532 0%, #1C211F 100%)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', padding: '4rem 3rem', borderTop: '6px solid #8B2635', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '-1rem', right: '1rem', fontSize: '10rem', fontWeight: 800, color: 'rgba(224, 226, 219, 0.04)', lineHeight: 1 }}>04</span>
            <h3 style={{ fontSize: '2.5rem', margin: '0 0 1.5rem 0', fontFamily: '"Playfair Display", serif', color: '#E0E2DB', zIndex: 1 }}>El Veredicto</h3>
            <p style={{ color: '#D2D4C8', fontSize: '1.2rem', lineHeight: '1.7', zIndex: 1 }}>Inversión definitiva para tu armario de diario.</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN FINAL (FOOTER CON FORMULARIO DE CORREO BACKEND & BOTÓN MAGNÉTICO) */}
      <footer style={{ padding: '8rem 5vw', backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', borderTop: '1px solid #2E3532' }}>
        <h2 style={{ fontSize: '4.5rem', color: '#E0E2DB', fontFamily: '"Playfair Display", serif', margin: '0 0 1rem 0' }}>Mantente en contacto</h2>
        <p style={{ color: '#A0A0A0', marginBottom: '3rem', fontSize: '1.2rem' }}>Escríbenos directamente o suscríbete a nuestras novedades exclusivas.</p>
        
        {/* Formulario conectado al Backend de Resend */}
        <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '500px', gap: '1rem', marginBottom: '4rem' }}>
          <input 
            type="email" 
            name="email" 
            placeholder="Tu correo electrónico" 
            required 
            style={{ padding: '1.2rem 1.5rem', borderRadius: '8px', backgroundColor: '#1C211F', border: '1px solid #2E3532', color: '#E0E2DB', fontSize: '1rem', outline: 'none' }}
          />
          <textarea 
            name="message" 
            placeholder="Tu mensaje o consulta..." 
            rows={3} 
            required 
            style={{ padding: '1.2rem 1.5rem', borderRadius: '8px', backgroundColor: '#1C211F', border: '1px solid #2E3532', color: '#E0E2DB', fontSize: '1rem', outline: 'none', resize: 'none' }}
          />
          <button 
            type="submit" 
            style={{ backgroundColor: '#8B2635', color: '#E0E2DB', border: 'none', padding: '1.2rem', fontSize: '1rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Enviar Mensaje
          </button>
          {emailStatus && <p style={{ color: '#E0E2DB', fontSize: '0.9rem', marginTop: '0.5rem' }}>{emailStatus}</p>}
        </form>

        <button 
          ref={magneticButtonRef}
          style={{ backgroundColor: 'transparent', color: '#E0E2DB', border: '1px solid #8B2635', padding: '1.5rem 4rem', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'background-color 0.3s' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B2635'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Explorar Colección
        </button>
      </footer>
    </div>
  );
}

const HOMEPAGE_PRODUCTS_QUERY = `#graphql
  query HomepageProducts {
    products(first: 6) {
      nodes { id title handle priceRange { minVariantPrice { amount currencyCode } } featuredImage { id url altText width height } }
    }
  }
` as const;