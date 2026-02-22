import type { ApiAudio, ApiPublicAudio, ApiPublicProfile } from "./types";
import type { ImamProfile, Recitation } from "../domain/types";

function formatAyatRange(start?: number | null, end?: number | null) {
  if (start && end) return `${start}-${end}`;
  if (start) return `${start}`;
  return "";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function mapAudioToRecitation(audio: ApiAudio): Recitation {
  return {
    id: audio.id,
    slug: audio.slug,
    title: audio.title,
    surah: audio.sourate,
    surahNumber: audio.numero_sourate,
    ayatRange: formatAyatRange(audio.verset_start, audio.verset_end),
    duration: formatDuration(audio.duration_seconds),
    date: formatDate(audio.created_at),
    withBasmala: Boolean(audio.basmala_added),
    listens: audio.listen_count ?? 0,
    downloads: audio.download_count ?? 0,
    likes: audio.like_count ?? 0,
    views: audio.view_count ?? 0,
    shares: audio.share_count ?? 0,
    isComplete: Boolean(audio.is_complete),
    description: audio.description ?? ""
  };
}

export function mapPublicAudioToRecitation(audio: ApiPublicAudio): Recitation {
  return {
    id: audio.id || audio.slug,
    slug: audio.slug,
    title: audio.title,
    surah: audio.sourate,
    surahNumber: audio.numero_sourate,
    ayatRange: formatAyatRange(audio.verset_start, audio.verset_end),
    date: formatDate(audio.created_at),
    withBasmala: false,
    listens: audio.listen_count,
    downloads: audio.download_count,
    likes: audio.like_count ?? 0,
    views: audio.view_count,
    description: audio.description ?? "",
    isComplete: Boolean(audio.is_complete),
    streamUrl: audio.stream_url,
    downloadUrl: audio.download_url,
    shareUrl: audio.share_url
  };
}

export function mapPublicProfile(profile: ApiPublicProfile | null): ImamProfile {
  if (!profile) {
    return {
      name: "",
      arabicName: "",
      title: "",
      bio: "",
      education: [],
      experience: [],
      specialties: [],
      email: "",
      phone: "",
      avatar: ""
    };
  }

  const parseList = (value?: string[] | string | null) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  return {
    name: profile.name ?? "",
    arabicName: profile.arabic_name ?? "",
    title: profile.title ?? profile.statut ?? "",
    bio: profile.biography ?? "",
    education: parseList(profile.education ?? null),
    experience: parseList(profile.experience ?? profile.parcours ?? null),
    specialties: parseList(profile.specialties ?? null),
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    avatar: profile.photo_url ?? ""
  };
}
