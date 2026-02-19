import { useState } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Divider,
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
  AudioFile,
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router";

const surahs = [
  { number: 1, name: "الفاتحة", transliteration: "Al-Fatiha" },
  { number: 2, name: "البقرة", transliteration: "Al-Baqarah" },
  { number: 36, name: "يس", transliteration: "Yasin" },
  { number: 55, name: "الرحمن", transliteration: "Ar-Rahman" },
  { number: 67, name: "الملك", transliteration: "Al-Mulk" },
  { number: 112, name: "الإخلاص", transliteration: "Al-Ikhlas" },
  { number: 113, name: "الفلق", transliteration: "Al-Falaq" },
  { number: 114, name: "الناس", transliteration: "An-Nas" },
];

type RecordingState = "idle" | "recording" | "recorded" | "uploading" | "success";

export function RecordPage() {
  const navigate = useNavigate();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [title, setTitle] = useState("");
  const [selectedSurah, setSelectedSurah] = useState("");
  const [ayatRange, setAyatRange] = useState("");
  const [description, setDescription] = useState("");
  const [withBasmala, setWithBasmala] = useState(true);

  const handleStartRecording = () => {
    setRecordingState("recording");
    setRecordingTime(0);
    // Simulate recording timer
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    // Store interval ID if you need to clear it
    (window as any).recordingInterval = interval;
  };

  const handleStopRecording = () => {
    clearInterval((window as any).recordingInterval);
    setRecordingState("recorded");
  };

  const handleDeleteRecording = () => {
    setRecordingState("idle");
    setRecordingTime(0);
    setUploadedFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setUploadedFile(file);
      setRecordingState("recorded");
      // Simulate getting audio duration (3 minutes as example)
      setRecordingTime(180);
    }
  };

  const handlePublish = () => {
    setRecordingState("uploading");
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRecordingState("success");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Navbar isImam />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "primary.main",
            textTransform: "none",
          }}
        >
          Retour au tableau de bord
        </Button>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: "white",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                color: "white",
                mx: "auto",
                mb: 2,
                boxShadow: "0 8px 24px rgba(212, 175, 55, 0.3)",
              }}
            >
              <Mic />
            </Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Nouvelle Récitation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enregistrez et publiez votre récitation sacrée
            </Typography>
          </Box>

          {recordingState === "success" && (
            <Alert
              severity="success"
              icon={<Check />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              Votre récitation a été publiée avec succès ! Redirection...
            </Alert>
          )}

          {/* Recording Control */}
          <Box
            sx={{
              mb: 4,
              p: 4,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(4, 120, 87, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)",
              border: "2px solid",
              borderColor: recordingState === "recording" ? "error.main" : "divider",
              textAlign: "center",
            }}
          >
            {recordingState === "idle" && (
              <>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Prêt à enregistrer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Choisissez votre méthode d'enregistrement
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, justifyContent: "center", alignItems: "stretch" }}>
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
                      background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                      boxShadow: "0 8px 24px rgba(4, 120, 87, 0.3)",
                      flex: 1,
                    }}
                  >
                    Enregistrer
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
                      borderColor: "secondary.main",
                      color: "secondary.main",
                      flex: 1,
                      "&:hover": {
                        borderWidth: 2,
                        background: "rgba(212, 175, 55, 0.1)",
                      },
                    }}
                  >
                    Importer un fichier
                    <input
                      type="file"
                      accept="audio/*"
                      hidden
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>

                {uploadedFile && (
                  <Box sx={{ mt: 3, p: 2.5, background: "rgba(4, 120, 87, 0.05)", borderRadius: 2, border: "1px solid rgba(4, 120, 87, 0.2)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <AudioFile sx={{ fontSize: 32, color: "primary.main" }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" fontWeight={600} color="primary">
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
                        boxShadow: "0 0 0 0 rgba(211, 47, 47, 0.7)",
                      },
                      "50%": {
                        boxShadow: "0 0 0 20px rgba(211, 47, 47, 0)",
                      },
                    },
                  }}
                >
                  <Mic sx={{ fontSize: 48, color: "white" }} />
                </Box>
                <Typography variant="h4" fontWeight={800} color="error" gutterBottom>
                  {formatTime(recordingTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enregistrement en cours...
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
                    fontWeight: 700,
                  }}
                >
                  Arrêter
                </Button>
              </>
            )}

            {recordingState === "recorded" && (
              <>
                <Typography variant="h6" gutterBottom fontWeight={600} color="success.main">
                  ✓ Enregistrement terminé
                </Typography>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {formatTime(recordingTime)}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
                  <IconButton
                    size="large"
                    sx={{
                      border: "2px solid",
                      borderColor: "primary.main",
                      color: "primary.main",
                    }}
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton
                    size="large"
                    onClick={handleDeleteRecording}
                    sx={{
                      border: "2px solid",
                      borderColor: "error.main",
                      color: "error.main",
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>

          {/* Form Fields */}
          {(recordingState === "recorded" || recordingState === "uploading") && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Titre de la récitation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sourate Al-Fatiha"
                sx={{ mb: 3 }}
                disabled={recordingState === "uploading"}
              />

              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <FormControl fullWidth disabled={recordingState === "uploading"}>
                  <InputLabel>Sourate</InputLabel>
                  <Select
                    value={selectedSurah}
                    label="Sourate"
                    onChange={(e) => setSelectedSurah(e.target.value)}
                  >
                    {surahs.map((surah) => (
                      <MenuItem key={surah.number} value={surah.number.toString()}>
                        {surah.number}. {surah.name} - {surah.transliteration}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Versets"
                  value={ayatRange}
                  onChange={(e) => setAyatRange(e.target.value)}
                  placeholder="Ex: 1-7"
                  sx={{ minWidth: 150 }}
                  disabled={recordingState === "uploading"}
                />
              </Box>

              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Ajoutez une description pour cette récitation..."
                sx={{ mb: 3 }}
                disabled={recordingState === "uploading"}
              />

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: withBasmala
                    ? "rgba(212, 175, 55, 0.1)"
                    : "rgba(0, 0, 0, 0.03)",
                  border: "1px solid",
                  borderColor: withBasmala ? "secondary.main" : "divider",
                  mb: 3,
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
                        Inclure la Basmala
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
                      Publication en cours...
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
                      background: "rgba(4, 120, 87, 0.1)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        background: "linear-gradient(90deg, #047857 0%, #D4AF37 100%)",
                      },
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
                  !title || !selectedSurah || !ayatRange || recordingState === "uploading"
                }
                sx={{
                  borderRadius: 2,
                  py: 2,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                  boxShadow: "0 8px 24px rgba(212, 175, 55, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(0, 0, 0, 0.12)",
                  },
                }}
              >
                Publier la récitation
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}