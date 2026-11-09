@AGENTS.md
## Proyecto

PORTO Store: tienda headless de camisas de marca propia, para mi portafolio.
Stack: Shopify Hydrogen (React Router v7 + Vite), TypeScript, Storefront API con
datos de mock.shop. Local con MiniOxygen, deploy en Oxygen. Animaciones con GSAP
+ ScrollTrigger y Lenis. Windows + Git Bash.

El borrador lo generó una IA en una tarde; lo estoy auditando y apropiando para
poder explicarlo en una entrevista. Que yo entienda cada cambio importa más que
la velocidad.

## Cómo trabajar conmigo

- Explícame en español, nivel junior, para qué sirve cada cosa que tocas.
- Estructura: diagnóstico con evidencia (comando y salida, o archivo:línea) →
  causa raíz → fix mínimo → cómo lo verifico yo en el navegador.
- Muéstrame solo el diff, nunca reescrituras completas.
- Si te pido saltar pasos o tapar un síntoma, párame y dime por qué es un atajo.
- Verifica mis hipótesis contra el repo antes de actuar; si son falsas, dímelo
  con evidencia en vez de forzar el fix.
- No des por entendido algo porque ya lo explicaste una vez.

## Reglas del repo

- Cambios mínimos. No toques estilos, colores, tipografías ni textos, salvo que
  el bug sea justo eso.
- No agregues dependencias sin preguntarme.
- Nunca imprimas, copies, registres ni commitees el contenido de `.env` ni el
  valor de `RESEND_API_KEY`.
- No toques nada fuera de `hydrogen-front` sin mi permiso. No hagas push.
- Antes de levantar el dev server, pregúntame si ya lo tengo corriendo.
- Después de cada cambio, corre el typecheck y compáralo con la línea base.

## Commits

- Conventional Commits en inglés: `fix(home): ...`, `chore: ...`.
- Un commit por bug.
- Sin líneas `Co-Authored-By: Claude ...` ni `Claude-Session: ...`.