import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

let registered = false;

/**
 * Punto único de entrada a GSAP.
 *
 * ScrollTrigger necesita el DOM, y este código también se importa en el
 * servidor (SSR). Por eso el plugin se registra la primera vez que alguien lo
 * pide desde el navegador, y no al cargar el módulo.
 */
export function getMotion() {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return {gsap, ScrollTrigger};
}
