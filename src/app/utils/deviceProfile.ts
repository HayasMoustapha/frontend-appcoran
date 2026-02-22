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

  const dpr = Math.min(window.devicePixelRatio || 1, tier === "high" ? 2 : 1);
  const maxFps = tier === "low" ? 30 : tier === "mid" ? 45 : 60;

  return { tier, maxFps, dpr, prefersReducedMotion };
}
