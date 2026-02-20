import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Recitation } from "../domain/types";

type AudioPlayerContextValue = {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentRecitation: Recitation | null;
  playlist: Recitation[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  setPlaylist: (items: Recitation[]) => void;
  setCurrentRecitation: (recitation: Recitation | null) => void;
  playRecitation: (recitation: Recitation, autoplay?: boolean) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  playNext: () => void;
  playPrevious: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const pendingAutoPlayRef = useRef(false);

  const updateVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, value / 100));
    }
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
    const currentIndex = playlist.findIndex(
      (item) => item.slug === currentRecitation.slug || item.id === currentRecitation.id
    );
    const next =
      currentIndex >= 0 && currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null;
    if (next) playRecitation(next, true);
  }, [currentRecitation, playlist, playRecitation]);

  const playPrevious = useCallback(() => {
    if (!currentRecitation) return;
    const currentIndex = playlist.findIndex(
      (item) => item.slug === currentRecitation.slug || item.id === currentRecitation.id
    );
    const prev = currentIndex > 0 ? playlist[currentIndex - 1] : null;
    if (prev) playRecitation(prev, true);
  }, [currentRecitation, playlist, playRecitation]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      playNext();
    };
    const onPlay = () => setIsPlaying(true);
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

  const value: AudioPlayerContextValue = {
    audioRef,
    currentRecitation,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    setPlaylist,
    setCurrentRecitation,
    playRecitation,
    togglePlay,
    seek,
    setVolume: updateVolume,
    playNext,
    playPrevious
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </AudioPlayerContext.Provider>
  );
}
