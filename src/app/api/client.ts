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

function resolveBaseUrl(
  fallbackPort: string,
  envValue?: string
): string {
  const runtimeHost =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const runtimeProtocol =
    typeof window !== "undefined" ? window.location.protocol : "http:";

  const envUrl = envValue || "";
  if (envUrl.startsWith("/")) {
    return `${runtimeProtocol}//${runtimeHost}${envUrl}`;
  }
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return `${runtimeProtocol}//${runtimeHost}:${fallbackPort}`;
  }
  return envUrl;
}

function resolvePublicBaseUrl(envValue?: string): string {
  const runtimeHost =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const runtimeProtocol =
    typeof window !== "undefined" ? window.location.protocol : "http:";
  const origin = `${runtimeProtocol}//${runtimeHost}`;
  const envUrl = (envValue || "").trim();

  if (!envUrl) {
    return origin;
  }
  if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
    return envUrl;
  }
  if (envUrl === "/" || envUrl === "/api" || envUrl === "/api/") {
    return origin;
  }
  if (envUrl.startsWith("/")) {
    return `${origin}${envUrl}`;
  }
  return envUrl;
}

export const API_BASE_URL = resolveBaseUrl(
  "4000",
  import.meta.env.VITE_API_BASE_URL
);

export const PUBLIC_BASE_URL = resolvePublicBaseUrl(
  import.meta.env.VITE_PUBLIC_BASE_URL
);

function getLang() {
  if (typeof window === "undefined") return "fr";
  return localStorage.getItem("appcoran-lang") || "fr";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    ...(options.headers ?? {})
  };
  if (method === "GET") {
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

  let response: Response | null = null;
  const maxAttempts = method === "GET" ? 2 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body ?? null,
        cache: method === "GET" ? "no-store" : "default"
      });
      if (
        method === "GET" &&
        response.status >= 500 &&
        attempt < maxAttempts - 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }
      break;
    } catch (err) {
      if (attempt >= maxAttempts - 1) {
        throw new NetworkError();
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  if (!response) {
    throw new NetworkError();
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  let payload: unknown;
  if (isJson) {
    try {
      payload = await response.clone().json();
    } catch (err) {
      payload = await response.text();
    }
  } else {
    payload = await response.text();
  }

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

export async function postFormWithProgress<T>(
  path: string,
  formData: FormData,
  options: RequestOptions = {},
  onProgress?: (progress: number) => void
) {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers ?? {})
  };
  const lang = getLang();
  headers["Accept-Language"] = lang;
  headers["X-Lang"] = lang;

  if (options.auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const next = Math.round((event.loaded / event.total) * 100);
      onProgress(next);
    };

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader("content-type") || "";
      const isJson = contentType.includes("application/json");
      let payload: unknown = xhr.responseText;
      if (isJson) {
        try {
          payload = JSON.parse(xhr.responseText || "null");
        } catch (err) {
          payload = null;
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
        return;
      }
      const message =
        typeof payload === "string"
          ? payload
          : (payload as { error?: string; message?: string })?.error ||
            (payload as { error?: string; message?: string })?.message ||
            "Erreur serveur";
      reject(new Error(message));
    };

    xhr.onerror = () => {
      reject(new NetworkError());
    };

    xhr.send(formData);
  });
}

export async function putForm<T>(path: string, formData: FormData, options: RequestOptions = {}) {
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: formData
  });
}
