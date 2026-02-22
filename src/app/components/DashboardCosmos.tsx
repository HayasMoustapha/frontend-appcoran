import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getDeviceProfile } from "../utils/deviceProfile";

interface DashboardCosmosProps {
  listens: number;
  downloads: number;
  likes: number;
  recitations: number;
  mode?: "calm" | "spectacular";
  themeMode?: "light" | "dark";
  boost?: number;
}

export function DashboardCosmos({
  listens,
  downloads,
  likes,
  recitations,
  mode = "calm",
  themeMode = "dark",
  boost = 0
}: DashboardCosmosProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef({ listens, downloads, likes, recitations });

  useEffect(() => {
    metricsRef.current = { listens, downloads, likes, recitations };
  }, [listens, downloads, likes, recitations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const profile = getDeviceProfile();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: profile.tier !== "low",
      powerPreference: profile.tier === "low" ? "low-power" : "high-performance"
    });
    renderer.setPixelRatio(profile.dpr);

    const group = new THREE.Group();
    scene.add(group);

    const palette = themeMode === "light"
      ? {
          core: 0x0f766e,
          emissive: 0xd4af37,
          halo: 0x0f766e,
          ring: 0x10b981
        }
      : {
          core: 0xd4af37,
          emissive: 0x0f766e,
          halo: 0xf5d76e,
          ring: 0x2dd4bf
        };

    const coreSegments = profile.tier === "low" ? 16 : profile.tier === "mid" ? 22 : 28;
    const coreGeometry = new THREE.SphereGeometry(1.35, coreSegments, coreSegments);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: palette.core,
      emissive: palette.emissive,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.4
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const haloSegments = profile.tier === "low" ? 48 : profile.tier === "mid" ? 70 : 90;
    const haloGeometry = new THREE.TorusGeometry(2.4, 0.06, 16, haloSegments);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: palette.halo,
      transparent: true,
      opacity: 0.4
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = Math.PI / 2.4;
    group.add(halo);

    const ringSegments = profile.tier === "low" ? 90 : profile.tier === "mid" ? 140 : 200;
    const ringGeometry = new THREE.TorusGeometry(3.2, 0.02, 16, ringSegments);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: palette.ring,
      transparent: true,
      opacity: 0.22
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2.1;
    ring.rotation.y = Math.PI / 3;
    group.add(ring);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = profile.tier === "low" ? 300 : profile.tier === "mid" ? 520 : 780;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const colorA = new THREE.Color(palette.core);
    const colorB = new THREE.Color(palette.ring);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 18;
      positions[idx + 1] = (Math.random() - 0.5) * 12;
      positions[idx + 2] = (Math.random() - 0.5) * 10;

      const mix = Math.random();
      const c = colorA.clone().lerp(colorB, mix);
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: themeMode === "light" ? 0.55 : 0.7
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const lightA = new THREE.PointLight(palette.core, themeMode === "light" ? 0.9 : 1.2, 20);
    lightA.position.set(4, 3, 6);
    scene.add(lightA);

    const lightB = new THREE.PointLight(palette.emissive, themeMode === "light" ? 0.85 : 1.0, 20);
    lightB.position.set(-4, -2, 6);
    scene.add(lightB);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    let frameId = 0;
    let isRunning = true;
    let lastFrame = 0;
    let fpsSamples = 0;
    let fpsAccum = 0;
    let dynamicMaxFps = profile.maxFps;
    let lowFpsStrikes = 0;
    const logStats = import.meta.env.VITE_DEBUG_STATS === "true";
    const pointer = { x: 0, y: 0 };

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    let pointerFrame = 0;
    const pointerEvery = profile.tier === "low" ? 3 : 1;
    const onPointerMove = (event: PointerEvent) => {
      pointerFrame += 1;
      if (pointerFrame % pointerEvery !== 0) return;
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.8;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * -0.6;
    };
    container.addEventListener("pointermove", onPointerMove, { passive: true });

    const animate = (time: number) => {
      if (!isRunning) return;
      const delta = time - lastFrame;
      const minFrame = 1000 / dynamicMaxFps;
      if (delta < minFrame) {
        frameId = requestAnimationFrame(animate);
        return;
      }
      lastFrame = time;
      const baseSpeed = mode === "spectacular" ? 0.00065 : 0.00032;
      const t = time * baseSpeed;
      const boostFactor = boost ? 0.25 + boost * 0.35 : 0;
      const { listens, downloads, likes, recitations } = metricsRef.current;
      const energy =
        Math.log10(listens + downloads + 1) * 0.22 +
        Math.log10(likes + 1) * 0.18 +
        Math.log10(recitations + 1) * 0.12;

      core.scale.setScalar(1 + Math.sin(t * 2) * 0.035 + energy * 0.03 + boostFactor * 0.02);
      coreMaterial.emissiveIntensity = 0.35 + energy * 0.3 + boostFactor * 0.35;

      group.rotation.y = t * (mode === "spectacular" ? 1.1 : 0.6) + energy * 0.2;
      group.rotation.x = Math.sin(t * 0.6) * (mode === "spectacular" ? 0.2 : 0.12);
      halo.rotation.z = t * (mode === "spectacular" ? 1.6 : 0.8);
      ring.rotation.z = -t * (mode === "spectacular" ? 1.1 : 0.5);

      stars.rotation.y = t * 0.12 + energy * 0.1 + boostFactor * 0.06;
      stars.rotation.x = Math.sin(t * 0.4) * 0.05;

      camera.position.x += (pointer.x - camera.position.x) * 0.03;
      camera.position.y += (pointer.y - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      fpsAccum += delta;
      fpsSamples += 1;
      if (fpsSamples >= 60) {
        const fps = Math.round(1000 / (fpsAccum / fpsSamples));
        if (fps < profile.maxFps * 0.6) {
          dynamicMaxFps = Math.max(18, Math.round(dynamicMaxFps - 8));
        } else if (fps > profile.maxFps * 0.9) {
          dynamicMaxFps = profile.maxFps;
        }
        if (fps < 20) {
          lowFpsStrikes += 1;
        } else {
          lowFpsStrikes = 0;
        }
        if (logStats) {
          // eslint-disable-next-line no-console
          console.log(`[DashboardCosmos] FPS ~ ${fps}`);
        }
        fpsSamples = 0;
        fpsAccum = 0;
        if (lowFpsStrikes >= 2) {
          isRunning = false;
          cancelAnimationFrame(frameId);
          renderer.render(scene, camera);
          return;
        }
      }
      frameId = requestAnimationFrame(animate);
    };
    if (!profile.prefersReducedMotion) {
      frameId = requestAnimationFrame(animate);
    } else {
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

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

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !profile.prefersReducedMotion) {
          if (!isRunning) {
            isRunning = true;
            frameId = requestAnimationFrame(animate);
          }
        } else if (!visible) {
          isRunning = false;
          cancelAnimationFrame(frameId);
        }
      },
      { threshold: 0.1 }
    );
    intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isRunning = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      coreGeometry.dispose();
      coreMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
