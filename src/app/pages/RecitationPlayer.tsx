import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Container,
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  LinearProgress,
  Button,
  Chip,
  Divider,
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
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { mockRecitations } from "../data/mockData";

export function RecitationPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recitation = mockRecitations.find((r) => r.id === id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // Mock duration in seconds
  const [volume, setVolume] = useState(80);
  const [isFavorite, setIsFavorite] = useState(false);

  const currentIndex = mockRecitations.findIndex((r) => r.id === id);
  const previousRecitation = currentIndex > 0 ? mockRecitations[currentIndex - 1] : null;
  const nextRecitation =
    currentIndex < mockRecitations.length - 1 ? mockRecitations[currentIndex + 1] : null;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  if (!recitation) {
    return (
      <Box>
        <Navbar />
        <Container>
          <Typography>Récitation non trouvée</Typography>
        </Container>
      </Box>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
            textTransform: "none",
          }}
        >
          Retour aux récitations
        </Button>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "white",
          }}
        >
          {/* Cover Art */}
          <Box
            sx={{
              position: "relative",
              paddingTop: "56.25%",
              background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
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
                opacity: 0.3,
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
                px: 2,
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  textShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                  mb: 1,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                {recitation.surah}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
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
                  fontWeight: 700,
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
                  color: isFavorite ? "error.main" : "text.secondary",
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
                max={duration}
                onChange={(_, value) => setCurrentTime(value as number)}
                sx={{
                  color: "primary.main",
                  "& .MuiSlider-thumb": {
                    width: 16,
                    height: 16,
                  },
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
                my: 3,
              }}
            >
              <IconButton
                size="large"
                disabled={!previousRecitation}
                onClick={() => previousRecitation && navigate(`/recitation/${previousRecitation.id}`)}
                sx={{
                  border: "2px solid",
                  borderColor: "divider",
                }}
              >
                <SkipPrevious />
              </IconButton>

              <IconButton
                size="large"
                onClick={() => setIsPlaying(!isPlaying)}
                sx={{
                  width: 72,
                  height: 72,
                  background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(4, 120, 87, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s",
                }}
              >
                {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
              </IconButton>

              <IconButton
                size="large"
                disabled={!nextRecitation}
                onClick={() => nextRecitation && navigate(`/recitation/${nextRecitation.id}`)}
                sx={{
                  border: "2px solid",
                  borderColor: "divider",
                }}
              >
                <SkipNext />
              </IconButton>
            </Box>

            {/* Volume Control */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <VolumeUp color="action" />
              <Slider
                value={volume}
                onChange={(_, value) => setVolume(value as number)}
                sx={{ flexGrow: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                {volume}%
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)",
                  },
                }}
              >
                Télécharger
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                  },
                }}
              >
                Partager
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
