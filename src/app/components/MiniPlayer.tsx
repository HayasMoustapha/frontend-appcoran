import {
  Box,
  IconButton,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Pause,
  PlayArrow,
  SkipNext,
  SkipPrevious,
  Repeat,
  RepeatOne,
  Shuffle,
  QueueMusic,
  OpenInFull,
  Close,
  Remove
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
    hasPlaybackStarted,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    playbackMode,
    cyclePlaybackMode,
    stopPlayback
  } = useAudioPlayer();

  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 16, y: 16 };
    const saved = window.localStorage.getItem("appcoran-miniplayer-pos");
    if (!saved) return { x: 16, y: 16 };
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
        return { x: parsed.x, y: parsed.y };
      }
    } catch {
      // ignore
    }
    return { x: 16, y: 16 };
  });
  const [minimized, setMinimized] = useState(false);
  const draggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const fixedSize = { w: 450, h: 190 };
  const minimizedSize = { w: 56, h: 56 };
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    posRef.current = position;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("appcoran-miniplayer-pos", JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      if (!dragMovedRef.current) {
        const dx = Math.abs(event.clientX - startRef.current.x);
        const dy = Math.abs(event.clientY - startRef.current.y);
        if (dx > 3 || dy > 3) {
          dragMovedRef.current = true;
        }
      }

      const isCollapsed = minimized;
      const boundW = isCollapsed ? minimizedSize.w : fixedSize.w;
      const boundH = isCollapsed ? minimizedSize.h : fixedSize.h;
      const padding = 8;
      const safeTop = 12;
      const safeRight = 12;
      const safeBottom = 12 + 16;
      const safeLeft = 12;

      let nextX = Math.max(padding + safeLeft, Math.min(window.innerWidth - boundW - padding - safeRight, event.clientX));
      let nextY = Math.max(padding + safeTop, Math.min(window.innerHeight - boundH - padding - safeBottom, event.clientY));

      if (isCollapsed) {
        const fabSafe = 104;
        const maxX = window.innerWidth - boundW - fabSafe;
        const maxY = window.innerHeight - boundH - fabSafe;
        if (nextX > maxX && nextY > maxY) {
          nextX = Math.max(padding, maxX);
          nextY = Math.max(padding, maxY);
        }
      }
      posRef.current = { x: nextX, y: nextY };
      if (targetRef.current) {
        targetRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = "";
      setPosition(posRef.current);
      if (minimized && !dragMovedRef.current) {
        setMinimized(false);
      }
      dragMovedRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // no-op
    };
  }, [minimized]);

  const isPlayerPage = location.pathname.startsWith("/recitation/");
  const hasStartedPlayback = hasPlaybackStarted || isPlaying || currentTime > 0;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const targetId = currentRecitation?.slug || currentRecitation?.id;
  const isCompact = fixedSize.w < 190;
  const collapsed = minimized;
  const innerPadding = "10px";
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
  const iconSx = {
    color: "rgba(232,220,190,0.78)",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "all 180ms ease",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.08)",
      color: "rgba(246,233,198,0.92)"
    }
  } as const;

  const waveBarSx = (index: number) => ({
    width: 4,
    borderRadius: 999,
    background:
      "linear-gradient(180deg, rgba(212,175,55,0.9), rgba(15,118,110,0.9))",
    height: isPlaying ? 16 : 6,
    opacity: isPlaying ? 0.9 : 0.55,
    animation: isPlaying ? `miniPulse 900ms ${index * 120}ms ease-in-out infinite` : "none"
  });

  useEffect(() => {
    if (!minimized) return;
    const targetX = Math.max(16, Math.round(window.innerWidth / 2 - minimizedSize.w - 16));
    const targetY = Math.max(16, Math.round(window.innerHeight - minimizedSize.h - 28));
    const safeX = Math.min(targetX, Math.max(16, window.innerWidth - minimizedSize.w - 104));
    const safeY = Math.min(targetY, Math.max(16, window.innerHeight - minimizedSize.h - 104));
    setPosition({ x: Math.max(16, safeX), y: Math.max(16, safeY) });
  }, [minimized]);

  if (!currentRecitation || !hasStartedPlayback || isPlayerPage || !targetId) {
    return null;
  }

  const safeBottom = isSmallScreen ? "calc(env(safe-area-inset-bottom, 0px) + 10px)" : "auto";
  const effectiveWidth = isSmallScreen ? "100vw" : fixedSize.w;
  const effectiveHeight = isSmallScreen ? 110 : fixedSize.h;

  if (minimized) {
    return (
      <Box
        ref={targetRef}
        sx={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1300,
          width: minimizedSize.w,
          height: minimizedSize.h,
          borderRadius: "50%",
          background:
            "linear-gradient(145deg, rgba(10,25,36,0.96), rgba(9,22,32,0.9))",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 10px 22px rgba(2,6,12,0.5)",
          display: "grid",
          placeItems: "center",
          cursor: "grab",
          userSelect: "none",
          touchAction: "none",
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          "&:active": { cursor: "grabbing" }
        }}
        onPointerDown={(event) => {
          if (isSmallScreen) return;
          event.preventDefault();
          draggingRef.current = true;
          dragMovedRef.current = false;
          startRef.current = { x: event.clientX, y: event.clientY };
          document.body.style.userSelect = "none";
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }}
        onClick={() => {
          if (dragMovedRef.current) return;
          setMinimized(false);
        }}
      >
        <IconButton
          onClick={() => setMinimized(false)}
          sx={{
            color: "rgba(246,233,198,0.92)",
            backgroundColor: "rgba(255,255,255,0.04)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" }
          }}
        >
          <OpenInFull fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      ref={targetRef}
      sx={{
        position: "fixed",
        right: "auto",
        left: isSmallScreen ? 0 : 0,
        bottom: isSmallScreen ? safeBottom : "auto",
        top: isSmallScreen ? "auto" : 0,
        zIndex: 1300,
        width: effectiveWidth,
        height: effectiveHeight,
        background:
          "linear-gradient(145deg, rgba(10,25,36,0.96), rgba(9,22,32,0.9))",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: 4,
        p: 0,
        boxShadow:
          "0 14px 32px rgba(2,6,12,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px) saturate(120%)",
        display: "grid",
        gap: 0,
        cursor: "grab",
        opacity: 0.95,
        userSelect: "none",
        touchAction: "none",
        transform: isSmallScreen ? "translate3d(0,0,0)" : `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: "transform, width, height",
        transition: "box-shadow 240ms ease, opacity 240ms ease",
        boxSizing: "border-box",
        overflow: "hidden",
        "&:active": { cursor: "grabbing" },
        "&.mini-snap-active": {
          boxShadow: "0 0 0 2px rgba(212,175,55,0.35), 0 16px 36px rgba(2,6,12,0.65)"
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 10% 20%, rgba(212,175,55,0.12), transparent 45%)",
          opacity: 0.9,
          pointerEvents: "none"
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.18))",
          pointerEvents: "none"
        },
        "@keyframes miniPulse": {
          "0%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1.2)" },
          "100%": { transform: "scaleY(0.5)" }
        }
      }}
      onPointerDown={(event) => {
        if (isSmallScreen) return;
        if ((event.target as HTMLElement)?.dataset?.resizeHandle) return;
        if ((event.target as HTMLElement)?.closest("[data-no-drag]")) return;
        event.preventDefault();
        draggingRef.current = true;
        startRef.current = { x: event.clientX, y: event.clientY };
        document.body.style.userSelect = "none";
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      }}
      onPointerUp={() => {
        if (isSmallScreen) return;
        const boundW = fixedSize.w;
        const boundH = fixedSize.h;
        const margin = 12;
        const leftSnap = margin;
        const rightSnap = window.innerWidth - boundW - margin;
        const topSnap = margin;
        const bottomSnap = window.innerHeight - boundH - margin;
        let nextX = position.x;
        let nextY = position.y;
        const snapThreshold = 32;
        const shouldSnapX = Math.abs(nextX - leftSnap) < snapThreshold || Math.abs(nextX - rightSnap) < snapThreshold;
        const shouldSnapY = Math.abs(nextY - topSnap) < snapThreshold || Math.abs(nextY - bottomSnap) < snapThreshold;
        if (Math.abs(nextX - leftSnap) < snapThreshold) nextX = leftSnap;
        if (Math.abs(nextX - rightSnap) < snapThreshold) nextX = rightSnap;
        if (Math.abs(nextY - topSnap) < snapThreshold) nextY = topSnap;
        if (Math.abs(nextY - bottomSnap) < snapThreshold) nextY = bottomSnap;
        if (nextX !== position.x || nextY !== position.y) {
          setPosition({ x: nextX, y: nextY });
        }
        if (shouldSnapX || shouldSnapY) {
          targetRef.current?.classList.add("mini-snap-active");
          window.setTimeout(() => targetRef.current?.classList.remove("mini-snap-active"), 280);
        }
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          width: "100%",
          display: "grid",
          gap: 0.6,
          padding: innerPadding,
          boxSizing: "border-box"
        }}
      >
        <Box
          onClick={() => navigate(`/recitation/${targetId}`)}
          sx={{
            display: "grid",
            gap: 0.6,
            cursor: "pointer"
          }}
        >
          <Box
            data-no-drag
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              flexWrap: "wrap",
              justifyContent: "space-between"
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                flex: 1,
                justifyContent: "center"
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  playPrevious();
                }}
                sx={iconSx}
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
                  ...iconSx,
                  color: "#0B1F2A",
                  background:
                    "linear-gradient(135deg, rgba(212,175,55,0.98), rgba(15,118,110,0.92))",
                  border: "1px solid rgba(212,175,55,0.45)"
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
                sx={iconSx}
              >
                <SkipNext fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  cyclePlaybackMode();
                }}
                sx={{
                  ...iconSx,
                  color:
                    playbackMode === "sequence"
                      ? "rgba(232,220,190,0.7)"
                      : "rgba(212,175,55,0.95)"
                }}
              >
                {modeIcon}
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(true);
                }}
                sx={iconSx}
              >
                <Remove fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/recitation/${targetId}`);
                }}
                sx={iconSx}
              >
                <OpenInFull fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  stopPlayback();
                }}
                sx={iconSx}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(232,220,190,0.78)",
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em"
          }}
        >
          {collapsed ? currentRecitation.surah : currentRecitation.title}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 0.6,
            width: "100%",
            height: 18,
            mt: 0.2
          }}
        >
          {[0, 1, 2, 3, 4].map((index) => (
            <Box key={index} sx={waveBarSx(index)} />
          ))}
        </Box>
      </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            width: "100%",
            height: 4,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.06)",
            "& .MuiLinearProgress-bar": {
              background:
                "linear-gradient(135deg, rgba(212,175,55,0.98), rgba(15,118,110,0.92))"
            }
          }}
        />
        {isCompact && (
          <Typography
            variant="caption"
            sx={{
              color: "rgba(232,220,190,0.65)",
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
      </Box>
    </Box>
  );
}
