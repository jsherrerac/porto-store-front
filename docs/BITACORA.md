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

## Bug 1 — Dependencias instaladas en la carpeta padre ✅

- **Hipótesis:** `../package.json`, `../node_modules` y `../package-lock.json`
  (en `copiloto-ecommerce/`) vienen de un `npm install` hecho en la carpeta
  equivocada. Ahí están `lucide-react` y `resend`. `resend` arrastra
  `standardwebhooks` (CommonJS), que causó `ReferenceError: exports is not defined`.
- **Diagnóstico:**
  - Confirmado: los tres se crearon el 2026-11-08 a las 20:29 (un solo `npm install`).
    Contenido del `../package.json` borrado, como respaldo:
    `{"dependencies": {"lucide-react": "^1.70.0", "resend": "^6.37.0"}}`.
  - Confirmado: `standardwebhooks@1.1.1` tiene `"type": "commonjs"` y su código
    empieza con `exports.Webhook = ...`. Es dependencia directa de `resend@6.37.0`.
  - Confirmado: `npm ls` en `hydrogen-front` sale `(empty)` y no hay imports de `resend`.
  - **Falso:** `lucide-react` no se usa en ninguna parte del repo (0 coincidencias
    de `lucide`). No se instala aquí.
  - Script de dependencias fantasma (scratchpad): los 26 paquetes que importa el
    código están todos declarados en el `package.json` de `hydrogen-front`.
  - Hallazgo extra: en el padre había un **React 19.3.1**, que npm instaló porque
    es *peer dependency* de `lucide-react`. La tienda usa React 18.3.1.
- **Causa raíz:** se corrió `npm install` en `copiloto-ecommerce/` en vez de
  `hydrogen-front/`. Al no haber `package.json`, npm creó uno sin `name` ni
  `version`. Funcionaba porque Node y Vite resuelven los imports **subiendo
  carpetas**: si no está en `hydrogen-front/node_modules`, lo buscan en
  `../node_modules`. El crash venía de que MiniOxygen ejecuta el servidor en
  workerd, que solo entiende ES Modules y no tiene `exports`. En dev, Vite no
  convierte paquetes CommonJS salvo que estén en `ssr.optimizeDeps.include`
  (ver el comentario en `vite.config.ts:24-38`). No se pudo reproducir porque el
  import ya no existe; la conclusión sale de leer el código.
- **Por qué habría roto el deploy en Oxygen:** (1) el repo es `hydrogen-front`,
  así que un deploy desde GitHub clona solo esa carpeta y corre `npm ci` con su
  `package.json`: `resend` no existe y el build falla con "Could not resolve".
  (2) El lock de esas versiones estaba fuera del repo, así que no se pueden
  reproducir. (3) Si se hubiera usado `lucide-react`, habría cargado el React 19
  del padre junto al React 18 de la app, y con dos Reacts los hooks fallan.
- **Fix:** borrar (con permiso de Sebas) `../node_modules`, `../package.json` y
  `../package-lock.json`. Dentro de `hydrogen-front` no cambia código: este
  commit solo trae la bitácora.
- **Cómo verificar:**
  - `require.resolve` de `lucide-react`, `resend` y `standardwebhooks` desde
    `hydrogen-front` da `MODULE_NOT_FOUND`.
  - Dependencias fantasma: 0.
  - Typecheck: los mismos 3 errores de la línea base (0 nuevos).
  - `npx shopify hydrogen build` (sin `--codegen`): exit 0, 148 módulos del
    servidor, sin "Could not resolve"; `git status` limpio.
  - Navegador: home, PDP y carrito lateral cargan, y en la consola no aparece
    "Failed to resolve import" ni "exports is not defined".
- **Pregunta de entrevista:** *"Tu app funciona en local, pero el build del CI
  falla con `Could not resolve 'resend'`, aunque en tu máquina el paquete está
  instalado. ¿Qué pasa y cómo lo detectas antes del deploy?"* Puntos clave:
  resolución de módulos subiendo carpetas; dependencia fantasma (se usa pero no
  está declarada); el CI solo tiene lo que está en el repo; cómo detectarlo:
  `npm ls`, un clon limpio con `npm ci` + build, o linters de imports no
  declarados.

