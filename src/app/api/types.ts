export interface ApiAudio {
  id: string;
  title: string;
  sourate: string;
  numero_sourate: number;
  verset_start: number | null;
  verset_end: number | null;
  description?: string | null;
  file_path: string;
  basmala_added: boolean;
  created_at: string;
  updated_at?: string;
  slug?: string | null;
  listen_count?: number;
  download_count?: number;
  view_count?: number;
  share_count?: number;
  like_count?: number;
  duration_seconds?: number | null;
  is_complete?: boolean | null;
}

export interface ApiPublicAudio {
  id: string;
  title: string;
  sourate: string;
  numero_sourate: number;
  verset_start: number | null;
  verset_end: number | null;
  description?: string | null;
  slug: string;
  view_count: number;
  listen_count: number;
  download_count: number;
  like_count: number;
  created_at: string;
  share_url: string;
  stream_url: string;
  download_url: string;
  is_complete?: boolean | null;
}

export interface ApiPublicProfile {
  name?: string | null;
  biography?: string | null;
  parcours?: string | null;
  statut?: string | null;
  photo_url?: string | null;
  arabic_name?: string | null;
  title?: string | null;
  education?: string[] | null;
  experience?: string[] | null;
  specialties?: string[] | null;
  email?: string | null;
  phone?: string | null;
}

export interface ApiSurahReference {
  number: number;
  name_fr: string;
  name_phonetic: string;
  name_ar: string;
  name_local?: string;
  revelation: number;
  verses: number;
  words: number;
  letters: number;
}
