import { useEffect, useRef, useState } from "react";
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
  ArrowBack
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { getPublicAudioBySlug, listAudios, sharePublicAudio } from "../api/audios";
import { isNetworkError } from "../api/client";
import { mapAudioToRecitation, mapPublicAudioToRecitation } from "../api/mappers";
import type { Recitation } from "../domain/types";

export function RecitationPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const publicAppUrl =
    import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

  const [recitation, setRecitation] = useState<Recitation | null>(null);
  const [allRecitations, setAllRecitations] = useState<Recitation[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
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

  useEffect(() => {
    let active = true;
    const loadRecitations = async () => {
      try {
        const all = await listAudios();
        if (!active) return;
        setAllRecitations(all.map(mapAudioToRecitation));
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
  }, []);

  useEffect(() => {
    let active = true;
    const loadRecitation = async () => {
      if (!id) return;
      try {
        const audio = await getPublicAudioBySlug(id);
        if (!active) return;
        setRecitation(mapPublicAudioToRecitation(audio));
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        const message = err instanceof Error ? err.message : "Récitation introuvable";
        setError(message);
      }
    };
    loadRecitation();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
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

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("loadstart", onLoadStart);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("loadstart", onLoadStart);
      if (conversionTimerRef.current) {
        window.clearTimeout(conversionTimerRef.current);
        conversionTimerRef.current = null;
      }
    };
  }, [recitation?.streamUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    setAudioLoadError("");
    setHasTriedPlay(false);
  }, [recitation?.slug]);

  const currentIndex = allRecitations.findIndex(
    (item) => item.slug === recitation?.slug || item.id === recitation?.id
  );
  const previousRecitation = currentIndex > 0 ? allRecitations[currentIndex - 1] : null;
  const nextRecitation =
    currentIndex >= 0 && currentIndex < allRecitations.length - 1
      ? allRecitations[currentIndex + 1]
      : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setHasTriedPlay(true);
      if (audioLoadError) {
        setToast({ message: audioLoadError, severity: "error" });
        return;
      }
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      if (isNetworkError(err)) return;
      setToast({ message: err instanceof Error ? err.message : "Lecture impossible", severity: "error" });
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Array.isArray(value) ? value[0] : value;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolume = (_: Event, value: number | number[]) => {
    const nextVolume = Array.isArray(value) ? value[0] : value;
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = nextVolume / 100;
    }
  };

  const handleDownload = () => {
    if (!recitation?.downloadUrl) return;
    window.open(recitation.downloadUrl, "_blank", "noopener");
    setToast({ message: "Téléchargement démarré.", severity: "success" });
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
            text: `Écoutez ${recitation.title}`,
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
          <Typography>{error || "Récitation non trouvée"}</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Navbar />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/")}
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "primary.main",
            textTransform: "none"
          }}
        >
          Retour aux récitations
        </Button>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "white"
          }}
        >
          {/* Cover Art */}
          <Box
            sx={{
              position: "relative",
              paddingTop: "56.25%",
              background: "linear-gradient(135deg, #047857 0%, #059669 100%)"
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url('https://images.unsplash.com/photo-1590720485412-fc0322a7acb2?w=800')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.3
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
                  color: "white",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)"
                }}
              >
                Sourate {recitation.surahNumber} • Verset {recitation.ayatRange}
              </Typography>
            </Box>

            {recitation.withBasmala && (
              <Chip
                label="Avec Basmala"
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(212, 175, 55, 0.95)",
                  color: "white",
                  fontWeight: 700
                }}
              />
            )}

            {showConversionBadge && (
              <Chip
                label="Conversion en cours"
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  background: "rgba(2, 132, 199, 0.9)",
                  color: "white",
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
                  <Chip label={`${recitation.listens.toLocaleString()} écoutes`} size="small" />
                  <Chip label={`${recitation.downloads.toLocaleString()} téléchargements`} size="small" />
                  <Chip label={recitation.date} size="small" />
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

            <Divider sx={{ my: 3 }} />

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
                onClick={() =>
                  previousRecitation && navigate(`/recitation/${previousRecitation.slug || previousRecitation.id}`)
                }
                sx={{
                  border: "2px solid",
                  borderColor: "divider"
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
                  background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(4, 120, 87, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
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
                onClick={() =>
                  nextRecitation && navigate(`/recitation/${nextRecitation.slug || nextRecitation.id}`)
                }
                sx={{
                  border: "2px solid",
                  borderColor: "divider"
                }}
              >
                <SkipNext />
              </IconButton>
            </Box>

            {/* Volume Control */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <VolumeUp color="action" />
              <Slider value={volume} onChange={handleVolume} sx={{ flexGrow: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                {volume}%
              </Typography>
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
                  background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)"
                  }
                }}
              >
                Télécharger
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
                  "&:hover": {
                    borderWidth: 2
                  }
                }}
              >
                Partager
              </Button>
            </Box>
          </Box>
        </Paper>
        <audio
          ref={audioRef}
          src={recitation.streamUrl || recitation.downloadUrl}
          preload="metadata"
          onError={() => {
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
          }}
        />
      </Container>

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Partager cette récitation</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth value={shareUrl} label="Lien de partage" InputProps={{ readOnly: true }} />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              if (navigator.clipboard && shareUrl) {
                await navigator.clipboard.writeText(shareUrl);
                setToast({ message: "Lien copié.", severity: "success" });
              }
            }}
          >
            Copier le lien
          </Button>
          <Button onClick={() => setShareOpen(false)}>Fermer</Button>
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
          Conversion audio en cours… veuillez patienter.
        </Alert>
      </Snackbar>
    </Box>
  );
}