## Bug 2 — "Error al enviar" en el formulario ✅ (no reproducible hoy + cast eliminado)

- **Hipótesis:** la key de Resend en `.env` es inválida o falta (una anterior se
  filtró y hay que revocarla), o choca con la restricción de
  `onboarding@resend.dev`. Además, sobra el cast `(context as unknown as { env: Env }).env`
  y posiblemente `envContext` en `app/lib/env.ts`.
- **Diagnóstico:**

  | Hipótesis | Resultado | Evidencia |
  |---|---|---|
  | Key inválida o ausente | ❌ | `curl -X POST localhost:3000/api/send-email` con datos válidos → HTTP 200, `{"success":true,"data":{"id":"01a1be60-…"}}`, y el correo llegó a la bandeja de Sebas. |
  | Restricción de `onboarding@resend.dev` | ❌ | El destino fijo `hrcorzosebas@gmail.com` (`api.send-email.tsx:42`) fue aceptado. |
  | El formulario manda otra cosa | ❌ | `_index.tsx:192-196` manda el mismo JSON (`email`, `message`) que el `curl`. |
  | `context.env` ya viene tipado | ✅ | El template lo usa sin cast (`entry.server.tsx:19`, `root.tsx:75`). Con el compilador: `context.env → Env`, `env.RESEND_API_KEY → string` (no `any`). |
  | `envContext` no se usa | ✅ | `grep`: solo aparece donde se define (`app/lib/env.ts:11`). |

  Prueba de Sebas en el navegador: el formulario muestra **"Error de conexión."**
  pero **el correo sí llega** con el mensaje escrito. Ese es el síntoma del Bug 3.
  `.env` no se leyó durante este bug.
- **Causa raíz:**
  - *"Error al enviar" de la grabación:* **no determinada.** Hoy el endpoint
    funciona de punta a punta y no se recuperó el log `Error de Resend:` de
    cuando se grabó. Posibles explicaciones, sin verificar: cambio de key,
    reinicio del server, o la grabación es de antes del cambio del SDK a `fetch`.
  - *Cast:* `as unknown as {...}` obliga a TypeScript a aceptar cualquier tipo y
    apaga la revisión en esa línea. Los casts se borran al compilar, así que no
    cambiaban nada en ejecución; solo quitaban la red de seguridad.
    `envContext` (`createContext` de React Router) era código muerto.
- **Fix:** `const env = context.env;` y borrar el `import type { Env }` que ya no
  se usa en `api.send-email.tsx`. En `app/lib/env.ts` se borran `envContext` y su
  import. El tipo `Env` se queda, porque `env.d.ts:5` lo usa para extender el
  `Env` global.
- **Cómo verificar:** typecheck con los mismos 3 errores de la línea base
  (0 nuevos). POST con mensaje vacío → `400 Datos inválidos` (la ruta compila y
  corre sin enviar correo). En el navegador: enviar el formulario y confirmar
  que el correo llega. El mensaje en pantalla todavía es incorrecto hasta el Bug 3.
- **Pregunta de entrevista:** *"Un endpoint responde 200 cuando lo pruebas con
  `curl`, pero el formulario muestra un error. ¿Cómo aíslas dónde está el
  problema?"* Puntos clave: probar capa por capa (endpoint solo → formulario);
  comparar el payload de las dos llamadas; leer el log del server en vez de
  confiar en el mensaje de la interfaz; mirar si el efecto real (el correo)
  ocurrió aunque la interfaz diga que falló. Pregunta extra: *¿qué hace
  `as unknown as X` en ejecución?* Nada: se borra al compilar.
- **🔐 Pendiente de Sebas:** confirmar en Resend → API Keys que la key en uso no
  es la que se filtró. Si lo es: revocarla, crear una nueva, pegarla en `.env` y
  reiniciar el dev server.

## Bug 3 ✍️ — "Error de conexión" falso ✅

- **Hipótesis:** en `handleSendEmail` (`_index.tsx`), `e.currentTarget.reset()`
  va después del `await`. Para entonces `currentTarget` ya es `null`, se lanza un
  TypeError y el `catch` muestra "Error de conexión." aunque el correo sí salió.
