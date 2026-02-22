export interface Recitation {
  id: string;
  slug?: string | null;
  title: string;
  surah: string;
  surahNumber: number;
  ayatRange: string;
  duration?: string;
  date: string;
  withBasmala: boolean;
  listens: number;
  downloads: number;
  likes?: number;
  views?: number;
  shares?: number;
  isFavorite?: boolean;
  isComplete?: boolean;
  processingStatus?: "uploaded" | "queued" | "processing" | "completed" | "failed" | "ready";
  processingError?: string | null;
  description?: string | null;
  streamUrl?: string;
  downloadUrl?: string;
  shareUrl?: string;
}

export interface ImamProfile {
  id?: string;
  name?: string | null;
  arabicName?: string | null;
  title?: string | null;
  bio?: string | null;
  education: string[];
  experience: string[];
  specialties: string[];
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

export interface DashboardOverview {
  totalRecitations: number;
  totalListens: number;
  totalDownloads: number;
  totalShares: number;
  totalLikes?: number;
  averageListensPerRecitation: number;
  mostPopularAudio?: Recitation | null;
  mostListenedSurah?: {
    numero_sourate: number;
    sourate: string;
    listens: number;
  } | null;
}

export interface DashboardPerformanceItem {
  id: string;
  title: string;
  listen_count: number;
  download_count: number;
  engagement_ratio: number;
}

export interface DashboardPeriodStat {
  day: string;
  recitations: number;
  listens: number;
  downloads: number;
  shares: number;
  likes?: number;
}

export interface SurahReference {
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
