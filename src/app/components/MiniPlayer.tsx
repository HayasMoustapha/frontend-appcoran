import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import {
  Pause,
  PlayArrow,
  SkipNext,
  SkipPrevious,
  Repeat,
  RepeatOne,
  Shuffle,
  QueueMusic,
  Close,
  ExpandLess,
  ExpandMore
} from "@mui/icons-material";
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
    cyclePlaybackMode,
    stopPlayback
  } = useAudioPlayer();

  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [size, setSize] = useState({ w: 170, h: 160 });
  const [collapsed, setCollapsed] = useState(false);
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);
  const sizeRef = useRef(size);
  const targetRef = useRef<HTMLDivElement | null>(null);

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
        const nextW = Math.max(150, Math.min(window.innerWidth - 24, sizeRef.current.w + dx));
        const nextH = Math.max(130, Math.min(window.innerHeight - 24, sizeRef.current.h + dy));
        sizeRef.current = { w: nextW, h: nextH };
        if (targetRef.current) {
          targetRef.current.style.width = `${nextW}px`;
          targetRef.current.style.height = `${nextH}px`;
        }
        startRef.current = { x: event.clientX, y: event.clientY };
        return;
      }

      const boundW = collapsed ? 120 : sizeRef.current.w;
      const boundH = collapsed ? 120 : sizeRef.current.h;
      const nextX = Math.max(8, Math.min(window.innerWidth - boundW - 8, event.clientX));
      const nextY = Math.max(8, Math.min(window.innerHeight - boundH - 8, event.clientY));
      posRef.current = { x: nextX, y: nextY };
      if (targetRef.current) {
        targetRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }
    };
    const onUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
      document.body.style.userSelect = "";
      setPosition(posRef.current);
      setSize(sizeRef.current);
      // no-op
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // no-op
    };
  }, []);

  const isPlayerPage = location.pathname.startsWith("/recitation/");

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const targetId = currentRecitation?.slug || currentRecitation?.id;
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

  useEffect(() => {
    if (!currentRecitation || isPlayerPage) return;
    if (location.pathname === "/") {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [location.pathname, currentRecitation, isPlayerPage]);

  if (!currentRecitation || isPlayerPage || !targetId) return null;

  const effectiveWidth = collapsed ? 120 : size.w;
  const effectiveHeight = collapsed ? 120 : size.h;

  return (
    <Box
      ref={targetRef}
      sx={{
        position: "fixed",
        right: "auto",
        left: 0,
        bottom: "auto",
        top: 0,
        zIndex: 1300,
        width: effectiveWidth,
        height: effectiveHeight,
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
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: "transform, width, height",
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
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((prev) => (location.pathname === "/" ? true : !prev));
            }}
            sx={{ color: "text.secondary" }}
          >
            {collapsed ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              stopPlayback();
            }}
            sx={{ color: "text.secondary" }}
          >
            <Close fontSize="small" />
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
          {collapsed ? currentRecitation.surah : currentRecitation.title}
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
      {!collapsed && (
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
      )}
    </Box>
  );
}
