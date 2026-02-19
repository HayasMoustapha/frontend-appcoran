import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import { Search, TrendingUp, AccessTime, Star } from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { RecitationCard } from "../components/RecitationCard";
import { getPopular, getRecent, listAudios } from "../api/audios";
import { isNetworkError } from "../api/client";
import { getPublicProfile } from "../api/profile";
import { mapAudioToRecitation, mapPublicProfile } from "../api/mappers";
import type { ImamProfile, Recitation, SurahReference } from "../domain/types";
import { useNavigate } from "react-router";
import { getSurahReference } from "../api/surahReference";

export function HomePage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [allRecitations, setAllRecitations] = useState<Recitation[]>([]);
  const [recentRecitations, setRecentRecitations] = useState<Recitation[]>([]);
  const [popularRecitations, setPopularRecitations] = useState<Recitation[]>([]);
  const [searchResults, setSearchResults] = useState<Recitation[]>([]);
  const [surahReference, setSurahReference] = useState<SurahReference[]>([]);
  const [imamProfile, setImamProfile] = useState<ImamProfile>({
    name: "",
    arabicName: "",
    title: "",
    bio: "",
    education: [],
    experience: [],
    specialties: [],
    email: "",
    phone: "",
    avatar: ""
  });
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [profileResult, allResult, recentResult, popularResult, surahResult] = await Promise.allSettled([
          getPublicProfile(),
          listAudios(),
          getRecent(6),
          getPopular(6),
          getSurahReference()
        ]);
        if (!active) return;

        if (profileResult.status === "fulfilled") {
          setImamProfile(mapPublicProfile(profileResult.value));
        } else if (
          profileResult.reason &&
          !isNetworkError(profileResult.reason) &&
          profileResult.reason instanceof Error &&
          profileResult.reason.message !== "Profile not found"
        ) {
          setToast({ message: profileResult.reason.message, severity: "error" });
        }

        if (allResult.status === "fulfilled") {
          const mappedAll = allResult.value.map(mapAudioToRecitation);
          setAllRecitations(mappedAll);
          setSearchResults(mappedAll);
        } else if (!isNetworkError(allResult.reason)) {
          const message =
            allResult.reason instanceof Error ? allResult.reason.message : "Erreur lors du chargement";
          setToast({ message, severity: "error" });
        }

        if (recentResult.status === "fulfilled") {
          setRecentRecitations(recentResult.value.map(mapAudioToRecitation));
        } else if (!isNetworkError(recentResult.reason)) {
          const message =
            recentResult.reason instanceof Error ? recentResult.reason.message : "Erreur lors du chargement";
          setToast({ message, severity: "error" });
        }

        if (popularResult.status === "fulfilled") {
          setPopularRecitations(popularResult.value.map(mapAudioToRecitation));
        } else if (!isNetworkError(popularResult.reason)) {
          const message =
            popularResult.reason instanceof Error ? popularResult.reason.message : "Erreur lors du chargement";
          setToast({ message, severity: "error" });
        }

        if (surahResult.status === "fulfilled") {
          const sorted = [...surahResult.value].sort((a, b) => a.number - b.number);
          setSurahReference(sorted);
        }
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        const message = err instanceof Error ? err.message : "Erreur lors du chargement";
        if (message === "Profile not found") {
          return;
        }
        return;
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(allRecitations);
      return;
    }

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[’']/g, "")
        .replace(/\\s+/g, " ")
        .trim();

    const normalizedQuery = normalize(query);
    const numberMatch = normalizedQuery.match(/\\b(\\d{1,3})\\b/);
    const numberCandidate = numberMatch ? Number(numberMatch[1]) : undefined;

    const surahMatch = surahReference.find((surah) => {
      const names = [surah.name_fr, surah.name_phonetic, surah.name_ar];
      return names.some((name) => name && normalize(name).includes(normalizedQuery));
    });
    const matchedNumber =
      surahMatch?.number ??
      (numberCandidate && numberCandidate >= 1 && numberCandidate <= 114 ? numberCandidate : undefined);

    const matches = allRecitations.filter((recitation) => {
      if (matchedNumber && recitation.surahNumber === matchedNumber) return true;
      const haystack = normalize(
        `${recitation.title} ${recitation.surah} ${recitation.description ?? ""}`
      );
      return haystack.includes(normalizedQuery);
    });

    setSearchResults(matches);
  }, [searchQuery, allRecitations, surahReference]);

  const displayedRecitations =
    selectedTab === 0
      ? searchResults
      : selectedTab === 1
      ? recentRecitations
      : popularRecitations;

  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Navbar />

      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
          color: "white",
          py: { xs: 6, md: 10 },
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
            backgroundImage: `url('https://images.unsplash.com/photo-1769065579937-07dadad748a2?w=1200')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
                textShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              Écoutez la Parole Divine
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.95,
                maxWidth: 600,
                mx: "auto",
                mb: 4,
                lineHeight: 1.7,
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              Plongez dans l'océan des récitations sacrées de notre imam, où chaque
              verset résonne comme une mélodie céleste
            </Typography>

            <TextField
              fullWidth
              placeholder="Rechercher une sourate, un titre, ou un verset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                maxWidth: 600,
                mx: "auto",
                "& .MuiOutlinedInput-root": {
                  background: "white",
                  borderRadius: 3,
                  fontSize: "1.1rem",
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(212, 175, 55, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#D4AF37",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary", fontSize: 28 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Quick Stats */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>
                {allRecitations.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Récitations
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>
                {allRecitations.reduce((acc, r) => acc + r.listens, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Écoutes
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>
                {allRecitations.reduce((acc, r) => acc + r.downloads, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Téléchargements
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Content Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Imam Profile Section */}
        <Box
          sx={{
            mb: 6,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: "white",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 200,
              height: 200,
              background: "linear-gradient(135deg, rgba(4, 120, 87, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)",
              borderRadius: "50%",
              transform: "translate(50%, -50%)",
            }}
          />
          
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
              alignItems: { xs: "center", md: "flex-start" },
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Photo de l'imam */}
            <Box
              sx={{
                position: "relative",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: { xs: 150, md: 200 },
                  height: { xs: 150, md: 200 },
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "5px solid",
                  borderColor: "primary.main",
                  boxShadow: "0 12px 40px rgba(4, 120, 87, 0.3)",
                  background: `url('https://images.unsplash.com/photo-1756412066387-2b518da6a7d6?w=400') center/cover`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: { xs: -10, md: -15 },
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                  color: "white",
                  px: { xs: 2, md: 3 },
                  py: 1,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: { xs: "0.875rem", md: "1rem" },
                  boxShadow: "0 6px 20px rgba(212, 175, 55, 0.5)",
                  whiteSpace: "nowrap",
                }}
              >
                🕌 Imam
              </Box>
            </Box>

            {/* Informations de l'imam */}
            <Box
              sx={{
                flexGrow: 1,
                textAlign: { xs: "center", md: "left" },
                mt: { xs: 3, md: 0 },
              }}
            >
              <Typography
                variant="h3"
                fontWeight={800}
                gutterBottom
                color="primary"
                sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}
              >
                {imamProfile.name}
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  mb: 2,
                  fontFamily: "Arial, sans-serif",
                  color: "secondary.main",
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {imamProfile.arabicName}
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  fontSize: { xs: "1rem", md: "1.25rem" },
                }}
              >
                {imamProfile.title}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  lineHeight: 1.8,
                  mb: 3,
                  maxWidth: 800,
                  mx: { xs: "auto", md: 0 },
                }}
              >
                {imamProfile.bio}
              </Typography>

              {/* Specialties */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: { xs: "center", md: "flex-start" }, mb: 3 }}>
                {imamProfile.specialties.map((specialty, index) => (
                  <Chip
                    key={index}
                    label={specialty}
                    sx={{
                      background: "linear-gradient(135deg, rgba(4, 120, 87, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)",
                      border: "1px solid",
                      borderColor: "primary.main",
                      color: "primary.main",
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>

              {/* Formation et Parcours en colonnes */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: "rgba(4, 120, 87, 0.03)",
                      border: "1px solid rgba(4, 120, 87, 0.1)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      📚 Formation
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {imamProfile.education.slice(0, 2).map((edu, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1, lineHeight: 1.6 }}
                        >
                          {edu}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: "rgba(212, 175, 55, 0.05)",
                      border: "1px solid rgba(212, 175, 55, 0.2)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="secondary"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      💼 Parcours
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {imamProfile.experience.slice(0, 2).map((exp, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1, lineHeight: 1.6 }}
                        >
                          {exp}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>

        {/* Tabs + Affichage */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap"
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: 2,
                background: "linear-gradient(90deg, #047857 0%, #D4AF37 100%)",
              },
            }}
          >
            <Tab
              icon={<Star />}
              iconPosition="start"
              label="Toutes les récitations"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                minHeight: 56,
              }}
            />
            <Tab
              icon={<AccessTime />}
              iconPosition="start"
              label="Récentes"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                minHeight: 56,
              }}
            />
            <Tab
              icon={<TrendingUp />}
              iconPosition="start"
              label="Populaires"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                minHeight: 56,
              }}
            />
          </Tabs>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => {
              if (value) setViewMode(value);
            }}
            size="small"
            sx={{
              background: "white",
              borderRadius: 3,
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
              "& .MuiToggleButton-root": {
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                border: "none"
              }
            }}
          >
            <ToggleButton value="cards">Cartes</ToggleButton>
            <ToggleButton value="list">Liste</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {displayedRecitations.length > 0 ? (
          viewMode === "cards" ? (
            <Grid container spacing={3}>
              {displayedRecitations.map((recitation, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recitation.id}>
                  <RecitationCard
                    recitation={recitation}
                    featured={index === 0 && selectedTab === 2}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer
              component={Paper}
              elevation={2}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(15, 118, 110, 0.1)"
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(4,120,87,0.08) 0%, rgba(5,150,105,0.08) 100%)"
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>Récitation</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Sourate</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Versets</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Écoutes</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Téléchargements</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRecitations.map((recitation) => (
                    <TableRow key={recitation.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{recitation.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {recitation.description || "Récitation sacrée"}
                        </Typography>
                      </TableCell>
                      <TableCell>{recitation.surah}</TableCell>
                      <TableCell>{recitation.ayatRange}</TableCell>
                      <TableCell>{recitation.date}</TableCell>
                      <TableCell>{recitation.listens.toLocaleString()}</TableCell>
                      <TableCell>{recitation.downloads.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            navigate(`/recitation/${recitation.slug || recitation.id}`)
                          }
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #047857 0%, #059669 100%)"
                          }}
                        >
                          Écouter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              px: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune récitation trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essayez d'autres termes de recherche
            </Typography>
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
          color: "white",
          py: 4,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Récitations Sacrées
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              Que la paix et les bénédictions d'Allah soient sur vous
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              © 2026 Récitations Sacrées. Tous droits réservés.
            </Typography>
          </Box>
        </Container>
      </Box>

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
