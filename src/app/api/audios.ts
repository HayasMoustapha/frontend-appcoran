import { del, get, post, postForm, postFormWithProgress } from "./client";
import type { ApiAudio, ApiPublicAudio } from "./types";

export type UpdateAudioPayload = Partial<ApiAudio> & {
  numeroSourate?: number;
  sourate?: string;
  versetStart?: number;
  versetEnd?: number;
};

export async function listAudios(params?: { sourate?: string; includeProcessing?: boolean }) {
  const query = new URLSearchParams();
  if (params?.sourate) query.set("sourate", params.sourate);
  if (params?.includeProcessing) query.set("includeProcessing", "true");
  const suffix = query.toString();
  return get<ApiAudio[]>(`/api/audios${suffix ? `?${suffix}` : ""}`);
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
  return post<{ share_url: string; like_count?: number }>(`/public/audios/${slug}/share`);
}

export async function listFavoriteAudios() {
  return get<{ audioIds: string[] }>(`/api/audios/favorites`, { auth: true });
}

export async function toggleFavoriteAudio(id: string) {
  return post<{ liked: boolean; like_count: number }>(`/api/audios/${id}/favorite`, undefined, { auth: true });
}

export async function uploadAudio(
  formData: FormData,
  onProgress?: (progress: number) => void
) {
  if (onProgress) {
    return postFormWithProgress<ApiAudio>("/api/audios", formData, { auth: true }, onProgress);
  }
  return postForm<ApiAudio>("/api/audios", formData, { auth: true });
}

export async function deleteAudio(id: string) {
  return del<{ status: string }>(`/api/audios/${id}`, { auth: true });
}

export async function updateAudio(id: string, payload: UpdateAudioPayload) {
  return put<ApiAudio>(`/api/audios/${id}`, payload, { auth: true });
}
