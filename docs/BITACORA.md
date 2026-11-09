# Bitácora de auditoría — PORTO Store

Auditoría del borrador generado por IA (Gemini). Una entrada por bug, en orden.
Rama: `audit/bug-fixes` · Commit base: `4042b04`.

Estados: ⏳ pendiente · 🔍 en diagnóstico · ✅ resuelto · ❌ hipótesis descartada

---

## Paso 0 — Preparación (2026-11-08)

| Chequeo | Resultado |
|---|---|
| `docs/BITACORA.md` previa | No existía; se crea esta. |
| `git status` | Rama `main` con `CLAUDE.md` y `tsconfig.json` modificados sin commitear. |
| `git diff .gitignore` | Vacío: el `.gitignore` está igual que en el último commit. |
| `git check-ignore -v .env` | `.gitignore:11:.env` → `.env` está ignorado. ✅ |
| `du -sh public/frames` | 17 MB, 160 archivos. **Está en `.gitignore:12`**, así que no entra al repo. |
| Commit base | `4042b04 chore: baseline of AI-generated draft (Gemini) before audit`. |

### Línea base del typecheck (`npm run typecheck`)

TypeScript instalado: **5.9.3** (`package.json` pide `^5.9.2`).

Salida oficial (exit 2), **1 error**:

```
tsconfig.json(27,27): error TS5103: Invalid value for '--ignoreDeprecations'.
```

Este error está en las opciones del tsconfig y no deja que `tsc` llegue a revisar
los tipos del código. Al forzar un valor válido solo por línea de comandos
(`npx tsc --noEmit --ignoreDeprecations 5.0 --incremental false`, sin tocar
archivos), aparecen **3 errores ocultos**:

```
app/components/ProductForm.tsx(9,14): error TS2724: '"storefrontapi.generated"' has no exported member named 'ProductFragment'. Did you mean 'ProductItemFragment'?
app/components/ProductImage.tsx(1,14): error TS2724: '"storefrontapi.generated"' has no exported member named 'ProductVariantFragment'. Did you mean 'ProductItemFragment'?
app/components/ProductItem.tsx(6,3): error TS2305: Module '"storefrontapi.generated"' has no exported member 'RecommendedProductFragment'.
```

Advertencias (no son errores): `envFile` está deprecado (sugiere `envDir: false`);
future flags de React Router v8 (`v8_passThroughRequests`,
`v8_trailingSlashAwareDataRequests`).

---

## Bug 0 — `tsconfig.json` inválido tapa el typecheck ⏳

- **Hipótesis:** `"ignoreDeprecations": "6.0"` (línea 27) no es válido en el
  TypeScript 5.9.3 del proyecto (TS5103), y eso impide que `tsc` revise los tipos.
  Además hay que agregar `tsconfig.tsbuildinfo` al `.gitignore`.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 1 — Dependencias instaladas en la carpeta padre ⏳

- **Hipótesis:** `../package.json`, `../node_modules` y `../package-lock.json`
  (en `copiloto-ecommerce/`) vienen de un `npm install` hecho en la carpeta
  equivocada. Ahí están `lucide-react` y `resend`. `resend` arrastra
  `standardwebhooks` (CommonJS), que causó `ReferenceError: exports is not defined`.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 2 — "Error al enviar" en el formulario ⏳

- **Hipótesis:** la key de Resend en `.env` es inválida o falta (una anterior se
  filtró y hay que revocarla), o choca con la restricción de
  `onboarding@resend.dev`. Además, sobra el cast `(context as unknown as { env: Env }).env`
  y posiblemente `envContext` en `app/lib/env.ts`.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 3 ✍️ — "Error de conexión" falso ⏳

- **Hipótesis:** en `handleSendEmail` (`_index.tsx`), `e.currentTarget.reset()`
  va después del `await`. Para entonces `currentTarget` ya es `null`, se lanza un
  TypeError y el `catch` muestra "Error de conexión." aunque el correo sí salió.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix (lo escribe Sebas):** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 4 — Typecheck en verde ⏳

- **Hipótesis:** hay errores en la línea base, incluido `product: any` en el
  carrusel (debe usar los tipos que genera codegen para `HomepageProducts`).
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 5 ✍️ — El cursor desaparece al recargar o al volver de un producto ⏳

- **Hipótesis:** si `sessionStorage` tiene `porto_loaded`, el primer `useEffect`
  hace `return` antes de registrar el `mousemove` del cursor custom, pero
  `* { cursor: none !important; }` sigue activo. Además, el listener nunca se quita.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix (lo escribe Sebas):** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 6 ✍️ — `@studio-freight/lenis` deprecado ⏳

- **Hipótesis:** el paquete ahora se llama `lenis`. Hay que migrar sin cambiar
  el comportamiento.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix (lo escribe Sebas):** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 7 — Lenis movido por dos relojes ⏳

- **Hipótesis:** `lenis.raf()` se llama desde un loop propio de `requestAnimationFrame`
  y también desde `gsap.ticker.add(...)`. Ninguno de los dos se limpia.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 8 — Limpieza de animaciones ⏳

- **Hipótesis:** `ScrollTrigger.getAll().forEach(t => t.kill())` mata todos los
  triggers de la app y no revierte las animaciones. Usar `gsap.context()` + `ctx.revert()`.
  Revisar también los listeners del botón magnético y el `body.style.overflow`
  del preloader.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 9 — Hero sin imagen y con fuentes de sistema ⏳

- **Hipótesis:** la CSP de `app/entry.server.tsx` bloquea `images.unsplash.com`,
  `fonts.googleapis.com` y `fonts.gstatic.com`. Decisión pendiente de Sebas:
  (a) permitir dominios o (b) servir los recursos desde el proyecto.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix:** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

## Bug 10 ✍️ — Reseña inventada ⏳

- **Hipótesis:** "Simplemente perfecto — Reseña verificada de cliente en Bogotá"
  no es real. Reemplazar por un placeholder honesto.
- **Diagnóstico:** —
- **Causa raíz:** —
- **Fix (lo escribe Sebas):** —
- **Cómo verificar:** —
- **Pregunta de entrevista:** —

---

## Anotado, NO arreglar (por ahora)

- **Frames de un tenis:** los 160 `ezgif-frame-XXX.png` muestran un tenis, no
  una camisa. Su origen es desconocido y los callouts hablan de cuello y tela.
  Se van a reemplazar por frames propios.
- **Peso de `public/frames`:** 17 MB en 160 PNG, y se precargan todos de golpe.
- **Preloader falso:** el porcentaje sale de `Math.random`, no mide la carga real.

### Decisiones tomadas en el Paso 0

- **`public/frames/` se queda ignorado (decisión, no pendiente).** Los 160 PNG
  son de un tenis y su origen es desconocido, así que no deben entrar al repo.
  Cuando se reemplacen por frames propios de una camisa, sí se commitean.
  Consecuencia que hay que tener presente: mientras tanto, quien clone el repo,
  o un deploy que construya desde GitHub, no tendrá la secuencia del canvas.
- **Reglas repetidas en `.gitignore` se dejan quietas (no es un bug).** `.env`
  aparece dos veces (líneas 7 y 11), y `./public/frames` (línea 10) no hace nada
  porque git no entiende el prefijo `./`. La regla que funciona es `public/frames/`.
- **`tsconfig.tsbuildinfo` se agrega al `.gitignore` dentro del Bug 0.** Lo
  genera el typecheck (`"incremental": true`) y hoy queda sin trackear.