- **Diagnóstico:** confirmado. Sebas reprodujo el síntoma exacto: el correo
  llegaba y la pantalla igual mostraba "Error de conexión.". En
  `node_modules/react-dom/cjs/react-dom.development.js:9038-9043`,
  `executeDispatch` pone `event.currentTarget = currentTarget` antes de llamar
  al handler y `event.currentTarget = null` justo después. Una función `async`
  le devuelve el control a React en el primer `await`, así que para React el
  handler "ya terminó" cuando el `fetch` todavía está en vuelo.
- **Causa raíz:** `e.currentTarget` se leía antes del `await` (línea 186, OK) y
  otra vez después del `await` (línea 200, el bug). En el segundo punto React ya
  puso `currentTarget` en `null`. `null.reset()` lanza un TypeError que el
  `catch {}` (sin variable) se traga en silencio, y ese catch pone "Error de
  conexión." aunque el fetch ya haya tenido éxito. TypeScript no lo marcó porque
  el tipo de `currentTarget` es `HTMLFormElement` (nunca `null`): el tipo describe
  el valor en el instante en que escribes la expresión, no lo que React hace con
  el objeto evento después.
- **Fix (lo escribió Sebas):** guardar `e.currentTarget` en una variable propia
  (`const form = e.currentTarget;`) antes del `await`, y usar `form` en los dos
  lugares (`new FormData(form)` y `form.reset()`) en vez de volver a leer
  `e.currentTarget`. El primer intento de Sebas solo cambió el `FormData` y dejó
  `e.currentTarget.reset()` intacto, así que el bug seguía igual; con `form.reset()`
  en la línea 200 quedó resuelto.
- **Cómo verificar:**
  1. Enviar el formulario con un correo y un mensaje: debe aparecer
     "¡Mensaje enviado con éxito!", los campos deben vaciarse y el correo debe
     llegar.
  2. DevTools → Network → Offline, enviar de nuevo: debe seguir apareciendo
     "Error de conexión." para un fallo de red real (y no por el bug).
- **Pregunta de entrevista:** ¿por qué `e.currentTarget` puede ser `null` después
  de un `await` dentro de un event handler de React, y por qué TypeScript no lo
  avisa?

## Bug 4 — Typecheck en verde ✅

- **Hipótesis:** hay errores en la línea base, incluido `product: any` en el
  carrusel (debe usar los tipos que genera codegen para `HomepageProducts`).
- **Diagnóstico:**
  - Los 3 errores de la línea base son de 3 fragmentos GraphQL que no existen
    en ningún query del proyecto: `ProductFragment`, `ProductVariantFragment`,
    `RecommendedProductFragment`. Confirmado con
    `grep -n "^export type.*Fragment" storefrontapi.generated.d.ts`: ninguno
    de los tres aparece.
  - `ProductForm.tsx` y `ProductImage.tsx` (los dos primeros errores) son
    componentes que **nadie importa** (`grep -rln "ProductForm\|ProductImage"`
    solo encontró sus propios archivos). Sobraron del template original de
    Hydrogen al recortar la tienda.
  - `ProductItem.tsx` (tercer error) **sí se usa**, en
    `collections.$handle.tsx` y `collections.all.tsx`, pero en ambos casos
    solo se le pasa `CollectionItemFragment` o `ProductItemFragment`.
    `RecommendedProductFragment` normalmente vendría de una sección de
    "productos recomendados" en la página de producto, que esta tienda nunca
    tuvo.
  - `product: any` en el carrusel de `_index.tsx:276` no era un error de
    `tsc` (un `any` explícito nunca lo es), pero anulaba a mano el tipo
    correcto que ya generaba codegen: `HomepageProductsQuery['products']['nodes']`
    (visible en `storefrontapi.generated.d.ts:384-403`), inferido vía
    `useLoaderData<typeof loader>()`.
- **Causa raíz:** restos de tipos del template estándar de Hydrogen que
  quedaron sin limpiar al recortar la tienda a una sola categoría de producto
  (camisetas), más una anotación `any` innecesaria que tapaba un tipo que ya
  estaba bien generado.
