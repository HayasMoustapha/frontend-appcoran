type ClientLogPayload = {
  message: string;
  source?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
};

let lastSentAt = 0;

function safeSend(payload: ClientLogPayload) {
  const now = Date.now();
  if (now - lastSentAt < 1500) return;
  lastSentAt = now;

  const body = JSON.stringify({
    ...payload,
    url: window.location.href,
    userAgent: navigator.userAgent
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/logs/client-error", blob);
    return;
  }

  fetch("/api/logs/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  }).catch(() => {
    // best effort only
  });
}

export function initClientErrorLogging() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    safeSend({
      message: event.message || "UI runtime error",
      source: event.filename,
      stack: event.error?.stack
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    safeSend({
      message: reason?.message || String(reason) || "Unhandled promise rejection",
      stack: reason?.stack
    });
  });
}
