import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  LinearProgress,
  IconButton,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider
} from "@mui/material";
import {
  Mic,
  Stop,
  PlayArrow,
  Upload,
  Delete,
  Check,
  ArrowBack,
  CloudUpload,
  AudioFile
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router";
import { uploadAudio } from "../api/audios";
import { isNetworkError } from "../api/client";
import { getSurahReference } from "../api/surahReference";
import type { SurahReference } from "../domain/types";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../utils/formatNumber";
import { useDataRefresh } from "../state/dataRefresh";

type RecordingState = "idle" | "recording" | "recorded" | "uploading" | "success";

export function RecordPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { triggerRefresh } = useDataRefresh();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [title, setTitle] = useState("");
  const [selectedSurah, setSelectedSurah] = useState("");
  const [verseStart, setVerseStart] = useState<number | "">("");
  const [verseEnd, setVerseEnd] = useState<number | "">("");
  const [isComplete, setIsComplete] = useState(false);
  const [description, setDescription] = useState("");
  const [withBasmala, setWithBasmala] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [surahReference, setSurahReference] = useState<SurahReference[]>([]);
  const [surahLoading, setSurahLoading] = useState(true);
  const [surahError, setSurahError] = useState("");

  useEffect(() => {
    let active = true;
    const loadSurahReference = async () => {
      try {
        const data = await getSurahReference();
        if (!active) return;
        const sorted = [...data].sort((a, b) => a.number - b.number);
        setSurahReference(sorted);
        setSurahError("");
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        setSurahError(err instanceof Error ? err.message : "Référentiel indisponible");
      } finally {
        if (active) setSurahLoading(false);
      }
    };
    loadSurahReference();
    return () => {
      active = false;
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!uploadedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      setIsPreviewing(false);
      return;
    }
    const nextUrl = URL.createObjectURL(uploadedFile);
    setPreviewUrl(nextUrl);
    setIsPreviewing(false);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [uploadedFile]);

  useEffect(() => {
    setVerseStart("");
    setVerseEnd("");
  }, [selectedSurah]);

  const sortedSurahs = useMemo(
    () => [...surahReference].sort((a, b) => a.number - b.number),
    [surahReference]
  );

  useEffect(() => {
    if (!isComplete) return;
    const entry = sortedSurahs.find((surah) => surah.number.toString() === selectedSurah);
    if (!entry) return;
    setVerseStart(1);
    setVerseEnd(entry.verses);
  }, [isComplete, selectedSurah, sortedSurahs]);

  useEffect(() => {
    if (!selectedSurah) {
      setTitle("");
      return;
    }
    const selected = sortedSurahs.find((surah) => surah.number.toString() === selectedSurah);
    if (selected) {
      const localName = selected.name_local ?? selected.name_fr;
      setTitle(`${selected.number}. ${localName} (${selected.name_phonetic})`);
    }
  }, [selectedSurah, sortedSurahs, i18n.language]);

  useEffect(() => {
    if (!title) return;
    const match = title.match(/^(\d+)\./);
    if (!match) return;
    const number = match[1];
    if (number && number !== selectedSurah) {
      setSelectedSurah(number);
    }
  }, [title, selectedSurah]);

  useEffect(() => {
    if (verseStart === "") {
      setVerseEnd("");
      return;
    }
    if (verseEnd !== "" && Number(verseEnd) < Number(verseStart)) {
      setVerseEnd(verseStart);
    }
  }, [verseStart, verseEnd]);

  const handleStartRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("record.recordingUnsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `recitation-${Date.now()}.webm`, { type: blob.type });
        setUploadedFile(file);
        setRecordingState("recorded");
        setToast({ message: t("record.recordingReadyToast"), severity: "success" });
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
      setRecordingState("recording");
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      recordingIntervalRef.current = interval;
    } catch (err) {
      setError("Impossible d'accéder au micro.");
    }
  };

  const handleStopRecording = () => {
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setRecordingState("recorded");
    }
  };

  const handleDeleteRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecordingState("idle");
    setRecordingTime(0);
    setUploadedFile(null);
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.currentTime = 0;
    }
    setToast({ message: t("record.recordingDeleted"), severity: "success" });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setRecordingState("recorded");
      setRecordingTime(180);
      setError("");
      setToast({ message: "Fichier importé.", severity: "success" });
    }
  };

  const handlePreviewToggle = async () => {
    if (!previewRef.current || !previewUrl) return;
    try {
      if (isPreviewing) {
        previewRef.current.pause();
        setIsPreviewing(false);
      } else {
        await previewRef.current.play();
        setIsPreviewing(true);
      }
    } catch (err) {
      setError("Lecture impossible. Vérifiez le fichier audio.");
    }
  };

  const handlePublish = async () => {
    if (!uploadedFile) {
      setError("Veuillez importer ou enregistrer un fichier audio.");
      return;
    }
    setRecordingState("uploading");
    setUploadProgress(0);
    setError("");

    const selected = sortedSurahs.find((surah) => surah.number.toString() === selectedSurah);
    if (!selected) {
      setRecordingState("recorded");
      setUploadProgress(0);
      setError("Veuillez sélectionner une sourate valide.");
      return;
    }
    const normalizedStart = isComplete ? 1 : verseStart === "" ? undefined : Number(verseStart);
    const normalizedEnd = isComplete
      ? selected?.verses
      : verseEnd === ""
      ? normalizedStart
      : Number(verseEnd);
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("title", title);
    formData.append("sourate", selected?.name_ar || "");
    formData.append("numeroSourate", selectedSurah);
    if (normalizedStart !== undefined) formData.append("versetStart", String(normalizedStart));
    if (normalizedEnd !== undefined) formData.append("versetEnd", String(normalizedEnd));
    formData.append("description", description);
    formData.append("addBasmala", String(withBasmala));
    formData.append("isComplete", String(isComplete));

    try {
      await uploadAudio(formData, (progress) => {
        setUploadProgress(Math.min(99, Math.max(0, progress)));
      });
      setUploadProgress(100);
      setRecordingState("success");
      setToast({ message: t("record.publishedSuccess"), severity: "success" });
      triggerRefresh();
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setRecordingState("recorded");
      setUploadProgress(0);
      if (isNetworkError(err)) return;
      setError(err instanceof Error ? err.message : t("record.publishFailed"));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedSurahEntry = sortedSurahs.find(
    (surah) => surah.number.toString() === selectedSurah
  );
  const verseOptions = selectedSurahEntry
    ? Array.from({ length: selectedSurahEntry.verses }, (_, i) => i + 1)
    : [];
  const verseEndOptions =
    verseStart !== "" ? verseOptions.filter((value) => value >= Number(verseStart)) : verseOptions;

  return (
    <Box sx={{ minHeight: "100vh", background: "#0B1F2A" }}>
      <Navbar isImam />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "none"
          }}
        >
          {t("record.back")}
        </Button>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: "rgba(15, 28, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                color: "#0B1F2A",
                mx: "auto",
                mb: 2,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)"
              }}
            >
              <Mic />
            </Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              {t("record.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("record.subtitle")}
            </Typography>
          </Box>

          {recordingState === "success" && (
            <Alert severity="success" icon={<Check />} sx={{ mb: 3, borderRadius: 2 }}>
              Votre récitation a été publiée avec succès ! Redirection...
            </Alert>
          )}

          {/* Recording Control */}
          <Box
            sx={{
              mb: 4,
              p: 4,
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(15, 118, 110, 0.12) 0%, rgba(212, 175, 55, 0.12) 100%)",
              border: "2px solid",
              borderColor:
                recordingState === "recording" ? "error.main" : "rgba(255, 255, 255, 0.08)",
              textAlign: "center"
            }}
          >
            {recordingState === "idle" && (
              <>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t("record.recordingReady")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t("record.chooseMethod")}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    justifyContent: "center",
                    alignItems: "stretch"
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Mic />}
                    onClick={handleStartRecording}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 2,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#0B1F2A",
                      background:
                        "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                      boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
                      flex: 1
                    }}
                  >
                    {t("record.record")}
                  </Button>

                  <Box sx={{ display: { xs: "block", sm: "none" }, my: 1 }}>
                    <Divider>OU</Divider>
                  </Box>
                  <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", px: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      OU
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="large"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 2,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      borderWidth: 2,
                      borderColor: "rgba(212, 175, 55, 0.6)",
                      color: "#F8F6F1",
                      flex: 1,
                      "&:hover": {
                        borderWidth: 2,
                        background: "rgba(212, 175, 55, 0.1)"
                      }
                    }}
                  >
                    {t("record.uploadFile")}
                    <input
                      type="file"
                      accept="audio/*,video/*,.mp4"
                      hidden
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>

                {uploadedFile && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2.5,
                      background: "rgba(8, 18, 25, 0.7)",
                      borderRadius: 2,
                      border: "1px solid rgba(255, 255, 255, 0.08)"
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <AudioFile sx={{ fontSize: 32, color: "primary.main" }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" fontWeight={600} color="text.primary">
                          {uploadedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}

            {recordingState === "recording" && (
              <>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "error.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    animation: "pulse 2s ease-in-out infinite",
                    "@keyframes pulse": {
                      "0%, 100%": {
                        boxShadow: "0 0 0 0 rgba(211, 47, 47, 0.7)"
                      },
                      "50%": {
                        boxShadow: "0 0 0 20px rgba(211, 47, 47, 0)"
                      }
                    }
                  }}
                >
                  <Mic sx={{ fontSize: 48, color: "white" }} />
                </Box>
                <Typography variant="h4" fontWeight={800} color="error" gutterBottom>
                  {formatTime(recordingTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t("record.recordingInProgress")}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<Stop />}
                  onClick={handleStopRecording}
                  sx={{
                    borderRadius: 3,
                    px: 5,
                    py: 2,
                    fontSize: "1.1rem",
                    fontWeight: 700
                  }}
                >
                  {t("record.stop")}
                </Button>
              </>
            )}

            {recordingState === "recorded" && (
              <>
                <Typography variant="h6" gutterBottom fontWeight={600} color="success.main">
                  {t("record.recordingDone")}
                </Typography>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {formatTime(recordingTime)}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
                  <IconButton
                    size="large"
                    onClick={handlePreviewToggle}
                    disabled={!previewUrl}
                    sx={{
                      border: "2px solid",
                      borderColor: "primary.main",
                      color: "primary.main"
                    }}
                  >
                    {isPreviewing ? <Stop /> : <PlayArrow />}
                  </IconButton>
                  <IconButton
                    size="large"
                    onClick={handleDeleteRecording}
                    sx={{
                      border: "2px solid",
                      borderColor: "error.main",
                      color: "error.main"
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>

          <audio
            ref={previewRef}
            src={previewUrl}
            onEnded={() => setIsPreviewing(false)}
          />

          {/* Form Fields */}
          {(recordingState === "recorded" || recordingState === "uploading") && (
            <Box sx={{ mb: 3 }}>
              <FormControl
                fullWidth
                sx={{ mb: 3 }}
                disabled={recordingState === "uploading" || surahLoading || Boolean(surahError)}
              >
                <InputLabel sx={{ color: "text.secondary" }}>{t("record.titleSurah")}</InputLabel>
                <Select
                  value={title}
                  label={t("record.titleSurah")}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTitle(next);
                  }}
                  sx={{
                    background: "rgba(8, 18, 25, 0.7)",
                    color: "text.primary",
                    ".MuiSvgIcon-root": { color: "text.secondary" }
                  }}
                >
                  {sortedSurahs.map((surah) => {
                    const localName = surah.name_local ?? surah.name_fr;
                    const fullTitle = `${surah.number}. ${localName} (${surah.name_phonetic})`;
                    return (
                      <MenuItem key={surah.number} value={fullTitle}>
                        {fullTitle}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <FormControl
                  data-testid="surah-select"
                  fullWidth
                  disabled={recordingState === "uploading" || surahLoading || Boolean(surahError)}
                >
                  <InputLabel sx={{ color: "text.secondary" }}>{t("record.surah")}</InputLabel>
                  <Select
                    value={selectedSurah}
                    label={t("record.surah")}
                    onChange={(e) => setSelectedSurah(e.target.value)}
                    sx={{
                      background: "rgba(8, 18, 25, 0.7)",
                      color: "text.primary",
                      ".MuiSvgIcon-root": { color: "text.secondary" }
                    }}
                  >
                    {sortedSurahs.map((surah) => (
                      <MenuItem key={surah.number} value={surah.number.toString()}>
                        {formatNumber(surah.number, i18n.language)}. {surah.name_local ?? surah.name_fr} •{" "}
                        {surah.name_ar} ({surah.name_phonetic})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  data-testid="verse-start-select"
                  sx={{ minWidth: 160 }}
                  disabled={
                    recordingState === "uploading" ||
                    !selectedSurah ||
                    isComplete ||
                    surahLoading ||
                    Boolean(surahError)
                  }
                >
                  <InputLabel sx={{ color: "text.secondary" }}>{t("record.verseStart")}</InputLabel>
                  <Select
                    value={verseStart}
                    label={t("record.verseStart")}
                    onChange={(e) => {
                      const next =
                        e.target.value === "" ? "" : Number(e.target.value);
                      setVerseStart(next);
                    }}
                    sx={{
                      background: "rgba(8, 18, 25, 0.7)",
                      color: "text.primary",
                      ".MuiSvgIcon-root": { color: "text.secondary" }
                    }}
                  >
                    {verseOptions.map((value) => (
                      <MenuItem key={value} value={value}>
                        {formatNumber(value, i18n.language)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  data-testid="verse-end-select"
                  sx={{ minWidth: 160 }}
                  disabled={
                    recordingState === "uploading" ||
                    !selectedSurah ||
                    isComplete ||
                    surahLoading ||
                    Boolean(surahError)
                  }
                >
                  <InputLabel sx={{ color: "text.secondary" }}>{t("record.verseEnd")}</InputLabel>
                  <Select
                    value={verseEnd}
                    label={t("record.verseEnd")}
                    onChange={(e) => {
                      const next =
                        e.target.value === "" ? "" : Number(e.target.value);
                      setVerseEnd(next);
                    }}
                    sx={{
                      background: "rgba(8, 18, 25, 0.7)",
                      color: "text.primary",
                      ".MuiSvgIcon-root": { color: "text.secondary" }
                    }}
                  >
                    {verseEndOptions.map((value) => (
                      <MenuItem key={value} value={value}>
                        {formatNumber(value, i18n.language)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FormControlLabel
                sx={{ ml: 0, mb: 2 }}
                control={
                  <Switch
                    checked={isComplete}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setIsComplete(next);
                      if (!next) {
                        setVerseStart("");
                        setVerseEnd("");
                      }
                    }}
                    color="primary"
                    disabled={recordingState === "uploading" || !selectedSurah}
                  />
                }
                label={t("record.completeSurah")}
              />

              {surahError && (
                <Typography variant="caption" color="error" sx={{ display: "block", mb: 2 }}>
                  {surahError}
                </Typography>
              )}

              <TextField
                fullWidth
                label={t("record.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Ajoutez une description pour cette récitation..."
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(8, 18, 25, 0.7)",
                    color: "#F8F6F1"
                  }
                }}
                disabled={recordingState === "uploading"}
              />

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: withBasmala
                    ? "rgba(212, 175, 55, 0.12)"
                    : "rgba(8, 18, 25, 0.6)",
                  border: "1px solid",
                  borderColor: withBasmala ? "rgba(212, 175, 55, 0.4)" : "rgba(255, 255, 255, 0.08)",
                  mb: 3
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={withBasmala}
                      onChange={(e) => setWithBasmala(e.target.checked)}
                      disabled={recordingState === "uploading"}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {t("record.addBasmala")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {recordingState === "uploading" && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {t("record.publishing")}
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight={700}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      background: "rgba(8, 18, 25, 0.6)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        background: "linear-gradient(90deg, rgba(15, 118, 110, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)"
                      }
                    }}
                  />
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Upload />}
                onClick={handlePublish}
                disabled={
                  !title ||
                  !selectedSurah ||
                  recordingState === "uploading" ||
                  !uploadedFile
                }
                sx={{
                  borderRadius: 2,
                  py: 2,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0B1F2A",
                  background:
                    "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(245, 215, 110, 0.98) 0%, rgba(15, 118, 110, 1) 100%)"
                  },
                  "&.Mui-disabled": {
                    background: "rgba(255, 255, 255, 0.12)",
                    color: "rgba(255, 255, 255, 0.4)"
                  }
                }}
              >
                {t("record.publish")}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>

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
    </Box>
  );
}
