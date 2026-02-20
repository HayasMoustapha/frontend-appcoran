import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { Pause, PlayArrow, SkipNext, SkipPrevious } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAudioPlayer } from "./AudioPlayerProvider";

export function MiniPlayer() {
  const navigate = useNavigate();
  const {
    currentRecitation,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious
  } = useAudioPlayer();

  if (!currentRecitation) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const targetId = currentRecitation.slug || currentRecitation.id;

  return (
    <Box
      sx={{
        position: "fixed",
        left: { xs: 12, md: 24 },
        right: { xs: 12, md: 24 },
        bottom: { xs: 16, md: 24 },
        zIndex: 1300,
        background: "rgba(12, 24, 34, 0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        p: 1.5,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        backdropFilter: "blur(14px)",
        display: "grid",
        gap: 1
      }}
    >
      <Box
        onClick={() => navigate(`/recitation/${targetId}`)}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer"
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "text.primary" }}>
            {currentRecitation.title}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {currentRecitation.surah}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              playPrevious();
            }}
            sx={{ color: "text.secondary" }}
          >
            <SkipPrevious />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            sx={{
              color: "#0B1F2A",
              background: "linear-gradient(135deg, rgba(212,175,55,0.95), rgba(15,118,110,0.9))"
            }}
          >
            {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            sx={{ color: "text.secondary" }}
          >
            <SkipNext />
          </IconButton>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.08)",
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(135deg, rgba(212,175,55,0.95), rgba(15,118,110,0.9))"
          }
        }}
      />
    </Box>
  );
}
