import {useEffect, useRef, type MutableRefObject} from 'react';
import * as THREE from 'three';

/**
 * Esfera de 5000 puntos dibujada con WebGL (Three.js). No carga ningún
 * modelo: la forma se calcula aquí y un shader la deforma. El scroll no la
 * mueve directamente: el padre escribe el avance (0..1) en `progressRef` y
 * este componente lo lee en cada frame. Así React no re-renderiza por scroll.
 *
 * Solo se importa en el navegador (ver HeroStage): Three.js necesita
 * `window` y en el servidor no existe.
 */
export default function ThreeScene({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({antialias: false, alpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.z = 6;

    // Puntos repartidos de forma pareja sobre la esfera (espiral de Fibonacci).
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: {value: 0},
        uProgress: {value: 0},
        uPixelRatio: {value: renderer.getPixelRatio()},
        uCameraZ: {value: camera.position.z},
        uColor: {value: new THREE.Color('#ffffff')},
        uAccent: {value: new THREE.Color('#8fa6ff')},
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uProgress;
        uniform float uPixelRatio;
        uniform float uCameraZ;
        attribute float aSeed;
        varying float vSeed;
        varying float vDepth;

        // Ruido barato: tres senos cruzados. Suficiente para que "respire".
        float wave(vec3 p, float t) {
          return sin(p.x * 3.0 + t) * sin(p.y * 2.7 - t * 0.8) * sin(p.z * 3.3 + t * 0.6);
        }

        void main() {
          vSeed = aSeed;
          vec3 p = position;
          float breath = wave(p, uTime * 0.6);
          // Al avanzar el scroll la esfera se abre: cada punto sale por su normal.
          float burst = uProgress * uProgress * (0.9 + aSeed * 1.8);
          p += normalize(position) * (breath * 0.12 + burst);
          float a = uTime * 0.12 + uProgress * 1.4;
          p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
          // Más grandes los de adelante: perspectiva.
          gl_PointSize = (2.4 + aSeed * 2.4) * uPixelRatio * (uCameraZ / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uAccent;
        uniform float uProgress;
        uniform float uCameraZ;
        varying float vSeed;
        varying float vDepth;

        void main() {
          // Cada punto es un círculo, no un cuadrado.
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float edge = smoothstep(0.5, 0.3, d);
          // Un 12% de los puntos lleva el acento; los demás, blanco.
          vec3 color = vSeed > 0.88 ? uAccent : uColor;
          // Los de atrás se ven más tenues: da profundidad.
          // La esfera mide 1 de radio: su profundidad va de uCameraZ-1 a +1.
          float fade = mix(0.25, 1.0, smoothstep(uCameraZ + 1.2, uCameraZ - 1.2, vDepth));
          gl_FragColor = vec4(color, edge * fade * (1.0 - uProgress * 0.6));
        }
      `,
    });

    scene.add(new THREE.Points(geometry, material));

    const resize = () => {
      const {clientWidth: w, clientHeight: h} = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // En pantallas verticales la cámara se aleja para que la esfera quepa.
      camera.position.z = w < h ? 8.5 : 6;
      material.uniforms.uCameraZ.value = camera.position.z;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    // Solo se dibuja mientras la escena está en pantalla.
    let visible = true;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(host);

    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uProgress.value = progressRef.current;
      renderer.render(scene, camera);
    };
    tick();

    // Todo lo que se creó en la GPU se libera al salir de la página.
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progressRef]);

  return <div ref={hostRef} className="hero__canvas" aria-hidden="true" />;
}
