import { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Fab,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Search, TrendingUp, AccessTime, Star, Download, Share, Favorite, FavoriteBorder, KeyboardArrowUp } from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { RecitationCard } from "../components/RecitationCard";
import { getPopular, getRecent, listAudios, listFavoriteAudios, sharePublicAudio, toggleFavoriteAudio } from "../api/audios";
import { isNetworkError, PUBLIC_BASE_URL } from "../api/client";
import { getPublicProfile } from "../api/profile";
import { mapAudioToRecitation, mapPublicProfile } from "../api/mappers";
import { ensureArray } from "../utils/ensureArray";
import type { ImamProfile, Recitation, SurahReference } from "../domain/types";
import { useNavigate } from "react-router";
import { getSurahReference } from "../api/surahReference";
import { useTranslation } from "react-i18next";
import { formatNumber, formatNumericText } from "../utils/formatNumber";
import { useAudioPlayer } from "../components/AudioPlayerProvider";
import { useDataRefresh } from "../state/dataRefresh";

export function HomePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const recitationsRef = useRef<HTMLDivElement | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [allRecitations, setAllRecitations] = useState<Recitation[]>([]);
  const [recentRecitations, setRecentRecitations] = useState<Recitation[]>([]);
  const [popularRecitations, setPopularRecitations] = useState<Recitation[]>([]);
  const [searchResults, setSearchResults] = useState<Recitation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [surahReference, setSurahReference] = useState<SurahReference[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [imamProfile, setImamProfile] = useState<ImamProfile>({
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
  });
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { t, i18n } = useTranslation();
  const { refreshToken } = useDataRefresh();
  const { currentRecitation, isPlaying, playRecitation, togglePlay } = useAudioPlayer();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    let active = true;
    let intervalId: number | null = null;
    const loadData = async () => {
      try {
        const [profileResult, allResult, recentResult, popularResult, surahResult, favoritesResult] =
          await Promise.allSettled([
            getPublicProfile(),
            listAudios(),
            getRecent(6),
            getPopular(6),
            getSurahReference(),
            listFavoriteAudios()
          ]);
        if (!active) return;

        if (profileResult.status === "fulfilled") {
          setImamProfile(mapPublicProfile(profileResult.value));
        } else if (
          profileResult.reason &&
          !isNetworkError(profileResult.reason) &&
          profileResult.reason instanceof Error &&
          profileResult.reason.message !== "Profile not found"
        ) {
          setToast({ message: profileResult.reason.message, severity: "error" });
        }

        const favoriteSet =
          favoritesResult.status === "fulfilled"
            ? new Set(favoritesResult.value?.audioIds ?? [])
            : new Set<string>();
        setFavoriteIds(favoriteSet);

        const withPublicUrls = (item: Recitation) =>
          item.slug
            ? {
                ...item,
                streamUrl: `${PUBLIC_BASE_URL}/public/audios/${item.slug}/stream`,
                downloadUrl: `${PUBLIC_BASE_URL}/public/audios/${item.slug}/download`
              }
            : item;

        const withFavorites = (item: Recitation) => ({
          ...item,
          isFavorite: favoriteSet.has(item.id) || (item.slug ? favoriteSet.has(item.slug) : false)
        });

        if (allResult.status === "fulfilled") {
          const allItems = ensureArray(allResult.value);
          const mappedAll = allItems.map(mapAudioToRecitation).map(withPublicUrls).map(withFavorites);
          setAllRecitations(mappedAll);
          setSearchResults(mappedAll);
        } else if (!isNetworkError(allResult.reason)) {
          const message =
            allResult.reason instanceof Error ? allResult.reason.message : "Erreur lors du chargement";
          setToast({ message, severity: "error" });
        }

        if (recentResult.status === "fulfilled") {
          const recentItems = ensureArray(recentResult.value);
          setRecentRecitations(recentItems.map(mapAudioToRecitation).map(withPublicUrls).map(withFavorites));
        } else if (!isNetworkError(recentResult.reason)) {
          const message =
            recentResult.reason instanceof Error ? recentResult.reason.message : "Erreur lors du chargement";
          setToast({ message, severity: "error" });
        }

        if (popularResult.status === "fulfilled") {
          const popularItems = ensureArray(popularResult.value);
          setPopularRecitations(popularItems.map(mapAudioToRecitation).map(withPublicUrls).map(withFavorites));
        } else if (!isNetworkError(popularResult.reason)) {
          const message =
            popularResult.reason instanceof Error ? popularResult.reason.message : "Erreur lors du chargement";
          setToast({ message, severity: "error" });
        }

        if (surahResult.status === "fulfilled") {
          const sorted = [...surahResult.value].sort((a, b) => a.number - b.number);
          setSurahReference(sorted);
        }
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        if (message === "Profile not found") {
          return;
        }
        return;
      }
    };
    loadData();
    intervalId = window.setInterval(loadData, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [i18n.language, refreshToken]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateRecitationState = (
    target: Recitation,
    updater: (item: Recitation) => Recitation
  ) => {
    const matches = (item: Recitation) =>
      item.id === target.id || (target.slug && item.slug === target.slug);

    setAllRecitations((prev) => prev.map((item) => (matches(item) ? updater(item) : item)));
    setRecentRecitations((prev) => prev.map((item) => (matches(item) ? updater(item) : item)));
    setPopularRecitations((prev) => prev.map((item) => (matches(item) ? updater(item) : item)));
    setSearchResults((prev) => prev.map((item) => (matches(item) ? updater(item) : item)));
  };

  const handleDownload = (recitation: Recitation) => {
    const url =
      recitation.downloadUrl ||
      (recitation.slug ? `${PUBLIC_BASE_URL}/public/audios/${recitation.slug}/download` : "");
    if (!url) {
      setToast({ message: "Lien de téléchargement indisponible.", severity: "error" });
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  const handleShare = async (recitation: Recitation) => {
    try {
      let shareUrl = recitation.shareUrl || "";
      if (recitation.slug) {
        const result = await sharePublicAudio(recitation.slug);
        shareUrl = result?.share_url || shareUrl;
      }

      if (!shareUrl && recitation.slug) {
        shareUrl = `${window.location.origin}/recitation/${recitation.slug}`;
      }

      if (navigator.share) {
        await navigator.share({
          title: recitation.title,
          text: t("player.shareText", { title: recitation.title }),
          url: shareUrl
        });
      } else if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ message: t("player.linkCopied"), severity: "success" });
      }

      if (recitation.slug) {
        updateRecitationState(recitation, (item) => ({
          ...item,
          shares: (item.shares ?? 0) + 1
        }));
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        setToast({ message: err instanceof Error ? err.message : "Partage impossible", severity: "error" });
      }
    }
  };

  const handleToggleFavorite = async (recitation: Recitation) => {
    try {
      const result = await toggleFavoriteAudio(recitation.id);
      const nextLiked = result?.liked ?? !recitation.isFavorite;
      const nextLikes = result?.like_count ?? recitation.likes ?? 0;
      const nextSet = new Set(favoriteIds);
      if (nextLiked) {
        nextSet.add(recitation.id);
      } else {
        nextSet.delete(recitation.id);
      }
      setFavoriteIds(nextSet);
      updateRecitationState(recitation, (item) => ({
        ...item,
        isFavorite: nextLiked,
        likes: nextLikes
      }));
    } catch (err) {
      if (!isNetworkError(err)) {
        setToast({ message: err instanceof Error ? err.message : "Action impossible", severity: "error" });
      }
    }
  };

  const handleSearchSubmit = () => {
    if (recitationsRef.current) {
      recitationsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const target = heroRef.current;
    if (!target) return;
    const onScroll = () => {
      const progress = Math.min(window.scrollY / (window.innerHeight || 1), 1);
      target.style.setProperty("--hero-depth", String(progress));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(allRecitations);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = window.setTimeout(() => setIsSearching(false), 120);

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[’']/g, "")
        .replace(/\\s+/g, " ")
        .trim();

    const normalizedQuery = normalize(query);
    const numberMatch = normalizedQuery.match(/\\b(\\d{1,3})\\b/);
    const numberCandidate = numberMatch ? Number(numberMatch[1]) : undefined;

    const surahMatch = surahReference.find((surah) => {
      const names = [surah.name_local, surah.name_fr, surah.name_phonetic, surah.name_ar];
      return names.some((name) => name && normalize(name).includes(normalizedQuery));
    });
    const matchedNumber =
      surahMatch?.number ??
      (numberCandidate && numberCandidate >= 1 && numberCandidate <= 114 ? numberCandidate : undefined);

    const matches = allRecitations.filter((recitation) => {
      if (matchedNumber && recitation.surahNumber === matchedNumber) return true;
      const haystack = normalize(
        `${recitation.title} ${recitation.surah} ${recitation.description ?? ""}`
      );
      return haystack.includes(normalizedQuery);
    });

    setSearchResults(matches);
    return () => window.clearTimeout(timer);
  }, [searchQuery, allRecitations, surahReference]);

  const displayedRecitations =
    selectedTab === 0
      ? searchResults
      : selectedTab === 1
      ? recentRecitations
      : popularRecitations;

  const constellationRecitations =
    popularRecitations.length > 0 ? popularRecitations : allRecitations.slice(0, 8);
  const uniqueConstellationRecitations = Array.from(
    new Map(
      constellationRecitations.map((recitation) => [
        recitation.id || recitation.slug || recitation.title,
        recitation
      ])
    ).values()
  );

  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", background: "transparent" }}>
      <Navbar />

      {/* Hero Section */}
      <Box
        ref={heroRef}
        sx={{
          position: "relative",
          background:
            "linear-gradient(135deg, rgba(11,31,42,0.96) 0%, rgba(8,48,60,0.96) 50%, rgba(11,31,42,0.98) 100%)",
          color: "white",
          py: { xs: 6, md: 10 },
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.35), transparent 45%), radial-gradient(circle at 80% 15%, rgba(4,120,87,0.35), transparent 50%), radial-gradient(circle at 75% 80%, rgba(5,150,105,0.3), transparent 50%)",
            animation: "shimmer 14s ease-in-out infinite",
            opacity: 0.9,
            pointerEvents: "none"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.25,
            animation: "starDrift 20s ease-in-out infinite",
            transform: "translateY(calc(var(--hero-depth, 0) * 22px))",
            pointerEvents: "none"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.35), transparent 60%)",
            top: -120,
            right: -80,
            animation: "floatY 8s ease-in-out infinite",
            pointerEvents: "none"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 60%)",
            bottom: -120,
            left: -60,
            animation: "floatY 10s ease-in-out infinite",
            pointerEvents: "none"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1769065579937-07dadad748a2?w=1200')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
            transform: "translateY(calc(var(--hero-depth, 0) * -18px))",
            pointerEvents: "none"
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
                textShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                animation: "fadeUp 0.6s ease both"
              }}
            >
              {t("home.heroTitle")}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.95,
                maxWidth: 600,
                mx: "auto",
                mb: 4,
                lineHeight: 1.7,
                fontSize: { xs: "1rem", md: "1.25rem" },
                animation: "fadeUp 0.7s ease both"
              }}
            >
              {t("home.heroSubtitle")}
            </Typography>

            <TextField
              fullWidth
              placeholder={t("home.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              sx={{
                maxWidth: 600,
                mx: "auto",
                animation: "fadeUp 0.85s ease both",
                "& .MuiOutlinedInput-root": {
                  background: "rgba(15, 28, 39, 0.85)",
                  borderRadius: 3,
                  fontSize: "1.1rem",
                  color: "rgba(248, 246, 241, 0.95)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(212, 175, 55, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#D4AF37",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(248, 246, 241, 0.6)",
                  opacity: 1,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "rgba(212, 175, 55, 0.85)", fontSize: 28 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("home.searchButton")}
                      onClick={handleSearchSubmit}
                      sx={{ color: "rgba(248, 246, 241, 0.8)" }}
                    >
                      <Search />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Quick Stats */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>
                {allRecitations.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t("home.statsRecitations")}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>
                {formatNumber(
                  allRecitations.reduce((acc, r) => acc + r.listens, 0),
                  i18n.language
                )}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t("home.statsListens")}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>
                {formatNumber(
                  allRecitations.reduce((acc, r) => acc + r.downloads, 0),
                  i18n.language
                )}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t("home.statsDownloads")}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: 6, md: 8 }, mb: 6 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "rgba(248,246,241,0.95)" }}>
              {t("home.featuredTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(248,246,241,0.7)" }}>
              {t("home.featuredSubtitle")}
            </Typography>
          </Box>
          <Chip
            label={t("home.liveChip")}
            sx={{
              background: "rgba(212,175,55,0.2)",
              color: "#F8F6F1",
              border: "1px solid rgba(212,175,55,0.35)"
            }}
          />
        </Box>

        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(15,118,110,0.18) 45%, rgba(212,175,55,0.18) 100%)",
            backdropFilter: "blur(12px)",
            py: 3
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 3,
              width: "max-content",
              px: 3,
              animation: "orbitScroll 26s linear infinite"
            }}
          >
            {uniqueConstellationRecitations.map((recitation) => {
              const isActiveRecitation =
                Boolean(currentRecitation) &&
                (currentRecitation?.slug === recitation.slug ||
                  currentRecitation?.id === recitation.id);
              return (
              <Box
                key={recitation.id || recitation.slug}
                sx={{
                  minWidth: 240,
                  maxWidth: 260,
                  p: 2,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  cursor: "pointer",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)"
                  },
                  ...(isActiveRecitation
                    ? {
                        boxShadow: "0 16px 30px rgba(15, 118, 110, 0.25)",
                        transform: "translateY(-6px)"
                      }
                    : {})
                }}
                onClick={() => navigate(`/recitation/${recitation.slug || recitation.id}`)}
              >
                <Typography fontWeight={700} sx={{ color: "#F8F6F1", mb: 1 }}>
                  {recitation.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(248,246,241,0.7)" }}>
                  {recitation.surah} • {formatNumericText(recitation.ayatRange || "—", i18n.language)}
                </Typography>
                {isActiveRecitation && isPlaying && (
                  <Box sx={{ display: "flex", gap: 0.5, mt: 1, height: 14 }}>
                    {[0, 1, 2, 3].map((bar) => (
                      <Box
                        key={bar}
                        sx={{
                          width: 3,
                          height: 6,
                          borderRadius: 2,
                          background: "rgba(212,175,55,0.85)",
                          animation: `voicePulse 1.2s ${bar * 0.2}s ease-in-out infinite`,
                          "@keyframes voicePulse": {
                            "0%, 100%": { height: 6, opacity: 0.6 },
                            "50%": { height: 14, opacity: 1 }
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Chip
                    size="small"
                    label={`${formatNumber(recitation.listens, i18n.language)} ${t("player.listens")}`}
                    sx={{
                      background: "rgba(4,120,87,0.25)",
                      color: "#F8F6F1"
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${formatNumber(recitation.downloads, i18n.language)} ${t("player.downloads")}`}
                    sx={{
                      background: "rgba(212,175,55,0.25)",
                      color: "#F8F6F1"
                    }}
                  />
                </Box>
              </Box>
            )})}
          </Box>
        </Box>
      </Container>

      {/* Content Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Imam Profile Section */}
        <Box
          sx={{
            mb: 6,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: "rgba(15, 28, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 200,
              height: 200,
              background: "linear-gradient(135deg, rgba(4, 120, 87, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)",
              borderRadius: "50%",
              transform: "translate(50%, -50%)",
            }}
          />
          
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
              alignItems: { xs: "center", md: "flex-start" },
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Photo de l'imam */}
            <Box
              sx={{
                position: "relative",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: { xs: 150, md: 200 },
                  height: { xs: 150, md: 200 },
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "5px solid",
                  borderColor: "rgba(212, 175, 55, 0.6)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
                  background: `url('https://images.unsplash.com/photo-1756412066387-2b518da6a7d6?w=400') center/cover`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: { xs: -10, md: -15 },
                  left: "50%",
                  transform: "translateX(-50%)",
                  background:
                    "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                  color: "#0B1F2A",
                  px: { xs: 2, md: 3 },
                  py: 1,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: { xs: "0.875rem", md: "1rem" },
                  boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                🕌 {t("home.imamLabel")}
              </Box>
            </Box>

            {/* Informations de l'imam */}
            <Box
              sx={{
                flexGrow: 1,
                textAlign: { xs: "center", md: "left" },
                mt: { xs: 3, md: 0 },
              }}
            >
              <Typography
                variant="h3"
                fontWeight={800}
                gutterBottom
                color="primary"
                sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}
              >
                {imamProfile.name}
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  mb: 2,
                  color: "text.primary",
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {imamProfile.arabicName}
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  fontSize: { xs: "1rem", md: "1.25rem" },
                }}
              >
                {imamProfile.title}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.8,
                  mb: 3,
                  maxWidth: 800,
                  mx: { xs: "auto", md: 0 },
                }}
              >
                {imamProfile.bio}
              </Typography>

              {/* Specialties */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: { xs: "center", md: "flex-start" }, mb: 3 }}>
                {imamProfile.specialties.map((specialty, index) => (
                  <Chip
                    key={index}
                    label={specialty}
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(15, 118, 110, 0.18) 0%, rgba(212, 175, 55, 0.18) 100%)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      color: "text.primary",
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>

              {/* Formation et Parcours en colonnes */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: "rgba(15, 28, 39, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      📚 {t("home.formation")}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {imamProfile.education.slice(0, 2).map((edu, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1, lineHeight: 1.6 }}
                        >
                          {edu}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: "rgba(15, 28, 39, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="secondary"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      💼 {t("home.parcours")}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {imamProfile.experience.slice(0, 2).map((exp, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1, lineHeight: 1.6 }}
                        >
                          {exp}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-start" }
                }}
              >
                <Button
                  onClick={() => navigate("/profile?view=public")}
                  variant="contained"
                  sx={{
                    px: 3.5,
                    py: 1.2,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 700,
                    background:
                      "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.95) 100%)",
                    color: "#0B1F2A",
                    boxShadow: "0 12px 26px rgba(0,0,0,0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, rgba(212, 175, 55, 1) 0%, rgba(15, 118, 110, 1) 100%)"
                    }
                  }}
                >
                  {t("home.learnMore", { defaultValue: "En savoir plus" })}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tabs + Affichage */}
        <Box
          ref={recitationsRef}
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap"
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            scrollButtons="auto"
            sx={{
              maxWidth: "100%",
              flex: 1,
              minHeight: 48,
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 2,
                background: "linear-gradient(90deg, #047857 0%, #D4AF37 100%)",
              },
              "& .MuiTabs-scroller": {
                overflowY: "hidden"
              },
              "& .MuiTabs-scrollButtons": {
                color: "text.secondary"
              }
            }}
          >
            <Tab
              icon={<Star />}
              iconPosition="start"
              label={t("home.tabsAll")}
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textTransform: "none",
                minHeight: 56,
                minWidth: "auto",
                px: { xs: 1.5, sm: 2.5 }
              }}
            />
            <Tab
              icon={<AccessTime />}
              iconPosition="start"
              label={t("home.tabsRecent")}
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textTransform: "none",
                minHeight: 56,
                minWidth: "auto",
                px: { xs: 1.5, sm: 2.5 }
              }}
            />
            <Tab
              icon={<TrendingUp />}
              iconPosition="start"
              label={t("home.tabsPopular")}
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                textTransform: "none",
                minHeight: 56,
                minWidth: "auto",
                px: { xs: 1.5, sm: 2.5 }
              }}
            />
          </Tabs>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => {
              if (value) setViewMode(value);
            }}
            size="small"
            sx={{
              background: "rgba(15, 28, 39, 0.9)",
              borderRadius: 3,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
              "& .MuiToggleButton-root": {
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                border: "none",
                color: "text.secondary"
              },
              "& .Mui-selected": {
                color: "text.primary",
                background: "rgba(212, 175, 55, 0.2)"
              }
            }}
          >
            <ToggleButton value="cards">{t("home.viewCards")}</ToggleButton>
            <ToggleButton value="list">{t("home.viewList")}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isSearching ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography variant="body2" color="text.secondary">
              {t("home.searching")}
            </Typography>
          </Box>
        ) : displayedRecitations.length > 0 ? (
          viewMode === "cards" ? (
            <Grid container spacing={3}>
              {displayedRecitations.map((recitation, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recitation.id}>
                  <RecitationCard
                    recitation={recitation}
                    featured={index === 0 && selectedTab === 2}
                    isActive={
                      Boolean(currentRecitation) &&
                      (currentRecitation?.slug === recitation.slug ||
                        currentRecitation?.id === recitation.id)
                    }
                    isPlaying={isPlaying}
                    onPlayToggle={() => {
                      if (
                        currentRecitation?.slug === recitation.slug ||
                        currentRecitation?.id === recitation.id
                      ) {
                        togglePlay();
                      } else {
                        playRecitation(recitation, true);
                      }
                    }}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </Grid>
              ))}
            </Grid>
          ) : isSmallScreen ? (
            <Box sx={{ display: "grid", gap: 2 }}>
              {displayedRecitations.map((recitation) => (
                <Paper
                  key={recitation.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: "rgba(15, 28, 39, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    {recitation.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {recitation.description || t("home.defaultDescription")}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.4 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(recitation)}
                      sx={{ color: "text.primary" }}
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleShare(recitation)}
                      sx={{ color: "text.primary" }}
                    >
                      <Share fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleFavorite(recitation)}
                      sx={{ color: recitation.isFavorite ? "#D4AF37" : "text.primary" }}
                    >
                      {recitation.isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                    </IconButton>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {formatNumber(recitation.likes ?? 0, i18n.language)} {t("home.table.likes")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 0.6,
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      mb: 1.4
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {t("home.table.surah")}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {recitation.surah}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("home.table.verses")}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {formatNumericText(recitation.ayatRange, i18n.language)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("home.table.date")}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {recitation.date}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("home.table.listens")}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {formatNumber(recitation.listens, i18n.language)}
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/recitation/${recitation.slug || recitation.id}`)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#0B1F2A",
                      background:
                        "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)"
                    }}
                  >
                    {t("home.table.listen")}
                  </Button>
                </Paper>
              ))}
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={2}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                overflowX: "auto",
                background: "rgba(15, 28, 39, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(15,118,110,0.18) 0%, rgba(212,175,55,0.18) 100%)"
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.recitation")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.surah")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.verses")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.date")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.listens")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.downloads")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.likes")}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "text.primary" }}>
                      {t("home.table.action")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRecitations.map((recitation) => (
                    <TableRow
                      key={recitation.id}
                      hover
                      sx={{
                        "&:hover": {
                          background: "rgba(255,255,255,0.04)"
                        }
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight={700}>{recitation.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {recitation.description || t("home.defaultDescription")}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>{recitation.surah}</TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatNumericText(recitation.ayatRange, i18n.language)}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>{recitation.date}</TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatNumber(recitation.listens, i18n.language)}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatNumber(recitation.downloads, i18n.language)}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatNumber(recitation.likes ?? 0, i18n.language)}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(recitation)}
                            sx={{
                              color: "rgba(255,255,255,0.88)",
                              "&:hover": { color: "rgba(255,255,255,0.98)" }
                            }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleShare(recitation)}
                            sx={{
                              color: "rgba(255,255,255,0.88)",
                              "&:hover": { color: "rgba(255,255,255,0.98)" }
                            }}
                          >
                            <Share fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFavorite(recitation)}
                            sx={{ color: recitation.isFavorite ? "#D4AF37" : "inherit" }}
                          >
                            {recitation.isFavorite ? (
                              <Favorite fontSize="small" />
                            ) : (
                              <FavoriteBorder fontSize="small" />
                            )}
                          </IconButton>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              navigate(`/recitation/${recitation.slug || recitation.id}`)
                            }
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 700,
                              color: "#0B1F2A",
                              background:
                                "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)"
                            }}
                          >
                            {t("home.table.listen")}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              px: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t("home.noRecitationsTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("home.noRecitationsSubtitle")}
            </Typography>
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, rgba(11, 31, 42, 0.95) 0%, rgba(15, 118, 110, 0.5) 100%)",
          color: "#F8F6F1",
          py: 4,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              {t("home.footerTitle")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              {t("home.footerSubtitle")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {t("home.footerCopyright")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.75,
                opacity: 0.35,
                letterSpacing: "0.35em",
                fontSize: "0.65rem"
              }}
            >
              HBM
            </Typography>
          </Box>
        </Container>
      </Box>

      {showScrollTop && (
        <Fab
          color="primary"
          onClick={handleScrollTop}
          sx={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 1200,
            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.95), rgba(15, 118, 110, 0.95))",
            color: "#0B1F2A",
            boxShadow: "0 16px 30px rgba(0,0,0,0.35)"
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
            {toast.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}
