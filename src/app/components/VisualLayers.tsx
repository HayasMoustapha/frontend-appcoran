import { useEffect, useRef } from "react";
import * as THREE from "three";

export function VisualLayers() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 450;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorA = new THREE.Color(0xd4af37);
    const colorB = new THREE.Color(0x0f766e);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 18;
      positions[idx + 1] = (Math.random() - 0.5) * 10;
      positions[idx + 2] = (Math.random() - 0.5) * 12;

      const mix = Math.random();
      const c = colorA.clone().lerp(colorB, mix);
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.65
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const deepStarsGeometry = new THREE.BufferGeometry();
    const deepCount = 220;
    const deepPositions = new Float32Array(deepCount * 3);
    for (let i = 0; i < deepCount; i++) {
      const idx = i * 3;
      deepPositions[idx] = (Math.random() - 0.5) * 24;
      deepPositions[idx + 1] = (Math.random() - 0.5) * 14;
      deepPositions[idx + 2] = -6 - Math.random() * 8;
    }
    deepStarsGeometry.setAttribute("position", new THREE.BufferAttribute(deepPositions, 3));
    const deepStarsMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: new THREE.Color(0xf8f6f1),
      transparent: true,
      opacity: 0.4
    });
    const deepStars = new THREE.Points(deepStarsGeometry, deepStarsMaterial);
    scene.add(deepStars);

    const haloMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xd4af37) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv) * 2.0;
          float glow = smoothstep(1.0, 0.0, dist);
          float pulse = 0.65 + 0.35 * sin(uTime * 2.0);
          float alpha = glow * pulse;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), haloMaterial);
    halo.position.set(2.5, 1.2, -3);
    scene.add(halo);

    const dunesGeometry = new THREE.PlaneGeometry(20, 6, 64, 16);
    const dunesMaterial = new THREE.MeshBasicMaterial({
      color: 0x0f2f3b,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    const dunes = new THREE.Mesh(dunesGeometry, dunesMaterial);
    dunes.position.set(0, -3.5, -2.5);
    dunes.rotation.x = -0.55;
    scene.add(dunes);

    let frameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handlePointer = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      targetX = x * 0.3;
      targetY = y * 0.2;
      canvas.style.setProperty("--mouse-x", `${event.clientX}px`);
      canvas.style.setProperty("--mouse-y", `${event.clientY}px`);
    };

    const handleScroll = () => {
      const scroll = window.scrollY / (window.innerHeight || 1);
      const depth = Math.min(scroll * 0.3, 1.2);
      camera.position.z = 8 + depth;
      dunes.position.y = -3.5 - depth * 0.6;
    };

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };
    resize();

    const animate = () => {
      const time = performance.now() * 0.0003;
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      stars.rotation.y = time * 0.4;
      stars.rotation.x = Math.sin(time) * 0.08;
      stars.position.x = currentX * 0.6;
      stars.position.y = currentY * 0.6;
      deepStars.position.x = currentX * 0.2;
      deepStars.position.y = currentY * 0.2;
      halo.position.x = 2.5 + currentX * 1.2;
      halo.position.y = 1.2 + currentY * 1.2;
      haloMaterial.uniforms.uTime.value = time * 4.0;

      const pos = dunesGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = Math.sin(x * 0.4 + time * 4) * 0.15 + Math.cos(y * 0.6 + time * 3) * 0.12;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointer);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      starsGeometry.dispose();
      starsMaterial.dispose();
      deepStarsGeometry.dispose();
      deepStarsMaterial.dispose();
      haloMaterial.dispose();
      dunesGeometry.dispose();
      dunesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(200px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212,175,55,0.18), transparent 70%)"
        }}
      >
        <svg
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.22,
            filter: "drop-shadow(0 0 12px rgba(212,175,55,0.2))",
            transform: `translate(calc(var(--mouse-x, 50%) * 0.002), calc(var(--mouse-y, 50%) * 0.002))`
          }}
        >
          <defs>
            <pattern id="arabesque" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M60 10 L75 45 L110 60 L75 75 L60 110 L45 75 L10 60 L45 45 Z"
                fill="none"
                stroke="rgba(212,175,55,0.5)"
                strokeWidth="1.4"
                strokeDasharray="6 10"
                strokeLinecap="round"
              />
              <circle cx="60" cy="60" r="18" fill="none" stroke="rgba(248,246,241,0.3)" strokeWidth="1" />
              <path
                d="M60 22 C80 40 80 80 60 98 C40 80 40 40 60 22 Z"
                fill="none"
                stroke="rgba(212,175,55,0.35)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arabesque)">
            <animate attributeName="opacity" values="0.12;0.26;0.12" dur="14s" repeatCount="indefinite" />
          </rect>
        </svg>
        <svg
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.15,
            filter: "drop-shadow(0 0 8px rgba(248,246,241,0.2))",
            animation: "starDrift 22s ease-in-out infinite reverse",
            transform: `translate(calc(var(--mouse-x, 50%) * -0.0015), calc(var(--mouse-y, 50%) * -0.0015))`
          }}
        >
          <defs>
            <pattern id="arabesque2" width="160" height="160" patternUnits="userSpaceOnUse">
              <path
                d="M80 12 L98 56 L148 80 L98 104 L80 148 L62 104 L12 80 L62 56 Z"
                fill="none"
                stroke="rgba(248,246,241,0.25)"
                strokeWidth="1"
                strokeDasharray="8 12"
              />
              <circle cx="80" cy="80" r="22" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arabesque2)" />
        </svg>
        {[
          { text: "ٱلْحَمْدُ لِلَّٰهِ", top: "18%", left: "12%" },
          { text: "بِسْمِ ٱللَّٰهِ", top: "42%", left: "78%" },
          { text: "الرَّحْمَٰن", top: "70%", left: "25%" }
        ].map((item, index) => (
          <span
            key={item.text}
            style={{
              position: "absolute",
              top: item.top,
              left: item.left,
              color: "rgba(212,175,55,0.3)",
              fontSize: "clamp(18px, 2.6vw, 36px)",
              fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
              letterSpacing: "0.08em",
              animation: `floatY ${10 + index * 3}s ease-in-out infinite`,
              mixBlendMode: "screen"
            }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </>
  );
}
