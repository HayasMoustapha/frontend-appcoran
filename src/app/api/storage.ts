const TOKEN_KEY = "appcoran_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type AuthPayload = {
  id?: string;
  role?: string;
  exp?: number;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

export function getAuthPayload(): AuthPayload | null {
  const token = getAuthToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload?: AuthPayload | null) {
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function getUserRole(): string | null {
  const payload = getAuthPayload();
  if (!payload || isTokenExpired(payload)) return null;
  return payload.role ?? null;
}

export function isAdminRole(role?: string | null) {
  return role === "admin" || role === "super-admin";
}