- **Fix:**
  - Se borraron `ProductForm.tsx` y `ProductImage.tsx` (código muerto, 0
    referencias).
  - En `ProductItem.tsx` se quitó `RecommendedProductFragment` del import y
    de la unión de tipos del prop `product`.
  - En `_index.tsx:276` se quitó `: any` (y `: number` del índice, también
    redundante) para que TypeScript infiera el tipo real desde el loader.
- **Cómo verificar:** `npx tsc --noEmit` debe salir en 0 errores. Como los
  cambios son solo de tipos o borrado de código sin uso, no debe verse ningún
  cambio visual: la home con su carrusel y `/collections/...` deben verse
  igual que antes.
- **Pregunta de entrevista:** ¿por qué un `any` explícito nunca aparece como
  error de `tsc`, aunque apague el chequeo de tipos en esa variable?

> Nota aparte, no es parte de este bug: `app/routes/products.$handle.tsx`
> define su propio `LoaderArgs` con `context: any` en vez de usar
> `Route.LoaderArgs` de `./+types/products.$handle`. No es un error de
> `tsc` y no estaba en la lista de bugs, así que se deja así. Si quieres, lo
> agrego como un bug nuevo.

## Bug 5 ✍️ — El cursor desaparece al recargar o al volver de un producto ✅

> Se adelantó antes del Bug 3: los dos tocan `_index.tsx`, y Sebas ya tenía
> escrito el fix del cursor. Así cada bug queda en su propio commit.

- **Hipótesis:** si `sessionStorage` tiene `porto_loaded`, el primer `useEffect`
  hace `return` antes de registrar el `mousemove` del cursor custom, pero
  `* { cursor: none !important; }` sigue activo. Además, el listener nunca se quita.
- **Diagnóstico (código original, commit `9622483`):**
  - Confirmado: `_index.tsx:48-51` hace `return` si existe `porto_loaded`,
    **antes** del `addEventListener('mousemove', ...)` de la línea 64.
  - Confirmado: `_index.tsx:208` oculta el cursor nativo con
    `* { cursor: none !important; }`, y lo hace siempre.
  - Confirmado: el listener era una función anónima y el cleanup del efecto solo
    hacía `clearInterval`. Nunca se quitaba, y no se podía quitar porque
    `removeEventListener` necesita la misma referencia.
  - Agravante: `entry.client.tsx:14` usa `<StrictMode>`, que en desarrollo monta,
    desmonta y vuelve a montar los efectos. Con el código viejo quedaban 2
    listeners en la primera carga de cada pestaña.
- **Causa raíz:** un solo `useEffect` hacía dos cosas (preloader y cursor), y el
  `return` temprano pensado para saltarse el preloader también se saltaba el
  cursor. Tras recargar o volver de un producto, el cursor nativo seguía oculto
  y el custom no se movía: no había cursor visible.
- **Fix (escrito por Sebas):** el cursor pasa a un `useEffect` propio, con
  dependencias `[]`, que no depende de `porto_loaded`. El handler tiene nombre
  (`onMouseMove`) y el cleanup lo quita con `removeEventListener`. El bloque viejo
  sale del efecto del preloader.
- **Revisión:**
  - ✅ Los refs existen al montar: `cursor-dot` y `cursor-follower` se
    renderizan sin condición (`_index.tsx:228-229`).
  - ✅ Typecheck: los mismos 3 errores de la línea base (0 nuevos).
  - ✅ ESLint (con la API de Node, comparando `HEAD` con la versión nueva): 6
    problemas antes y los mismos 6 después; ninguno en las líneas 42-72.
  - Detalles no bloqueantes: (1) la línea 71 quedó con 4 espacios y sin código,
    lo que mete ruido en el diff; (2) el formato no sigue el del resto del archivo
    (`()=>{`, `follower=`, `!dot||!follower`, la sangría del cuerpo, falta `;`
    después de la función). Se pueden alinear en el Bug 8, que vuelve a tocar
    estos efectos. (3) Los `quickTo` no se matan en el cleanup; queda para el
    Bug 8 (`gsap.context` + `revert`).
- **Cómo verificar (navegador):** en la misma pestaña, con `porto_loaded` ya
  guardado, F5 → el punto y el círculo siguen al mouse. Ir a un producto y
  volver → el cursor sigue funcionando. En la consola de DevTools,
  `getEventListeners(window).mousemove` en la home → 1 listener; en la PDP →
  `undefined` (el cleanup lo quitó).
