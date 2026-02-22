import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  LinearProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import {
  TrendingUp,
  Visibility,
  Download,
  MoreVert,
  Edit,
  Delete,
  Add,
  Assessment,
  CloudUpload,
  Favorite
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { formatNumber, formatNumericText } from "../utils/formatNumber";
import { getDashboardOverview, getDashboardPerformance, getDashboardStats } from "../api/dashboard";
import { isNetworkError } from "../api/client";
import { deleteAudio, listAudios, updateAudio, type UpdateAudioPayload } from "../api/audios";
import { mapAudioToRecitation } from "../api/mappers";
import { ensureArray } from "../utils/ensureArray";
import type { DashboardOverview, Recitation, DashboardPerformanceItem, SurahReference } from "../domain/types";
import { getSurahReference } from "../api/surahReference";
import { useDataRefresh } from "../state/dataRefresh";
import { getUserRole, isAdminRole } from "../api/storage";

const DashboardCosmos = lazy(() =>
  import("../components/DashboardCosmos").then((mod) => ({ default: mod.DashboardCosmos }))
);

export function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { refreshToken, triggerRefresh } = useDataRefresh();
  const isAdmin = useMemo(() => isAdminRole(getUserRole()), []);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [performance, setPerformance] = useState<DashboardPerformanceItem[]>([]);
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStats, setReportStats] = useState<{ day: string; listens: number; downloads: number; shares: number; likes?: number }[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSurahNumber, setEditSurahNumber] = useState<number | "">("");
  const [editSaving, setEditSaving] = useState(false);
  const [surahReference, setSurahReference] = useState<SurahReference[]>([]);
  const [surahLoading, setSurahLoading] = useState(true);
  const [cosmosBoost, setCosmosBoost] = useState(0);
  const [isSpectacular, setIsSpectacular] = useState(true);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, recitation: Recitation) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecitation(recitation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecitation(null);
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    let active = true;
    let intervalId: number | null = null;
    const loadDashboard = async () => {
      try {
        const [overviewData, performanceData, all] = await Promise.all([
          getDashboardOverview(),
          getDashboardPerformance(),
          listAudios({ includeProcessing: true })
        ]);
        if (!active) return;
        setOverview(overviewData);
        const performanceItems = ensureArray(performanceData);
        const allItems = ensureArray(all);
        setPerformance(performanceItems.slice(0, 3));
        setRecitations(allItems.map(mapAudioToRecitation));
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        return;
      }
    };
    loadDashboard();
    intervalId = window.setInterval(loadDashboard, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [i18n.language, refreshToken, isAdmin, navigate]);

  useEffect(() => {
    let active = true;
    const loadSurahs = async () => {
      try {
        const data = await getSurahReference();
        if (!active) return;
        const sorted = [...data]
          .filter((surah) => Number.isFinite(surah.number))
          .sort((a, b) => a.number - b.number);
        setSurahReference(sorted);
      } catch (err) {
        if (!active) return;
        if (!isNetworkError(err)) {
          setToast({ message: err instanceof Error ? err.message : "Référentiel indisponible", severity: "error" });
        }
      } finally {
        if (active) setSurahLoading(false);
      }
    };
    loadSurahs();
    return () => {
      active = false;
    };
  }, [i18n.language]);

  const totalRecitations = overview?.totalRecitations ?? recitations.length;
  const totalListens = overview?.totalListens ?? 0;
  const totalDownloads = overview?.totalDownloads ?? 0;
  const totalLikes = overview?.totalLikes ?? 0;
  const averageListens = overview?.averageListensPerRecitation ?? 0;

  const handleOpenReport = async () => {
    setReportOpen(true);
    if (reportStats.length) return;
    setReportLoading(true);
    try {
      const stats = await getDashboardStats("7d");
      setReportStats(ensureArray(stats));
      setToast({ message: "Rapport chargé avec succès.", severity: "success" });
    } catch (err) {
      if (!isNetworkError(err)) {
        setToast({ message: err instanceof Error ? err.message : "Chargement impossible", severity: "error" });
      }
    } finally {
      setReportLoading(false);
    }
  };

  const openEditDialog = () => {
    if (!selectedRecitation) return;
    setEditTitle(selectedRecitation.title);
    setEditDescription(selectedRecitation.description || "");
    setEditSurahNumber(selectedRecitation.surahNumber || "");
    setEditOpen(true);
    setAnchorEl(null);
  };

  const handleEditSave = async () => {
    if (!selectedRecitation) return;
    setEditSaving(true);
    try {
      const selectedSurah = surahReference.find((surah) => surah.number === editSurahNumber);
      const title =
        selectedSurah
          ? `${selectedSurah.number}. ${selectedSurah.name_fr} (${selectedSurah.name_phonetic})`
          : editTitle;
      const payload: UpdateAudioPayload = {
        title,
        description: editDescription
      };
      if (selectedSurah) {
        payload.numeroSourate = selectedSurah.number;
        payload.sourate = selectedSurah.name_ar;
      }
      const updated = await updateAudio(selectedRecitation.id, payload);
      const mapped = mapAudioToRecitation(updated);
      setRecitations((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setToast({ message: t("dashboard.updated"), severity: "success" });
      triggerRefresh();
      setEditOpen(false);
      handleMenuClose();
    } catch (err) {
      if (!isNetworkError(err)) {
        setToast({ message: err instanceof Error ? err.message : "Mise à jour impossible", severity: "error" });
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecitation) return;
    try {
      await deleteAudio(selectedRecitation.id);
      setRecitations((prev) => prev.filter((item) => item.id !== selectedRecitation.id));
      setToast({ message: t("dashboard.deleted"), severity: "success" });
      triggerRefresh();
      setDeleteOpen(false);
      handleMenuClose();
    } catch (err) {
      if (!isNetworkError(err)) {
        setToast({ message: err instanceof Error ? err.message : "Suppression impossible", severity: "error" });
      }
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "transparent" }}>
      <Navbar isImam={isAdmin} showAdminPortal={false} />

      {/* Hero Section */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, rgba(11,31,42,0.96) 0%, rgba(8,48,60,0.96) 50%, rgba(11,31,42,0.98) 100%)",
          color: "white",
          py: 6,
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Suspense fallback={null}>
          <DashboardCosmos
            listens={totalListens}
            downloads={totalDownloads}
            likes={totalLikes}
            recitations={totalRecitations}
            mode={isSpectacular ? "spectacular" : "calm"}
            themeMode={theme.palette.mode === "light" ? "light" : "dark"}
            boost={cosmosBoost}
          />
        </Suspense>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.35), transparent 45%), radial-gradient(circle at 80% 15%, rgba(4,120,87,0.35), transparent 50%), radial-gradient(circle at 75% 80%, rgba(5,150,105,0.3), transparent 50%)",
            animation: "shimmer 14s ease-in-out infinite",
            opacity: 0.9
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.25,
            animation: "starDrift 20s ease-in-out infinite"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.35), transparent 60%)",
            top: -110,
            right: -80,
            animation: "floatY 9s ease-in-out infinite"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.2), transparent 60%)",
            bottom: -90,
            left: -60,
            animation: "floatY 11s ease-in-out infinite"
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1761640865509-31fa5c46cba0?w=1200')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              mb: 4,
              animation: "fadeUp 0.6s ease both"
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "rgba(212, 175, 55, 0.25)",
                border: "3px solid rgba(255, 255, 255, 0.2)",
                fontSize: "2rem"
              }}
            >
              إ
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                {t("dashboard.title")}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                {t("dashboard.subtitle")}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate("/record")}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.95), rgba(15, 118, 110, 0.9))",
              color: "#0B1F2A",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              animation: "glowPulse 3s ease-in-out infinite",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(245, 215, 110, 0.98), rgba(15, 118, 110, 1))",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)"
              },
              transition: "all 0.2s"
            }}
          >
            {t("navbar.newRecitation")}
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onMouseEnter={() => setCosmosBoost(1)}
              onMouseLeave={() => setCosmosBoost(0)}
              sx={{
                borderRadius: 3,
                background: "rgba(15, 28, 39, 0.85)",
                color: "text.primary",
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                animation: "fadeUp 0.6s ease both",
                transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.015)",
                  borderColor: "rgba(212,175,55,0.45)",
                  boxShadow: "0 18px 38px rgba(212,175,55,0.2)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <CloudUpload sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {totalRecitations}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t("dashboard.stats.recitations")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onMouseEnter={() => setCosmosBoost(1)}
              onMouseLeave={() => setCosmosBoost(0)}
              sx={{
                borderRadius: 3,
                background: "rgba(15, 28, 39, 0.85)",
                color: "text.primary",
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                animation: "fadeUp 0.7s ease both",
                transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.015)",
                  borderColor: "rgba(212,175,55,0.45)",
                  boxShadow: "0 18px 38px rgba(212,175,55,0.2)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Visibility sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {formatNumber(totalListens, i18n.language)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t("dashboard.stats.listens")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onMouseEnter={() => setCosmosBoost(1)}
              onMouseLeave={() => setCosmosBoost(0)}
              sx={{
                borderRadius: 3,
                background: "rgba(15, 28, 39, 0.85)",
                color: "text.primary",
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                animation: "fadeUp 0.8s ease both",
                transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.015)",
                  borderColor: "rgba(212,175,55,0.45)",
                  boxShadow: "0 18px 38px rgba(212,175,55,0.2)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Download sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {formatNumber(totalDownloads, i18n.language)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t("dashboard.stats.downloads")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onMouseEnter={() => setCosmosBoost(1)}
              onMouseLeave={() => setCosmosBoost(0)}
              sx={{
                borderRadius: 3,
                background: "rgba(15, 28, 39, 0.85)",
                color: "text.primary",
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                animation: "fadeUp 0.9s ease both",
                transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.015)",
                  borderColor: "rgba(212,175,55,0.45)",
                  boxShadow: "0 18px 38px rgba(212,175,55,0.2)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {Math.round((averageListens / 1000) * 100) / 100}K
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t("dashboard.stats.average")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              onMouseEnter={() => setCosmosBoost(1)}
              onMouseLeave={() => setCosmosBoost(0)}
              sx={{
                borderRadius: 3,
                background: "rgba(15, 28, 39, 0.85)",
                color: "text.primary",
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                animation: "fadeUp 1s ease both",
                transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.015)",
                  borderColor: "rgba(212,175,55,0.45)",
                  boxShadow: "0 18px 38px rgba(212,175,55,0.2)"
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Favorite sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {formatNumber(totalLikes, i18n.language)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t("dashboard.stats.likes")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 4,
            background: "rgba(15, 28, 39, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)"
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                {t("dashboard.activityTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("dashboard.activitySubtitle")}
              </Typography>
            </Box>
            <Button
              startIcon={<Assessment />}
              variant="outlined"
              onClick={handleOpenReport}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                borderWidth: 2,
                borderColor: "rgba(212, 175, 55, 0.5)",
                color: "text.primary",
                "&:hover": {
                  borderWidth: 2
                }
              }}
            >
              {t("dashboard.reportButton")}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {performance.map((recitation) => {
              const engagementRate = Math.round((recitation.engagement_ratio || 0) * 100);

              return (
                <Grid size={{ xs: 12 }} key={recitation.id}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.08)",
                        "&:hover": {
                          background: "rgba(255, 255, 255, 0.04)",
                          borderColor: "rgba(212,175,55,0.35)"
                        },
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={() => setCosmosBoost(0.6)}
                      onMouseLeave={() => setCosmosBoost(0)}
                    >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {recitation.title}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                          <Chip
                            icon={<Visibility />}
                            label={`${formatNumber(recitation.listen_count, i18n.language)} ${t("dashboard.listens")}`}
                            size="small"
                            sx={{ background: "rgba(255,255,255,0.08)", color: "text.primary" }}
                          />
                          <Chip
                            icon={<Download />}
                            label={`${formatNumber(recitation.download_count, i18n.language)} ${t("dashboard.downloads")}`}
                            size="small"
                            sx={{ background: "rgba(255,255,255,0.08)", color: "text.primary" }}
                          />
                        </Box>
                        <Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {t("dashboard.engagement")}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="primary">
                              {engagementRate}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={engagementRate}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              background: "rgba(8, 18, 25, 0.6)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                background:
                                  "linear-gradient(90deg, rgba(15, 118, 110, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)"
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* All Recitations List */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            background: "rgba(15, 28, 39, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)"
          }}
        >
          <Typography variant="h5" fontWeight={800} gutterBottom>
            {t("dashboard.allRecitations")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("dashboard.manageSubtitle")}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            {recitations.map((recitation) => (
              <Grid size={{ xs: 12 }} key={recitation.id}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "rgba(255,255,255,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.04)",
                      borderColor: "rgba(212,175,55,0.35)"
                    },
                    transition: "all 0.2s"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#0B1F2A",
                        fontSize: "1.5rem",
                        fontWeight: 700
                      }}
                    >
                      {formatNumber(recitation.surahNumber, i18n.language)}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {recitation.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recitation.surah} • {t("home.table.verses")}{" "}
                        {formatNumericText(recitation.ayatRange, i18n.language)} • {recitation.duration || "—"}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        {recitation.withBasmala && (
                          <Chip
                            label="Avec Basmala"
                            size="small"
                            sx={{
                              background: "rgba(212, 175, 55, 0.2)",
                              color: "text.primary",
                              border: "1px solid rgba(212, 175, 55, 0.4)"
                            }}
                          />
                        )}
                        {recitation.processingStatus === "processing" && (
                          <Chip
                            label={t("dashboard.processing")}
                            size="small"
                            sx={{
                              background: "rgba(59, 130, 246, 0.2)",
                              color: "rgba(191, 219, 254, 0.95)",
                              border: "1px solid rgba(59, 130, 246, 0.5)"
                            }}
                          />
                        )}
                        {recitation.processingStatus === "failed" && (
                          <Chip
                            label={t("dashboard.processingFailed")}
                            size="small"
                            sx={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "rgba(254, 202, 202, 0.95)",
                              border: "1px solid rgba(239, 68, 68, 0.5)"
                            }}
                          />
                        )}
                        <Chip
                          label={recitation.date}
                          size="small"
                          variant="outlined"
                          sx={{ color: "text.primary", borderColor: "rgba(255,255,255,0.2)" }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {formatNumber(recitation.listens, i18n.language)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("dashboard.listens")}
                      </Typography>
                    </Box>
                  </Box>

                  <IconButton
                    onClick={(e) => handleMenuOpen(e, recitation)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            background: "rgba(15, 28, 39, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)"
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedRecitation) {
              navigate(`/recitation/${selectedRecitation.slug || selectedRecitation.id}`);
            }
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          {t("dashboard.actions.view")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            openEditDialog();
          }}
        >
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          {t("dashboard.actions.edit")}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setDeleteOpen(true);
            setAnchorEl(null);
          }}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          {t("dashboard.actions.delete")}
        </MenuItem>
      </Menu>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: "rgba(15, 28, 39, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)"
          }
        }}
      >
        <DialogTitle>{t("dashboard.actions.edit")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth disabled={surahLoading}>
              <InputLabel sx={{ color: "text.secondary" }}>{t("record.titleSurah")}</InputLabel>
              <Select
                value={editSurahNumber}
                label={t("record.titleSurah")}
                onChange={(e) => setEditSurahNumber(Number(e.target.value))}
                sx={{
                  background: "rgba(8, 18, 25, 0.7)",
                  color: "text.primary",
                  ".MuiSvgIcon-root": { color: "text.secondary" }
                }}
              >
                {surahReference.map((surah) => (
                  <MenuItem key={surah.number} value={surah.number}>
                    {surah.number}. {surah.name_fr} ({surah.name_phonetic})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t("record.description")}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "rgba(8, 18, 25, 0.7)",
                  color: "#F8F6F1"
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            {t("dashboard.actions.cancel")}
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={editSaving || editSurahNumber === ""}
          >
            {editSaving ? "..." : t("dashboard.actions.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: "rgba(15, 28, 39, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)"
          }
        }}
      >
        <DialogTitle>{t("dashboard.actions.deleteConfirm")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t("dashboard.actions.irreversible")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>{t("dashboard.actions.cancel")}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {t("dashboard.actions.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: "rgba(15, 28, 39, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)"
          }
        }}
      >
        <DialogTitle>{t("dashboard.reportTitle")}</DialogTitle>
        <DialogContent dividers>
          {reportLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {reportStats.map((item) => (
                <ListItem key={item.day} divider>
                  <ListItemText
                    primary={item.day}
                    secondary={`${t("home.table.listens")}: ${formatNumber(item.listens, i18n.language)} • ${t("home.table.downloads")}: ${formatNumber(item.downloads, i18n.language)} • ${t("dashboard.shares")}: ${formatNumber(item.shares, i18n.language)} • ${t("dashboard.likes")}: ${formatNumber(item.likes ?? 0, i18n.language)}`}
                  />
                </ListItem>
              ))}
              {!reportStats.length && (
                <ListItem>
                  <ListItemText primary={t("dashboard.noData")} />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>{t("player.close")}</Button>
        </DialogActions>
      </Dialog>

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
