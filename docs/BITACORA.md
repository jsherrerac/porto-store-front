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

## Bug 0 — `tsconfig.json` inválido tapa el typecheck ✅

- **Hipótesis:** `"ignoreDeprecations": "6.0"` (línea 27) no es válido en el
  TypeScript 5.9.3 del proyecto (TS5103), y eso impide que `tsc` revise los tipos.
  Además hay que agregar `tsconfig.tsbuildinfo` al `.gitignore`.
- **Diagnóstico:**
  - `git log -p -- tsconfig.json`: `baseUrl` viene del template (`ee0d4a1 Scaffold Storefront`).
    `ignoreDeprecations` no aparece en ningún commit tuyo: entró sin commitear,
    entre `a436cf6` y el commit base.
  - Dos TypeScript distintos: el proyecto usa **5.9.3** (`node_modules`, lo corre
    `npm run typecheck`), y VS Code trae **6.0.3** integrado (no hay
    `typescript.tsdk` ni `.vscode/`).
  - Probé los dos compiladores con el tsconfig modificado solo en memoria
    (script en el scratchpad, fuera del repo):

    | tsconfig | TS 5.9.3 (proyecto) | TS 6.0.3 (VS Code) |
    |---|---|---|
    | A) con línea 27 | ❌ TS5103, tapa 3 errores | ✅ 0 en tsconfig |
    | B) sin línea 27 | ✅ 0 en tsconfig, muestra 3 errores | ❌ TS5101 `baseUrl` deprecado |
    | C) sin línea 27 ni `baseUrl` | ❌ TS5090 + 53 errores | ❌ TS5090 + 53 errores |

  - Al guardar el fix, VS Code marcó en `tsconfig.json:27`: *"La opción 'baseUrl'
    está en desuso [...] Especifique 'ignoreDeprecations': '6.0' para silenciar
    este error"*. Eso confirma que el editor usa TS 6.
- **Causa raíz:** el editor y el proyecto usan TypeScript distintos. TS 6 declara
  `baseUrl` obsoleto y lo marca como error, y el propio mensaje sugiere
  `"ignoreDeprecations": "6.0"`. Alguien siguió esa sugerencia para callar al
  editor, pero TS 5.9 no conoce el valor `"6.0"`, y cuando `tsc` encuentra un
  error en las opciones **no revisa los tipos**. Por eso el typecheck mostraba
  1 error en vez de 3. Quitar `baseUrl` no sirve (escenario C): 22 archivos
  importan `'storefrontapi.generated'` / `'customer-accountapi.generated'` por
  nombre y esos imports solo resuelven gracias a `baseUrl`.
- **Fix:** borrar la línea 27 de `tsconfig.json` (queda idéntico al template,
  blob `54587bd`). Agregar `tsconfig.tsbuildinfo` al `.gitignore` (y el salto de
  línea final que le faltaba).
- **Cómo verificar:** `npm run typecheck` ya no muestra TS5103 y lista los 3
  errores de abajo (los mismos que estaban ocultos: 0 nuevos). `git status` ya
  no muestra `tsconfig.tsbuildinfo`. En el navegador no cambia nada: Vite no
  hace typecheck. En VS Code el aviso de `baseUrl` es esperado mientras el editor
  use TS 6 (ver "Anotado").
- **Línea base real desde aquí (3 errores, se resuelven en el Bug 4):**
  ```
  app/components/ProductForm.tsx(9,14): error TS2724: ... no exported member named 'ProductFragment'
  app/components/ProductImage.tsx(1,14): error TS2724: ... no exported member named 'ProductVariantFragment'
  app/components/ProductItem.tsx(6,3): error TS2305: ... no exported member 'RecommendedProductFragment'
  ```
- **Pregunta de entrevista:** *"Tu `npm run typecheck` marca un error en el
  tsconfig y VS Code marca otro distinto en el mismo archivo. ¿Qué pasa y cómo lo
  arreglas sin silenciar nada?"* Puntos clave: el editor trae su propio
  TypeScript y la fuente de verdad es la versión del `package.json`; un error en
  las opciones hace que `tsc` no revise los tipos (puede esconder errores);
  `ignoreDeprecations` solo calla el aviso, no lo resuelve; la solución real a
  `baseUrl` es migrar antes de TS 7.

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
- **`baseUrl` obsoleto desde TS 6 (viene del Bug 0):** deja de funcionar en TS 7.
  Migrar implica cambiar `paths` a `"./app/*"` y los imports por nombre de
  `*.generated` en 22 archivos. Hacerlo cuando se actualice TypeScript.
- **Editor y CLI con TypeScript distinto (viene del Bug 0):** VS Code usa su
  TS 6.0.3 y el proyecto usa 5.9.3. Por eso VS Code muestra el aviso de
  `baseUrl` en `tsconfig.json`. Pendiente que Sebas decida cómo alinear el
  editor con el proyecto.

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
