import { useEffect, useRef } from "react";
import * as THREE from "three";

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

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const isLowPower = prefersReducedMotion || deviceMemory <= 4 || cpuCores <= 4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(isLowPower ? Math.min(1, dpr) : dpr);

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

    const coreGeometry = new THREE.SphereGeometry(1.35, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: palette.core,
      emissive: palette.emissive,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.4
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const haloGeometry = new THREE.TorusGeometry(2.4, 0.06, 16, 100);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: palette.halo,
      transparent: true,
      opacity: 0.4
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = Math.PI / 2.4;
    group.add(halo);

    const ringGeometry = new THREE.TorusGeometry(3.2, 0.02, 16, 220);
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
    const starCount = 900;
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
    const pointer = { x: 0, y: 0 };

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.8;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * -0.6;
    };
    container.addEventListener("pointermove", onPointerMove);

    const animate = () => {
      if (!isRunning) return;
      const baseSpeed = mode === "spectacular" ? 0.00065 : 0.00032;
      const time = performance.now() * baseSpeed;
      const boostFactor = boost ? 0.25 + boost * 0.35 : 0;
      const { listens, downloads, likes, recitations } = metricsRef.current;
      const energy =
        Math.log10(listens + downloads + 1) * 0.22 +
        Math.log10(likes + 1) * 0.18 +
        Math.log10(recitations + 1) * 0.12;

      core.scale.setScalar(1 + Math.sin(time * 2) * 0.035 + energy * 0.03 + boostFactor * 0.02);
      coreMaterial.emissiveIntensity = 0.35 + energy * 0.3 + boostFactor * 0.35;

      group.rotation.y = time * (mode === "spectacular" ? 1.1 : 0.6) + energy * 0.2;
      group.rotation.x = Math.sin(time * 0.6) * (mode === "spectacular" ? 0.2 : 0.12);
      halo.rotation.z = time * (mode === "spectacular" ? 1.6 : 0.8);
      ring.rotation.z = -time * (mode === "spectacular" ? 1.1 : 0.5);

      stars.rotation.y = time * 0.12 + energy * 0.1 + boostFactor * 0.06;
      stars.rotation.x = Math.sin(time * 0.4) * 0.05;

      camera.position.x += (pointer.x - camera.position.x) * 0.03;
      camera.position.y += (pointer.y - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    if (!prefersReducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const handleVisibility = () => {
      const shouldRun = document.visibilityState === "visible" && !prefersReducedMotion;
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
        if (visible && !prefersReducedMotion) {
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
