import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getDeviceProfile } from "../utils/deviceProfile";

export function VisualLayers() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const profile = getDeviceProfile();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(profile.dpr);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = profile.tier === "low" ? 220 : profile.tier === "mid" ? 320 : 450;
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

    const dunesSegments = profile.tier === "low" ? 0 : profile.tier === "mid" ? 32 : 64;
    const dunesGeometry =
      dunesSegments > 0 ? new THREE.PlaneGeometry(20, 6, dunesSegments, 16) : null;
    const dunesMaterial =
      dunesGeometry && new THREE.MeshBasicMaterial({
        color: 0x0f2f3b,
        transparent: true,
        opacity: 0.5,
        wireframe: true
      });
    const dunes =
      dunesGeometry && dunesMaterial ? new THREE.Mesh(dunesGeometry, dunesMaterial) : null;
    if (dunes) {
      dunes.position.set(0, -3.5, -2.5);
      dunes.rotation.x = -0.55;
      scene.add(dunes);
    }

    let frameId = 0;
    let isRunning = true;
    let lastFrame = 0;
    let fpsSamples = 0;
    let fpsAccum = 0;
    const logStats = import.meta.env.VITE_DEBUG_STATS === "true";

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };
    resize();

    const animate = (time: number) => {
      if (!isRunning) return;
      const delta = time - lastFrame;
      const minFrame = 1000 / profile.maxFps;
      if (delta < minFrame) {
        frameId = requestAnimationFrame(animate);
        return;
      }
      lastFrame = time;
      const t = time * 0.0003;
      stars.rotation.y = t * 0.4;
      stars.rotation.x = Math.sin(t) * 0.08;

      if (dunesGeometry) {
        const pos = dunesGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = Math.sin(x * 0.4 + t * 4) * 0.15 + Math.cos(y * 0.6 + t * 3) * 0.12;
          pos.setZ(i, z);
        }
        pos.needsUpdate = true;
      }

      renderer.render(scene, camera);
      if (logStats) {
        fpsAccum += delta;
        fpsSamples += 1;
        if (fpsSamples >= 60) {
          const fps = Math.round(1000 / (fpsAccum / fpsSamples));
          // eslint-disable-next-line no-console
          console.log(`[VisualLayers] FPS ~ ${fps}`);
          fpsSamples = 0;
          fpsAccum = 0;
        }
      }
      frameId = requestAnimationFrame(animate);
    };

    if (!profile.prefersReducedMotion) {
      frameId = requestAnimationFrame(animate);
    } else {
      renderer.render(scene, camera);
    }

    const handleVisibility = () => {
      const shouldRun = document.visibilityState === "visible" && !profile.prefersReducedMotion;
      if (shouldRun && !isRunning) {
        isRunning = true;
        frameId = requestAnimationFrame(animate);
      } else if (!shouldRun && isRunning) {
        isRunning = false;
        cancelAnimationFrame(frameId);
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isRunning = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      starsGeometry.dispose();
      starsMaterial.dispose();
      if (dunesGeometry) dunesGeometry.dispose();
      if (dunesMaterial) dunesMaterial.dispose();
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
          pointerEvents: "none"
        }}
      >
        <svg
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.18,
            filter: "drop-shadow(0 0 10px rgba(212,175,55,0.15))"
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
              fontFamily: "var(--font-arabic)",
              letterSpacing: "0.08em",
              animation: `floatY ${10 + index * 3}s ease-in-out infinite`,
              mixBlendMode: "screen"
            }}
          >
            {item.text}
          </span>
        ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            maskImage:
              "radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 80%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 80%)"
          }}
        >
        </div>
      </div>
    </>
  );
}
