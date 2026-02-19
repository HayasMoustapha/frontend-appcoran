import { post } from "./client";
import { setAuthToken, clearAuthToken } from "./storage";

export async function login(email: string, password: string) {
  const result = await post<{ token: string; refreshToken?: string | null }>(
    "/api/auth/login",
    { email, password }
  );
  if (result?.token) {
    setAuthToken(result.token);
  }
  return result;
}

export function logout() {
  clearAuthToken();
}
