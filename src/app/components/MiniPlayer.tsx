import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { Pause, PlayArrow, SkipNext, SkipPrevious, Repeat, RepeatOne, Shuffle, QueueMusic } from "@mui/icons-material";
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
    playPrevious,
    playbackMode,
    cyclePlaybackMode
  } = useAudioPlayer();

  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [size, setSize] = useState({ w: 170, h: 160 });
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);
  const sizeRef = useRef(size);

  useEffect(() => {
    posRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current && !resizingRef.current) return;
      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;

      if (resizingRef.current) {
        const nextW = Math.max(140, Math.min(window.innerWidth - 24, sizeRef.current.w + dx));
        const nextH = Math.max(120, Math.min(window.innerHeight - 24, sizeRef.current.h + dy));
        setSize({ w: nextW, h: nextH });
        startRef.current = { x: event.clientX, y: event.clientY };
        return;
      }

      const nextX = Math.max(
        8,
        Math.min(window.innerWidth - sizeRef.current.w - 8, posRef.current.x + dx)
      );
      const nextY = Math.max(
        8,
        Math.min(window.innerHeight - sizeRef.current.h - 8, posRef.current.y + dy)
      );
      setPosition({ x: nextX, y: nextY });
      startRef.current = { x: event.clientX, y: event.clientY };
    };
    const onUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
      document.body.style.userSelect = "";
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
  const isCompact = size.w < 190;
  const modeIcon =
    playbackMode === "repeat-one" ? (
      <RepeatOne fontSize="small" />
    ) : playbackMode === "repeat-all" ? (
      <Repeat fontSize="small" />
    ) : playbackMode === "shuffle" ? (
      <Shuffle fontSize="small" />
    ) : (
      <QueueMusic fontSize="small" />
    );

  return (
    <Box
      sx={{
        position: "fixed",
        right: "auto",
        left: position.x,
        bottom: "auto",
        top: position.y,
        zIndex: 1300,
        width: size.w,
        height: size.h,
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
        userSelect: "none",
        touchAction: "none",
        "&:active": { cursor: "grabbing" }
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement)?.dataset?.resizeHandle) return;
        if ((event.target as HTMLElement)?.closest("[data-no-drag]")) return;
        event.preventDefault();
        draggingRef.current = true;
        startRef.current = { x: event.clientX, y: event.clientY };
        document.body.style.userSelect = "none";
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
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
        <Box data-no-drag sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              cyclePlaybackMode();
            }}
            sx={{ color: playbackMode === "sequence" ? "text.secondary" : "primary.main" }}
          >
            {modeIcon}
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
      {isCompact && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            letterSpacing: "0.06em"
          }}
        >
          {playbackMode === "repeat-one"
            ? "1x"
            : playbackMode === "repeat-all"
            ? "∞"
            : playbackMode === "shuffle"
            ? "⇄"
            : "▶"}
        </Typography>
      )}
      <Box
        data-resize-handle
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          resizingRef.current = true;
          startRef.current = { x: event.clientX, y: event.clientY };
          document.body.style.userSelect = "none";
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }}
        sx={{
          position: "absolute",
          right: 6,
          bottom: 6,
          width: 14,
          height: 14,
          borderRadius: 1,
          background: "rgba(212,175,55,0.6)",
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "nwse-resize"
        }}
      />
    </Box>
  );
}
