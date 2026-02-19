import { del, get, post, postForm } from "./client";
import type { ApiAudio, ApiPublicAudio } from "./types";

export async function listAudios() {
  return get<ApiAudio[]>("/api/audios");
}

export async function searchAudios(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return get<{ data: ApiAudio[]; total: number; page: number; limit: number }>(
    `/api/audios/search?${query.toString()}`
  );
}

export async function getPopular(limit = 10) {
  return get<ApiAudio[]>(`/api/audios/popular?limit=${limit}`);
}

export async function getRecent(limit = 10) {
  return get<ApiAudio[]>(`/api/audios/recent?limit=${limit}`);
}

export async function getTopListened(limit = 10) {
  return get<ApiAudio[]>(`/api/audios/top-listened?limit=${limit}`);
}

export async function getTopDownloaded(limit = 10) {
  return get<ApiAudio[]>(`/api/audios/top-downloaded?limit=${limit}`);
}

export async function getAudioById(id: string) {
  return get<ApiAudio>(`/api/audios/${id}`);
}

export async function getPublicAudioBySlug(slug: string) {
  return get<ApiPublicAudio>(`/public/audios/${slug}`);
}

export async function sharePublicAudio(slug: string) {
  return post<{ share_url: string }>(`/public/audios/${slug}/share`);
}

export async function uploadAudio(formData: FormData) {
  return postForm<ApiAudio>("/api/audios", formData, { auth: true });
}

export async function deleteAudio(id: string) {
  return del<{ status: string }>(`/api/audios/${id}`, { auth: true });
}

export async function updateAudio(id: string, payload: Partial<ApiAudio>) {
  return put<ApiAudio>(`/api/audios/${id}`, payload, { auth: true });
}
