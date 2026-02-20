import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Recitation } from "../domain/types";

type AudioPlayerContextValue = {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentRecitation: Recitation | null;
  playlist: Recitation[];
  isPlaying: boolean;
  hasPlaybackStarted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackMode: PlaybackMode;
  setPlaylist: (items: Recitation[]) => void;
  setCurrentRecitation: (recitation: Recitation | null) => void;
  playRecitation: (recitation: Recitation, autoplay?: boolean) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  cyclePlaybackMode: () => void;
  stopPlayback: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export type PlaybackMode = "sequence" | "repeat-one" | "repeat-all" | "shuffle";

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentRecitation, setCurrentRecitation] = useState<Recitation | null>(null);
  const [playlist, setPlaylist] = useState<Recitation[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("sequence");
  const pendingAutoPlayRef = useRef(false);
  const shuffleHistoryRef = useRef<Recitation[]>([]);

  const updateVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, value / 100));
    }
  }, []);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setIsPlaying(false);
    setHasPlaybackStarted(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentRecitation(null);
  }, []);

  const playRecitation = useCallback((recitation: Recitation, autoplay = true) => {
    setCurrentRecitation(recitation);
    pendingAutoPlayRef.current = autoplay;
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const playNext = useCallback(() => {
    if (!currentRecitation) return;
    if (playbackMode === "repeat-one") {
      playRecitation(currentRecitation, true);
      return;
    }
    if (playlist.length === 0) {
      stopPlayback();
      return;
    }
    const currentIndex = playlist.findIndex(
      (item) => item.slug === currentRecitation.slug || item.id === currentRecitation.id
    );
    if (playbackMode === "shuffle") {
      if (playlist.length === 1) {
        playRecitation(playlist[0], true);
        return;
      }
      const candidates = playlist.filter((item) => {
        const key = item.slug || item.id;
        return key && key !== (currentRecitation.slug || currentRecitation.id);
      });
      if (candidates.length === 0) {
        stopPlayback();
        return;
      }
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      playRecitation(random, true);
      return;
    }
    if (playbackMode === "repeat-all") {
      const next =
        currentIndex >= 0 && currentIndex < playlist.length - 1
          ? playlist[currentIndex + 1]
          : playlist[0];
      if (next) playRecitation(next, true);
      return;
    }
    const next =
      currentIndex >= 0 && currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null;
    if (next) {
      playRecitation(next, true);
    } else {
      stopPlayback();
    }
  }, [currentRecitation, playbackMode, playlist, playRecitation, stopPlayback]);

  const playPrevious = useCallback(() => {
    if (!currentRecitation) return;
    const currentIndex = playlist.findIndex(
      (item) => item.slug === currentRecitation.slug || item.id === currentRecitation.id
    );
    if (playbackMode === "shuffle") {
      const history = shuffleHistoryRef.current;
      if (history.length > 1) {
        history.pop();
        const previous = history[history.length - 1];
        playRecitation(previous, true);
        return;
      }
    }
    const prev =
      currentIndex > 0
        ? playlist[currentIndex - 1]
        : playbackMode === "repeat-all" && playlist.length > 0
        ? playlist[playlist.length - 1]
        : null;
    if (prev) playRecitation(prev, true);
  }, [currentRecitation, playbackMode, playlist, playRecitation]);

  const cyclePlaybackMode = useCallback(() => {
    setPlaybackMode((mode) => {
      if (mode === "sequence") return "repeat-all";
      if (mode === "repeat-all") return "repeat-one";
      if (mode === "repeat-one") return "shuffle";
      return "sequence";
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      playNext();
    };
    const onPlay = () => {
      setIsPlaying(true);
      setHasPlaybackStarted(true);
    };
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [playNext]);

  useEffect(() => {
    if (!currentRecitation || !audioRef.current) return;
    const audio = audioRef.current;
    const nextSrc = currentRecitation.streamUrl || currentRecitation.downloadUrl || "";
    if (!nextSrc) return;
    if (audio.src !== nextSrc) {
      audio.src = nextSrc;
      audio.load();
    }
    if (pendingAutoPlayRef.current || isPlaying) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
    pendingAutoPlayRef.current = false;
  }, [currentRecitation, isPlaying]);

  useEffect(() => {
    updateVolume(volume);
  }, [volume, updateVolume]);

  useEffect(() => {
    if (!currentRecitation) return;
    if (playbackMode !== "shuffle") return;
    const history = shuffleHistoryRef.current;
    const last = history[history.length - 1];
    if (!last || last.id !== currentRecitation.id) {
      history.push(currentRecitation);
    }
  }, [currentRecitation, playbackMode]);

  const value: AudioPlayerContextValue = {
    audioRef,
    currentRecitation,
    playlist,
    isPlaying,
    hasPlaybackStarted,
    currentTime,
    duration,
    volume,
    playbackMode,
    setPlaylist,
    setCurrentRecitation,
    playRecitation,
    togglePlay,
    seek,
    setVolume: updateVolume,
    playNext,
    playPrevious,
    setPlaybackMode,
    cyclePlaybackMode,
    stopPlayback
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </AudioPlayerContext.Provider>
  );
}
