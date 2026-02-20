import { getAuthToken } from "./storage";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isNetworkError(error: unknown) {
  return error instanceof NetworkError;
}

type RequestOptions = {
  method?: HttpMethod;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  auth?: boolean;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const PUBLIC_BASE_URL =
  import.meta.env.VITE_PUBLIC_BASE_URL ?? API_BASE_URL;

function getLang() {
  if (typeof window === "undefined") return "fr";
  return localStorage.getItem("appcoran-lang") || "fr";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers ?? {})
  };
  if ((options.method ?? "GET") === "GET") {
    headers["Cache-Control"] = "no-cache";
    headers.Pragma = "no-cache";
    headers["Accept-Language"] = getLang();
    headers["X-Lang"] = getLang();
  }

  if (options.auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ?? null,
      cache: (options.method ?? "GET") === "GET" ? "no-store" : "default"
    });
  } catch (err) {
    throw new NetworkError();
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === "string"
        ? payload
        : payload?.error || payload?.message || "Erreur serveur";
    throw new Error(errorMessage);
  }

  return payload as T;
}

export function get<T>(path: string, options: RequestOptions = {}) {
  return request<T>(path, { ...options, method: "GET" });
}

export function post<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  return request<T>(path, {
    ...options,
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : null
  });
}

export function put<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  return request<T>(path, {
    ...options,
    method: "PUT",
    headers,
    body: body ? JSON.stringify(body) : null
  });
}

export function del<T>(path: string, options: RequestOptions = {}) {
  return request<T>(path, { ...options, method: "DELETE" });
}

export async function postForm<T>(path: string, formData: FormData, options: RequestOptions = {}) {
  return request<T>(path, {
    ...options,
    method: "POST",
    body: formData
  });
}

export async function putForm<T>(path: string, formData: FormData, options: RequestOptions = {}) {
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: formData
  });
}
