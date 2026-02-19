import { get, postForm, putForm } from "./client";
import type { ApiPublicProfile } from "./types";

export async function getPublicProfile() {
  return get<ApiPublicProfile | null>("/public/profile");
}

export async function getProfile() {
  return get<ApiPublicProfile | null>("/api/profile", { auth: true });
}

export async function createProfile(formData: FormData) {
  return postForm<ApiPublicProfile>("/api/profile", formData, { auth: true });
}

export async function updateProfile(formData: FormData) {
  return putForm<ApiPublicProfile>("/api/profile", formData, { auth: true });
}
