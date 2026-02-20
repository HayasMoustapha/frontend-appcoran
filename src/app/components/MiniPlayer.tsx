import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { Pause, PlayArrow, SkipNext, SkipPrevious } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "./AudioPlayerProvider";

export function MiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentRecitation,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious
  } = useAudioPlayer();

  const [position, setPosition] = useState({ x: 16, y: 16 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);

  useEffect(() => {
    posRef.current = position;
  }, [position]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const nextX = Math.max(
        8,
        Math.min(window.innerWidth - 120, posRef.current.x + (event.clientX - startRef.current.x))
      );
      const nextY = Math.max(
        8,
        Math.min(window.innerHeight - 140, posRef.current.y + (event.clientY - startRef.current.y))
      );
      setPosition({ x: nextX, y: nextY });
      startRef.current = { x: event.clientX, y: event.clientY };
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const isPlayerPage = location.pathname.startsWith("/recitation/");
  if (!currentRecitation || isPlayerPage) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const targetId = currentRecitation.slug || currentRecitation.id;

  return (
    <Box
      sx={{
        position: "fixed",
        right: "auto",
        left: position.x,
        bottom: "auto",
        top: position.y,
        zIndex: 1300,
        width: 120,
        background: "rgba(12, 24, 34, 0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        p: 1,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        backdropFilter: "blur(14px)",
        display: "grid",
        gap: 0.75,
        cursor: "grab",
        opacity: 0.9,
        "&:active": { cursor: "grabbing" }
      }}
      onPointerDown={(event) => {
        draggingRef.current = true;
        startRef.current = { x: event.clientX, y: event.clientY };
      }}
    >
      <Box
        onClick={() => navigate(`/recitation/${targetId}`)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.35,
          cursor: "pointer"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              playPrevious();
            }}
            sx={{ color: "text.secondary" }}
          >
            <SkipPrevious fontSize="small" />
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
            <SkipNext fontSize="small" />
          </IconButton>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {currentRecitation.surah}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
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
