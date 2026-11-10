# PORTO

Tienda headless de ropa esencial, construida con **Shopify Hydrogen** sobre la
Storefront API. Proyecto de portafolio de
[Sebastián Herrera](https://github.com/jsherrerac).

> Es una tienda de demostración: el catálogo viene de
> [mock.shop](https://mock.shop) y no se procesan pedidos reales.

## Qué hay adentro

- **Home con escena WebGL**: una esfera de 5000 partículas hecha con Three.js
  y shaders propios, sin modelos 3D. El scroll la abre mientras aparecen los
  textos (GSAP ScrollTrigger con _pin_ y _scrub_).
- **Galería horizontal movida por el scroll vertical**, texto que se revela
  palabra por palabra y scroll suave con Lenis.
- **Catálogo**: Hombre, Mujer, Unisex y Novedades, con orden por precio o
  fecha guardado en la URL (`?orden=precio-asc`) y paginación por cursores.
- **Página de producto** con variantes (talla, color) en la URL, variante
  optimista, galería, recomendaciones por streaming y transición animada
  desde la tarjeta (View Transitions API).
- **Carrito lateral** con actualizaciones optimistas y salida al checkout
  alojado por Shopify.
- **Contacto**: formulario que envía correo con la API de Resend desde el
  servidor, con validación del lado del servidor. Botón de WhatsApp con
  enlace `wa.me` (sin API ni backend).

## Decisiones técnicas

| Decisión | Por qué |
|---|---|
| Hydrogen y no un tema Liquid | Control total del frontend y renderizado en el servidor (SSR) en el edge de Oxygen. |
| Datos en `loader` (servidor) | El token de Shopify nunca llega al navegador y la página llega con los productos ya pintados. |
| Three.js con `lazy()` | La librería (≈125 kB gzip) es un archivo aparte: solo se descarga en la home y nunca en el servidor. |
| Animaciones dentro de `useEffect` + `gsap.context()` | Solo corren en el navegador y se limpian al salir de la página: sin listeners ni triggers huérfanos. |
| Estado en la URL (variantes, orden) | Enlaces compartibles, botón Atrás funcional y render correcto desde el servidor. |
| Destinatario del correo fijo en el servidor | Si lo decidiera el formulario, cualquiera podría usarlo para enviar spam (_open relay_). |
| `<Money as="span">` | `<Money>` pinta un `<div>`; dentro de un `<p>` es HTML inválido y rompe la hidratación de React. |

## Accesibilidad y rendimiento

- Con **"reducir movimiento"** activado en el sistema no se monta la escena
  3D, ni Lenis, ni el cursor, ni los _pins_: todo queda estático y legible.
- El cursor decorativo solo aparece con mouse; el cursor del sistema nunca
  se oculta.
- Foco visible, enlace para saltar al contenido, paneles laterales que
  atrapan y devuelven el foco y se cierran con Escape.
- Fuente variable propia (un solo archivo para todos los pesos y anchos),
  precargada. La escena 3D deja de dibujar cuando sale de la pantalla.
- Caché por consulta: `CacheShort` en la portada y `CacheLong` en
  colecciones y recomendaciones.

## Correr el proyecto

Requiere Node 22 o 24.

```bash
npm install
cp .env.example .env   # y llena los valores
npm run dev            # http://localhost:3000
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor local con MiniOxygen (el mismo runtime de producción). |
| `npm run typecheck` | Genera los tipos de rutas y revisa TypeScript. |
| `npm run lint` | ESLint. |
| `npm run build` | Build de producción. |

El CI (`.github/workflows/ci.yml`) corre typecheck, lint y build en una
máquina limpia en cada push.

## Estructura

```
app/
  components/        piezas de interfaz (header, carrito, tarjetas...)
    home/            secciones de la portada, incluida la escena 3D
    product/         selector de variantes y galería
  config/site.ts     nombre, navegación y textos fijos
  hooks/             media queries (reducir movimiento, tipo de puntero)
  lib/               lógica sin interfaz: orden, validación, WhatsApp, GSAP
  routes/            una ruta por archivo (loader + componente)
  styles/            tokens.css (diseño) y app.css
docs/BITACORA.md     auditoría del primer borrador y registro de cambios
```

## Créditos

Tipografía [Archivo](https://github.com/Omnibus-Type/Archivo) (SIL OFL 1.1).
Datos y fotos de producto: [mock.shop](https://mock.shop).

Este proyecto se construyó con ayuda de asistentes de IA (Gemini y Claude).
La bitácora en `docs/BITACORA.md` registra qué se hizo, por qué y qué
errores se encontraron y corrigieron en el camino.
