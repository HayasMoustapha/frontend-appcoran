import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Container,
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Button,
  Chip,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Download,
  Share,
  Favorite,
  FavoriteBorder,
  VolumeUp,
  ArrowBack,
  Repeat,
  RepeatOne,
  Shuffle,
  QueueMusic
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { getPublicAudioBySlug, listAudios, sharePublicAudio } from "../api/audios";
import { isNetworkError, PUBLIC_BASE_URL } from "../api/client";
import { mapAudioToRecitation, mapPublicAudioToRecitation } from "../api/mappers";
import type { Recitation } from "../domain/types";
import { useTranslation } from "react-i18next";
import { formatNumber, formatNumericText } from "../utils/formatNumber";
import { useAudioPlayer } from "../components/AudioPlayerProvider";
import { useDataRefresh } from "../state/dataRefresh";

export function RecitationPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { refreshToken } = useDataRefresh();
  const publicAppUrl =
    import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

  const [recitation, setRecitation] = useState<Recitation | null>(null);
  const [allRecitations, setAllRecitations] = useState<Recitation[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");
  const [audioLoadError, setAudioLoadError] = useState("");
  const [hasTriedPlay, setHasTriedPlay] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [conversionOpen, setConversionOpen] = useState(false);
  const [showConversionBadge, setShowConversionBadge] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const conversionTimerRef = useRef<number | null>(null);
  const {
    audioRef: sharedAudioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    currentRecitation,
    setPlaylist,
    setCurrentRecitation,
    playRecitation,
    togglePlay,
    seek,
    setVolume: setPlayerVolume,
    playNext,
    playPrevious,
    playbackMode,
    cyclePlaybackMode
  } = useAudioPlayer();

  useEffect(() => {
    let active = true;
    const loadRecitations = async () => {
      try {
        const all = await listAudios();
        if (!active) return;
        const mapped = all.map(mapAudioToRecitation).map((item) =>
          item.slug
            ? {
                ...item,
                streamUrl: `${PUBLIC_BASE_URL}/public/audios/${item.slug}/stream`,
                downloadUrl: `${PUBLIC_BASE_URL}/public/audios/${item.slug}/download`
              }
            : item
        );
        setAllRecitations(mapped);
        setPlaylist(mapped);
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        const message = err instanceof Error ? err.message : "Chargement impossible";
        if (message === "Audio not found") {
          setError(message);
          return;
        }
        setError(message);
      }
    };
    loadRecitations();
    return () => {
      active = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    let active = true;
    const loadRecitation = async () => {
      if (!id) return;
      try {
        const audio = await getPublicAudioBySlug(id);
        if (!active) return;
        const mapped = mapPublicAudioToRecitation(audio);
        setCurrentRecitation(mapped);
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        const message = err instanceof Error ? err.message : t("player.notFound");
        setError(message);
      }
    };
    loadRecitation();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const audio = sharedAudioRef.current;
    if (!audio) return;

    const onEnded = () => {
      playNext();
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    };
    const onCanPlay = () => {
      if (conversionTimerRef.current) {
        window.clearTimeout(conversionTimerRef.current);
        conversionTimerRef.current = null;
      }
      setConversionOpen(false);
      setShowConversionBadge(false);
      setAudioLoadError("");
    };
    const onLoadStart = () => {
      if (conversionTimerRef.current) {
        window.clearTimeout(conversionTimerRef.current);
      }
      conversionTimerRef.current = window.setTimeout(() => {
        setConversionOpen(true);
        setShowConversionBadge(true);
      }, 1500);
    };
    const onError = () => {
      if (conversionTimerRef.current) {
        window.clearTimeout(conversionTimerRef.current);
        conversionTimerRef.current = null;
      }
      setConversionOpen(false);
      const message = "Lecture audio impossible. Format non supporté ou fichier manquant.";
      setAudioLoadError(message);
      if (hasTriedPlay) {
        setToast({ message, severity: "error" });
      }
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("error", onError);
      if (conversionTimerRef.current) {
        window.clearTimeout(conversionTimerRef.current);
        conversionTimerRef.current = null;
      }
    };
  }, [recitation?.streamUrl, hasTriedPlay, playNext, sharedAudioRef]);

  useEffect(() => {
    setPlayerVolume(volume);
  }, [volume, setPlayerVolume]);

  const { previousRecitation, nextRecitation } = useMemo(() => {
    const currentIndex = allRecitations.findIndex(
      (item) => item.slug === recitation?.slug || item.id === recitation?.id
    );
    return {
      previousRecitation: currentIndex > 0 ? allRecitations[currentIndex - 1] : null,
      nextRecitation:
        currentIndex >= 0 && currentIndex < allRecitations.length - 1
          ? allRecitations[currentIndex + 1]
          : null
    };
  }, [allRecitations, recitation?.slug, recitation?.id]);

  useEffect(() => {
    if (!recitation || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: recitation.title,
      artist: recitation.surah,
      album: "AppCoran",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    });

    navigator.mediaSession.setActionHandler("play", async () => {
      try {
        await sharedAudioRef.current?.play();
        navigator.mediaSession.playbackState = "playing";
      } catch {
        // ignore
      }
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      sharedAudioRef.current?.pause();
      navigator.mediaSession.playbackState = "paused";
    });
    navigator.mediaSession.setActionHandler("seekto", (event) => {
      if (!sharedAudioRef.current || event.seekTime === undefined) return;
      sharedAudioRef.current.currentTime = event.seekTime;
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (previousRecitation) {
        playRecitation(previousRecitation, true);
        navigate(`/recitation/${previousRecitation.slug || previousRecitation.id}`);
      }
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (nextRecitation) {
        playRecitation(nextRecitation, true);
        navigate(`/recitation/${nextRecitation.slug || nextRecitation.id}`);
      }
    });
  }, [recitation, previousRecitation, nextRecitation, navigate, playRecitation]);

  useEffect(() => {
    setRecitation(currentRecitation || null);
  }, [currentRecitation]);

  useEffect(() => {
    setAudioLoadError("");
    setHasTriedPlay(false);
  }, [currentRecitation?.slug]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayToggle = async () => {
    const audio = sharedAudioRef.current;
    if (!audio) return;
    try {
      setHasTriedPlay(true);
      if (audioLoadError) {
        setToast({ message: audioLoadError, severity: "error" });
        return;
      }
      togglePlay();
    } catch (err) {
      if (isNetworkError(err)) return;
      setToast({ message: err instanceof Error ? err.message : "Lecture impossible", severity: "error" });
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const nextTime = Array.isArray(value) ? value[0] : value;
    seek(nextTime);
  };

  const handleVolume = (_: Event, value: number | number[]) => {
    const nextVolume = Array.isArray(value) ? value[0] : value;
    setPlayerVolume(nextVolume);
  };

  const handleDownload = () => {
    if (!recitation?.downloadUrl) return;
    window.open(recitation.downloadUrl, "_blank", "noopener");
    setToast({ message: t("player.downloadStarted"), severity: "success" });
  };

  const handleShare = async () => {
    if (!recitation?.slug) return;
    try {
      await sharePublicAudio(recitation.slug);
      const url = `${publicAppUrl}/recitation/${recitation.slug}`;
      setShareUrl(url);
      if (navigator.share) {
        try {
          await navigator.share({
            title: recitation.title,
            text: t("player.shareText", { title: recitation.title }),
            url
          });
          setToast({ message: "Partage lancé.", severity: "success" });
        } catch (shareErr) {
          setShareOpen(true);
        }
      } else {
        setShareOpen(true);
      }
      if (!navigator.share && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setToast({ message: "Lien copié.", severity: "success" });
      }
    } catch (err) {
      if (isNetworkError(err)) return;
      setToast({ message: err instanceof Error ? err.message : "Partage impossible", severity: "error" });
    }
  };

  if (!recitation) {
    return (
      <Box>
        <Navbar />
        <Container sx={{ py: 4 }}>
          <Typography>{error || t("player.notFound")}</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#0B1F2A" }}>
      <Navbar />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/")}
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "none"
          }}
        >
          {t("player.back")}
        </Button>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "rgba(15, 28, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)"
          }}
        >
          {/* Cover Art */}
          <Box
            sx={{
              position: "relative",
              paddingTop: "56.25%",
              background:
                "linear-gradient(135deg, rgba(15, 118, 110, 0.9) 0%, rgba(212, 175, 55, 0.85) 100%)"
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage:
                  "radial-gradient(circle at top, rgba(11, 31, 42, 0.55) 0%, rgba(11, 31, 42, 0.9) 65%)",
                opacity: 0.9
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                width: "100%",
                px: 2
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  textShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                  mb: 1,
                  fontSize: { xs: "2.5rem", md: "3.5rem" }
                }}
              >
                {recitation.surah}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "rgba(255, 255, 255, 0.92)",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.45)"
                }}
              >
                {t("home.table.surah")} {formatNumber(recitation.surahNumber, i18n.language)} •{" "}
                {t("home.table.verses")} {formatNumericText(recitation.ayatRange, i18n.language)}
              </Typography>
            </Box>

            {recitation.withBasmala && (
              <Chip
                label={t("player.withBasmala")}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(212, 175, 55, 0.95)",
                  color: "#0B1F2A",
                  fontWeight: 700
                }}
              />
            )}

            {showConversionBadge && (
              <Chip
                label={t("player.conversion")}
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  background: "rgba(15, 118, 110, 0.95)",
                  color: "#0B1F2A",
                  fontWeight: 700
                }}
              />
            )}
          </Box>

          {/* Player Info */}
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {recitation.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {recitation.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Chip
                    label={`${formatNumber(recitation.listens, i18n.language)} ${t("player.listens")}`}
                    size="small"
                    sx={{ background: "rgba(255,255,255,0.08)", color: "text.primary" }}
                  />
                  <Chip
                    label={`${formatNumber(recitation.downloads, i18n.language)} ${t("player.downloads")}`}
                    size="small"
                    sx={{ background: "rgba(255,255,255,0.08)", color: "text.primary" }}
                  />
                  <Chip label={recitation.date} size="small" sx={{ background: "rgba(255,255,255,0.08)", color: "text.primary" }} />
                </Box>
              </Box>

              <IconButton
                onClick={() => setIsFavorite(!isFavorite)}
                sx={{
                  color: isFavorite ? "error.main" : "text.secondary"
                }}
              >
                {isFavorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Box>

            <Divider sx={{ my: 3, borderColor: "rgba(255, 255, 255, 0.08)" }} />

            {/* Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <Slider
                value={currentTime}
                max={duration || 0}
                onChange={handleSeek}
                sx={{
                  color: "primary.main",
                  "& .MuiSlider-thumb": {
                    width: 16,
                    height: 16
                  }
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(duration)}
                </Typography>
              </Box>
            </Box>

            {/* Player Controls */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                my: 3
              }}
            >
              <IconButton
                size="large"
                disabled={!previousRecitation}
                onClick={() => {
                  if (!previousRecitation) return;
                  playRecitation(previousRecitation, true);
                  navigate(`/recitation/${previousRecitation.slug || previousRecitation.id}`);
                }}
                sx={{
                  border: "2px solid",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "text.primary"
                }}
              >
                <SkipPrevious />
              </IconButton>

              <IconButton
                size="large"
                onClick={handlePlayToggle}
                sx={{
                  width: 72,
                  height: 72,
                  background:
                    "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                  color: "#0B1F2A",
                  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(245, 215, 110, 0.98) 0%, rgba(15, 118, 110, 1) 100%)",
                    transform: "scale(1.05)"
                  },
                  transition: "all 0.2s"
                }}
              >
                {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
              </IconButton>

              <IconButton
                size="large"
                disabled={!nextRecitation}
                onClick={() => {
                  if (!nextRecitation) return;
                  playRecitation(nextRecitation, true);
                  navigate(`/recitation/${nextRecitation.slug || nextRecitation.id}`);
                }}
                sx={{
                  border: "2px solid",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "text.primary"
                }}
              >
                <SkipNext />
              </IconButton>
            </Box>

            {/* Volume Control */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <VolumeUp sx={{ color: "text.secondary" }} />
              <Slider value={volume} onChange={handleVolume} sx={{ flexGrow: 1, color: "primary.main" }} />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                {volume}%
              </Typography>
            </Box>

            {/* Playback Mode */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)"
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t("player.playbackMode")}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  onClick={cyclePlaybackMode}
                  sx={{ color: playbackMode === "sequence" ? "text.secondary" : "primary.main" }}
                  title={t("player.modeSequence")}
                >
                  {playbackMode === "repeat-one" ? (
                    <RepeatOne />
                  ) : playbackMode === "repeat-all" ? (
                    <Repeat />
                  ) : playbackMode === "shuffle" ? (
                    <Shuffle />
                  ) : (
                    <QueueMusic />
                  )}
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  {playbackMode === "repeat-one"
                    ? t("player.modeRepeatOne")
                    : playbackMode === "repeat-all"
                    ? t("player.modeRepeatAll")
                    : playbackMode === "shuffle"
                    ? t("player.modeShuffle")
                    : t("player.modeSequence")}
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  color: "#0B1F2A",
                  background:
                    "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(245, 215, 110, 0.98) 0%, rgba(15, 118, 110, 1) 100%)"
                  }
                }}
              >
                {t("player.download")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={handleShare}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  borderWidth: 2,
                  borderColor: "rgba(212, 175, 55, 0.6)",
                  color: "text.primary",
                  "&:hover": {
                    borderWidth: 2
                  }
                }}
              >
                {t("player.share")}
              </Button>
            </Box>
          </Box>
        </Paper>
        <div style={{ display: "none" }}>
          {/* audio element is managed globally by AudioPlayerProvider */}
        </div>
      </Container>

      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: "rgba(15, 28, 39, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }
        }}
      >
        <DialogTitle>{t("player.shareTitle")}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            value={shareUrl}
            label={t("player.shareLink")}
            InputProps={{ readOnly: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                background: "rgba(8, 18, 25, 0.7)",
                color: "#F8F6F1"
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              if (navigator.clipboard && shareUrl) {
                await navigator.clipboard.writeText(shareUrl);
                setToast({ message: t("player.linkCopied"), severity: "success" });
              }
            }}
          >
            {t("player.copyLink")}
          </Button>
          <Button onClick={() => setShareOpen(false)}>{t("player.close")}</Button>
        </DialogActions>
      </Dialog>

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

      <Snackbar
        open={conversionOpen}
        autoHideDuration={6000}
        onClose={() => setConversionOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setConversionOpen(false)} sx={{ borderRadius: 2 }}>
          {t("player.conversion")}…
        </Alert>
      </Snackbar>
    </Box>
  );
}
