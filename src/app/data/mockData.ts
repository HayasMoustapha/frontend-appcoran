export interface Recitation {
  id: string;
  title: string;
  surah: string;
  surahNumber: number;
  ayatRange: string;
  duration: string;
  date: string;
  withBasmala: boolean;
  listens: number;
  downloads: number;
  audioUrl?: string;
  description?: string;
}

export interface ImamProfile {
  id: string;
  name: string;
  arabicName: string;
  title: string;
  bio: string;
  education: string[];
  experience: string[];
  specialties: string[];
  email: string;
  phone: string;
  avatar?: string;
}

export const imamProfile: ImamProfile = {
  id: "1",
  name: "Cheikh Mohammed Al-Hassan",
  arabicName: "الشيخ محمد الحسن",
  title: "Imam et Récitateur du Saint Coran",
  bio: "Imam et récitateur du Saint Coran depuis plus de 20 ans, Cheikh Mohammed Al-Hassan a mémorisé le Coran à l'âge de 12 ans. Sa voix mélodieuse et sa profonde compréhension des sciences coraniques touchent les cœurs des fidèles à travers le monde. Il se consacre à la transmission de la parole divine avec humilité et dévotion.",
  education: [
    "Diplôme en Sciences Islamiques - Université Al-Azhar, Le Caire (2000)",
    "Ijazah en Récitation Coranique - Institut des Lectures Coraniques (1998)",
    "Mémorisation complète du Coran - École Coranique Dar Al-Quran (1995)",
  ],
  experience: [
    "Imam de la Grande Mosquée depuis 2010",
    "Professeur de Tajwid et Sciences Coraniques depuis 2005",
    "Formateur en récitation coranique pour plus de 500 étudiants",
    "Conférencier lors de séminaires islamiques internationaux",
  ],
  specialties: [
    "Récitation coranique (Hafs)",
    "Science du Tajwid",
    "Exégèse coranique (Tafsir)",
    "Sciences islamiques",
  ],
  email: "imam.hassan@mosquee.com",
  phone: "+33 1 23 45 67 89",
};

export const mockRecitations: Recitation[] = [
  {
    id: "1",
    title: "Sourate Al-Fatiha",
    surah: "الفاتحة",
    surahNumber: 1,
    ayatRange: "1-7",
    duration: "2:34",
    date: "2026-02-15",
    withBasmala: true,
    listens: 1250,
    downloads: 430,
    description: "L'Ouverture - Récitation complète avec méditation profonde"
  },
  {
    id: "2",
    title: "Sourate Al-Baqarah (1-5)",
    surah: "البقرة",
    surahNumber: 2,
    ayatRange: "1-5",
    duration: "5:12",
    date: "2026-02-14",
    withBasmala: true,
    listens: 2890,
    downloads: 892,
    description: "La Vache - Les premiers versets guidant vers la piété"
  },
  {
    id: "3",
    title: "Sourate Al-Ikhlas",
    surah: "الإخلاص",
    surahNumber: 112,
    ayatRange: "1-4",
    duration: "0:45",
    date: "2026-02-13",
    withBasmala: true,
    listens: 3420,
    downloads: 1120,
    description: "Le Monothéisme Pur - L'essence de la foi"
  },
  {
    id: "4",
    title: "Sourate Al-Falaq",
    surah: "الفلق",
    surahNumber: 113,
    ayatRange: "1-5",
    duration: "0:52",
    date: "2026-02-12",
    withBasmala: true,
    listens: 2100,
    downloads: 680,
    description: "L'Aube Naissante - Protection contre les maux"
  },
  {
    id: "5",
    title: "Sourate An-Nas",
    surah: "الناس",
    surahNumber: 114,
    ayatRange: "1-6",
    duration: "0:58",
    date: "2026-02-11",
    withBasmala: true,
    listens: 1980,
    downloads: 590,
    description: "Les Hommes - Refuge auprès du Seigneur"
  },
  {
    id: "6",
    title: "Sourate Yasin (1-12)",
    surah: "يس",
    surahNumber: 36,
    ayatRange: "1-12",
    duration: "8:23",
    date: "2026-02-10",
    withBasmala: true,
    listens: 4560,
    downloads: 1450,
    description: "Yasin - Le cœur du Coran"
  },
  {
    id: "7",
    title: "Sourate Ar-Rahman (1-16)",
    surah: "الرحمن",
    surahNumber: 55,
    ayatRange: "1-16",
    duration: "6:45",
    date: "2026-02-09",
    withBasmala: true,
    listens: 3890,
    downloads: 1230,
    description: "Le Tout Miséricordieux - Les bienfaits divins"
  },
  {
    id: "8",
    title: "Sourate Al-Mulk (1-10)",
    surah: "الملك",
    surahNumber: 67,
    ayatRange: "1-10",
    duration: "7:15",
    date: "2026-02-08",
    withBasmala: true,
    listens: 2750,
    downloads: 890,
    description: "La Royauté - Contemplation de la création"
  },
];

export const recentRecitations = mockRecitations.slice(0, 3);
export const popularRecitations = [...mockRecitations].sort((a, b) => b.listens - a.listens).slice(0, 4);