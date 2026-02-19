import { get } from "./client";

export async function checkHealth() {
  return get<{ status: string }>("/health");
}
