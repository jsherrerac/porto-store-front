import { useEffect, useRef, useState } from 'react';
import { useLoaderData, Link } from 'react-router';
import { Image, Money, CartForm } from '@shopify/hydrogen';
import gsap from 'gsap';

type LoaderArgs = {
  context: any;
  params: { handle: string };
};

export async function loader({ context, params }: LoaderArgs) {
  const { handle } = params;
  const { product } = await context.storefront.query(PRODUCT_QUERY, {
    variables: { handle },
  });

  if (!product) {
    throw new Response(null, { status: 404 });
  }

  return { product };
}

export default function ProductDetail() {
  const { product } = useLoaderData<typeof loader>();
  const firstVariant = product.variants.nodes[0];
  
  // Estados para el Carrito Lateral
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Refs de GSAP
  const imageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 1. Animación de entrada inicial
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(imageRef.current, { opacity: 0, x: -50, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' })
      .fromTo(infoRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, "-=0.6");
  }, []);

  // 2. Animación del Cart Drawer al abrir/cerrar
  useEffect(() => {
    if (isCartOpen) {
      gsap.to(overlayRef.current, { opacity: 1, display: 'block', duration: 0.3, ease: 'power2.out' });
      gsap.to(drawerRef.current, { x: '0%', duration: 0.5, ease: 'power4.out' });
    } else {
      gsap.to(drawerRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
        if (overlayRef.current) overlayRef.current.style.display = 'none';
      }});
    }
  }, [isCartOpen]);

  return (
    <div style={{ backgroundColor: '#121212', color: '#E0E2DB', minHeight: '100vh', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>
      
      {/* NAVBAR */}
      <nav style={{ padding: '2rem 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2E3532' }}>
        <Link to="/" style={{ color: '#E0E2DB', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.1em' }}>
          ← VOLVER
        </Link>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: '#8B2635' }}>PORTO</span>
        <button onClick={() => setIsCartOpen(true)} style={{ background: 'none', border: 'none', color: '#E0E2DB', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 600 }}>
          CARRITO (1)
        </button>
      </nav>

      {/* CONTENIDO DEL PRODUCTO */}
      <div style={{ display: 'flex', flexDirection: 'row', minHeight: 'calc(100vh - 90px)', padding: '0 5vw', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Columna Izquierda: Imagen */}
        <div ref={imageRef} style={{ flex: '1 1 50%', display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '600px', height: '70vh', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <Image data={product.featuredImage} sizes="(min-width: 45em) 50vw, 100vw" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Columna Derecha: Info y Botón de Hydrogen */}
        <div ref={infoRef} style={{ flex: '1 1 50%', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ color: '#8B2635', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600, marginBottom: '1rem' }}>Edición Limitada</span>
          <h1 style={{ fontSize: '4.5rem', fontFamily: '"Playfair Display", serif', margin: '0 0 1.5rem 0', lineHeight: 1.1 }}>{product.title}</h1>
          <div style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', color: '#D2D4C8' }}>
            <Money data={product.priceRange.minVariantPrice} />
          </div>
          <div style={{ fontSize: '1.2rem', lineHeight: 1.6, color: '#A0A0A0', marginBottom: '3rem', maxWidth: '500px' }} dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />

          {/* FORMULARIO NATIVO DE HYDROGEN PARA AÑADIR AL CARRITO */}
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{ lines: [{ merchandiseId: firstVariant.id, quantity: 1 }] }}
          >
            {(fetcher) => (
              <button 
                type="submit"
                onClick={() => {
                  // Abrimos el drawer al darle clic
                  setIsCartOpen(true);
                }}
                style={{
                  backgroundColor: '#E0E2DB', color: '#121212', border: 'none', padding: '1.5rem 0', width: '100%', maxWidth: '400px', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '50px', cursor: 'pointer', transition: 'transform 0.2s ease, background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {fetcher.state !== 'idle' ? 'Añadiendo...' : 'Agregar al Carrito'}
              </button>
            )}
          </CartForm>
        </div>
      </div>

      {/* ========================================= */}
      {/* CART DRAWER (PANEL LATERAL DEL CARRITO) */}
      {/* ========================================= */}
      
      {/* 1. Fondo Oscuro (Overlay) */}
      <div 
        ref={overlayRef} 
        onClick={() => setIsCartOpen(false)} 
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 40, opacity: 0, display: 'none' }} 
      />

      {/* 2. Panel Deslizable */}
      <div 
        ref={drawerRef} 
        style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '450px', height: '100vh', backgroundColor: '#1C211F', zIndex: 50, transform: 'translateX(100%)', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}
      >
        {/* Cabecera del Carrito */}
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2E3532' }}>
          <h2 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: '#E0E2DB' }}>Tu Carrito</h2>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: '#8B2635', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>
            &times;
          </button>
        </div>

        {/* Producto Añadido (Mockup visual basado en el producto actual) */}
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '100px', height: '120px', backgroundColor: '#121212', borderRadius: '12px', overflow: 'hidden' }}>
              <Image data={product.featuredImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#E0E2DB' }}>{product.title}</h3>
              <p style={{ margin: 0, color: '#A0A0A0', fontSize: '1rem' }}>Talla Única</p>
              <div style={{ marginTop: '1rem', fontWeight: 'bold', color: '#8B2635' }}>
                <Money data={product.priceRange.minVariantPrice} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Carrito / Checkout */}
        <div style={{ padding: '2rem', borderTop: '1px solid #2E3532', backgroundColor: '#121212' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>Subtotal</span>
            <span><Money data={product.priceRange.minVariantPrice} /></span>
          </div>
          <button style={{ backgroundColor: '#8B2635', color: '#E0E2DB', border: 'none', padding: '1.2rem', width: '100%', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '8px', cursor: 'pointer' }}>
            Finalizar Compra
          </button>
        </div>
      </div>

    </div>
  );
}

const PRODUCT_QUERY = `#graphql
  query Product(
    $handle: String!
  ) {
    product(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        id
        url
        altText
        width
        height
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;