- **Pregunta de entrevista:** *"¿Por qué un `useEffect` que agrega un event
  listener tiene que devolver una función de limpieza, y qué pasa en desarrollo
  con StrictMode si no lo hace?"* Puntos clave: el cleanup corre al desmontar y
  antes de volver a ejecutar el efecto; StrictMode ejecuta los efectos dos veces
  en desarrollo justo para destapar cleanups que faltan; `removeEventListener`
  necesita la misma referencia (una función anónima no se puede quitar); un
  `return` temprano corta todo lo que viene después, así que conviene un efecto
  por responsabilidad.

## Bug 6 ✍️ — `@studio-freight/lenis` deprecado ✅

- **Hipótesis:** el paquete ahora se llama `lenis`. Hay que migrar sin cambiar
  el comportamiento.
- **Diagnóstico:**
  - `package.json` tenía `@studio-freight/lenis@^1.0.42`, la última versión que
    ese paquete publicó. Solo un archivo lo importaba (`grep -rln
    "studio-freight" app/` → únicamente `_index.tsx:7`).
  - Los mismos autores (darkroom.engineering) republicaron Lenis sin el scope,
    como el paquete `lenis`, activamente mantenido (`npm view lenis version` →
    `1.3.27`).
  - Se descargó el paquete nuevo (`npm pack lenis`) y se comparó su API contra
    el código: mismo export default, mismo constructor, y las 3 opciones en
    uso (`duration`, `easing`, `smoothWheel`) siguen existiendo con el mismo
    nombre y el mismo valor por default. Reemplazo 1 a 1, sin cambios de
    comportamiento.
- **Causa raíz:** deuda técnica — el proyecto dependía de un paquete
  abandonado cuando existe el mismo paquete, del mismo autor, mantenido bajo
  otro nombre.
- **Fix (lo escribió Sebas):**
  - `npm uninstall @studio-freight/lenis && npm install lenis`.
  - En `_index.tsx:7`: `import Lenis from 'lenis';` en vez de
    `from '@studio-freight/lenis'`.
  - En el primer intento, el `npm install lenis` no llegó a correr (quedó sin
    rastro en `package.json`, `package-lock.json` y `node_modules`): Claude lo
    detectó comparando los tres contra lo que debía verse, y Sebas lo volvió a
    correr.
- **Cómo verificar:** scroll de la home debe sentirse exactamente igual que
  antes (mismo "smooth scroll"), sin errores nuevos en consola.
  `npx tsc --noEmit` → 0 errores. ESLint sobre `_index.tsx` → mismos 6
  problemas de la línea base, ninguno nuevo.
- **Pregunta de entrevista:** ¿por qué se pudo cambiar de paquete sin tocar
  ninguna otra línea del código de scroll? ¿Qué hay que revisar siempre antes
  de aceptar un cambio de dependencia así en un proyecto real?

> Nota: quedó una carpeta huérfana `node_modules/@studio-freight/` en disco
> (el `npm uninstall` no la borró, probablemente porque el dev server tenía
> algún archivo abierto). No está en git (`node_modules` está en
> `.gitignore`) y no afecta nada; se puede borrar a mano o se limpia sola en
> la próxima instalación limpia.

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
- **Avisos del build (viene del Bug 1):** `[plugin hydrogen:bundle-analyzer]
  Error: This plugin assigns to bundle variable... not supported by Rolldown`
  y "Could not generate bundle analysis summary". Son del plugin de análisis del
  Shopify CLI con Vite 8/Rolldown: el build termina bien (exit 0). No es de
  nuestro código.
- **Línea base de ESLint en `_index.tsx` (viene del Bug 5), 6 problemas:**
  `import/no-named-as-default` (import de `gsap`), 2× `@typescript-eslint/no-misused-promises`
  (una promesa dentro de un listener, y `onSubmit={handleSendEmail}` es async),
  `react/no-array-index-key`, 2× `react/no-unescaped-entities` (comillas `"` en
  el JSX). Ojo: `git show ... | npx eslint --stdin` en Git Bash rompe las tildes y
  da cientos de falsos positivos; para comparar hay que usar la API de Node
  (`ESLint.lintText`).

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
