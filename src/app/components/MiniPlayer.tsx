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
  OpenInFull,
  Close
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

  const [position, setPosition] = useState({ x: 16, y: 16 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const fixedSize = { w: 450, h: 190 };

  useEffect(() => {
    posRef.current = position;
  }, [position]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;

      const boundW = collapsed ? 120 : fixedSize.w;
      const boundH = collapsed ? 120 : fixedSize.h;
      const nextX = Math.max(8, Math.min(window.innerWidth - boundW - 8, event.clientX));
      const nextY = Math.max(8, Math.min(window.innerHeight - boundH - 8, event.clientY));
      posRef.current = { x: nextX, y: nextY };
      if (targetRef.current) {
        targetRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = "";
      setPosition(posRef.current);
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
  const isHomePage = location.pathname === "/";
  const isLoginPage = location.pathname.startsWith("/login");
  const hasStartedPlayback = hasPlaybackStarted || isPlaying || currentTime > 0;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const targetId = currentRecitation?.slug || currentRecitation?.id;
  const isCompact = fixedSize.w < 190;
  const collapsed = false;
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

  if (!currentRecitation || !hasStartedPlayback || isPlayerPage || isHomePage || isLoginPage || !targetId) {
    return null;
  }

  const effectiveWidth = fixedSize.w;
  const effectiveHeight = fixedSize.h;

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
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: "transform, width, height",
        transition: "box-shadow 240ms ease, opacity 240ms ease",
        boxSizing: "border-box",
        overflow: "hidden",
        "&:active": { cursor: "grabbing" },
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
