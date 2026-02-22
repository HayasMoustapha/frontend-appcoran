type DeviceProfile = {
  tier: "low" | "mid" | "high";
  maxFps: number;
  dpr: number;
  prefersReducedMotion: boolean;
};

export function getDeviceProfile(): DeviceProfile {
  if (typeof window === "undefined") {
    return { tier: "high", maxFps: 60, dpr: 1, prefersReducedMotion: false };
  }

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cpuCores = navigator.hardwareConcurrency || 4;
  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820;

  const isLowPower =
    prefersReducedMotion || deviceMemory <= 4 || cpuCores <= 4 || isSmallScreen;

  const tier: DeviceProfile["tier"] = isLowPower
    ? "low"
    : deviceMemory <= 6 || cpuCores <= 6
    ? "mid"
    : "high";

  const maxDpr = tier === "high" ? 1.5 : tier === "mid" ? 1.25 : 1;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const maxFps = tier === "low" ? 24 : tier === "mid" ? 40 : 60;

  return { tier, maxFps, dpr, prefersReducedMotion };
}
