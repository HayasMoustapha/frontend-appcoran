import { useState } from "react";
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
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { mockRecitations } from "../data/mockData";
import { useNavigate } from "react-router";

export function DashboardPage() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecitationId, setSelectedRecitationId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecitationId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecitationId(null);
  };

  const totalListens = mockRecitations.reduce((acc, r) => acc + r.listens, 0);
  const totalDownloads = mockRecitations.reduce((acc, r) => acc + r.downloads, 0);

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
          overflow: "hidden",
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
            opacity: 0.1,
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
                fontSize: "2rem",
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
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
              },
              transition: "all 0.2s",
            }}
          >
            Nouvelle Récitation
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(4, 120, 87, 0.2)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <CloudUpload sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {mockRecitations.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Récitations publiées
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(212, 175, 55, 0.2)",
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

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.2)",
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

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
                color: "white",
                boxShadow: "0 8px 24px rgba(236, 72, 153, 0.2)",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Typography variant="h3" fontWeight={800}>
                  {Math.round((totalListens / mockRecitations.length) / 10) / 100}K
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
            background: "white",
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
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                },
              }}
            >
              Voir rapport complet
            </Button>
          </Box>

          <Grid container spacing={2}>
            {mockRecitations.slice(0, 3).map((recitation) => {
              const engagementRate = Math.round(
                ((recitation.downloads / recitation.listens) * 100) || 0
              );
              
              return (
                <Grid item xs={12} key={recitation.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        background: "rgba(4, 120, 87, 0.02)",
                        borderColor: "primary.main",
                      },
                      transition: "all 0.2s",
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
                            label={`${recitation.listens.toLocaleString()} écoutes`}
                            size="small"
                          />
                          <Chip
                            icon={<Download />}
                            label={`${recitation.downloads.toLocaleString()} téléchargements`}
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
                                background: "linear-gradient(90deg, #047857 0%, #D4AF37 100%)",
                              },
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
            background: "white",
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
            {mockRecitations.map((recitation) => (
              <Grid item xs={12} key={recitation.id}>
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
                      borderColor: "primary.main",
                    },
                    transition: "all 0.2s",
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
                        fontWeight: 700,
                      }}
                    >
                      {recitation.surahNumber}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {recitation.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recitation.surah} • Verset {recitation.ayatRange} • {recitation.duration}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        {recitation.withBasmala && (
                          <Chip label="Avec Basmala" size="small" color="primary" />
                        )}
                        <Chip
                          label={recitation.date}
                          size="small"
                          variant="outlined"
                        />
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
                    onClick={(e) => handleMenuOpen(e, recitation.id)}
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
          },
        }}
      >
        <MenuItem
          onClick={() => {
            navigate(`/recitation/${selectedRecitationId}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1, fontSize: 20 }} />
          Voir
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
}
