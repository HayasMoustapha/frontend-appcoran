import { useEffect, useState } from "react";
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
  TextField
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
  CloudUpload
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router";
import { getDashboardOverview, getDashboardPerformance, getDashboardStats } from "../api/dashboard";
import { isNetworkError } from "../api/client";
import { deleteAudio, listAudios, updateAudio } from "../api/audios";
import { mapAudioToRecitation } from "../api/mappers";
import type { DashboardOverview, Recitation, DashboardPerformanceItem } from "../domain/types";

export function DashboardPage() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [performance, setPerformance] = useState<DashboardPerformanceItem[]>([]);
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStats, setReportStats] = useState<{ day: string; listens: number; downloads: number; shares: number }[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, recitation: Recitation) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecitation(recitation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecitation(null);
  };

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        const [overviewData, performanceData, all] = await Promise.all([
          getDashboardOverview(),
          getDashboardPerformance(),
          listAudios()
        ]);
        if (!active) return;
        setOverview(overviewData);
        setPerformance(performanceData.slice(0, 3));
        setRecitations(all.map(mapAudioToRecitation));
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        return;
      }
    };
    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const totalRecitations = overview?.totalRecitations ?? recitations.length;
  const totalListens = overview?.totalListens ?? 0;
  const totalDownloads = overview?.totalDownloads ?? 0;
  const averageListens = overview?.averageListensPerRecitation ?? 0;

  const handleOpenReport = async () => {
    setReportOpen(true);
    if (reportStats.length) return;
    setReportLoading(true);
    try {
      const stats = await getDashboardStats("7d");
      setReportStats(stats);
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
    setEditOpen(true);
    setAnchorEl(null);
  };

  const handleEditSave = async () => {
    if (!selectedRecitation) return;
    setEditSaving(true);
    try {
      const updated = await updateAudio(selectedRecitation.id, {
        title: editTitle,
        description: editDescription
      });
      const mapped = mapAudioToRecitation(updated);
      setRecitations((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setToast({ message: "Récitation mise à jour.", severity: "success" });
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
      setToast({ message: "Récitation supprimée.", severity: "success" });
      setDeleteOpen(false);
      handleMenuClose();
    } catch (err) {
      if (!isNetworkError(err)) {
        setToast({ message: err instanceof Error ? err.message : "Suppression impossible", severity: "error" });
      }
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Navbar isImam />

      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
          color: "white",
          py: 6,
          position: "relative",
          overflow: "hidden"
        }}
      >
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "rgba(212, 175, 55, 0.3)",
                border: "3px solid white",
                fontSize: "2rem"
              }}
            >
              إ
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Tableau de bord de l'Imam
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                Gérez vos récitations et suivez vos statistiques
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
              background: "rgba(212, 175, 55, 0.95)",
              color: "white",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              "&:hover": {
                background: "rgba(212, 175, 55, 1)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)"
              },
              transition: "all 0.2s"
            }}
          >
            Nouvelle Récitation
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(4, 120, 87, 0.2)"
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
                  Récitations publiées
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(212, 175, 55, 0.2)"
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Visibility sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {totalListens.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total d'écoutes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.2)"
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Download sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {totalDownloads.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total de téléchargements
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(236, 72, 153, 0.2)"
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
                  Moyenne par récitation
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
            background: "white"
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                Activité récente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Performances de vos récitations cette semaine
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
                "&:hover": {
                  borderWidth: 2
                }
              }}
            >
              Voir rapport complet
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
                      borderColor: "divider",
                      "&:hover": {
                        background: "rgba(4, 120, 87, 0.02)",
                        borderColor: "primary.main"
                      },
                      transition: "all 0.2s"
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {recitation.title}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                          <Chip
                            icon={<Visibility />}
                            label={`${recitation.listen_count.toLocaleString()} écoutes`}
                            size="small"
                          />
                          <Chip
                            icon={<Download />}
                            label={`${recitation.download_count.toLocaleString()} téléchargements`}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Taux d'engagement
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
                              background: "rgba(4, 120, 87, 0.1)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                background: "linear-gradient(90deg, #047857 0%, #D4AF37 100%)"
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
            background: "white"
          }}
        >
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Toutes vos récitations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Gérez et modifiez vos publications
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
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    "&:hover": {
                      background: "rgba(4, 120, 87, 0.02)",
                      borderColor: "primary.main"
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
                        background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "1.5rem",
                        fontWeight: 700
                      }}
                    >
                      {recitation.surahNumber}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {recitation.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recitation.surah} • Verset {recitation.ayatRange} • {recitation.duration || "—"}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        {recitation.withBasmala && (
                          <Chip label="Avec Basmala" size="small" color="primary" />
                        )}
                        <Chip label={recitation.date} size="small" variant="outlined" />
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {recitation.listens.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        écoutes
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
            minWidth: 180
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
          Voir
        </MenuItem>
        <MenuItem
          onClick={() => {
            openEditDialog();
          }}
        >
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Modifier
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
          Supprimer
        </MenuItem>
      </Menu>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Modifier la récitation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Titre"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            Annuler
          </Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editSaving || !editTitle.trim()}>
            {editSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Supprimer la récitation ?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Rapport complet (7 derniers jours)</DialogTitle>
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
                    secondary={`Écoutes: ${item.listens} • Téléchargements: ${item.downloads} • Partages: ${item.shares}`}
                  />
                </ListItem>
              ))}
              {!reportStats.length && (
                <ListItem>
                  <ListItemText primary="Aucune donnée disponible." />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Fermer</Button>
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
