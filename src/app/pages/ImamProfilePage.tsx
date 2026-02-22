import { useEffect, useRef, useState } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Edit,
  Save,
  Cancel,
  School,
  Work,
  Star,
  Email,
  Phone,
  ArrowBack,
  PhotoCamera,
  Add,
  Delete
} from "@mui/icons-material";
import { Navbar } from "../components/Navbar";
import { useNavigate, useSearchParams } from "react-router";
import type { ImamProfile } from "../domain/types";
import { createProfile, getProfile, getPublicProfile, updateProfile } from "../api/profile";
import { isNetworkError } from "../api/client";
import { mapPublicProfile } from "../api/mappers";
import { useTranslation } from "react-i18next";
import { useDataRefresh } from "../state/dataRefresh";
import { getUserRole, isAdminRole } from "../api/storage";

export function ImamProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { refreshToken, triggerRefresh } = useDataRefresh();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = isAdminRole(getUserRole());
  const [isEditing, setIsEditing] = useState(false);
  const isReadOnly = !isAdmin || searchParams.get("view") === "public" || searchParams.get("mode") === "read";
  const [profile, setProfile] = useState<ImamProfile>({
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
  const [originalProfile, setOriginalProfile] = useState<ImamProfile | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);

  useEffect(() => {
    let active = true;
    let intervalId: number | null = null;
    const loadProfile = async () => {
      if (isEditing) return;
      try {
        const data = isReadOnly ? await getPublicProfile() : await getProfile();
        if (!active) return;
      if (data) {
        const mapped = mapPublicProfile(data);
        setProfile(mapped);
        setOriginalProfile(mapped);
        setProfileExists(true);
        setToast(null);
      } else {
        setProfileExists(false);
      }
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        return;
      }
    };
    loadProfile();
    intervalId = window.setInterval(loadProfile, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadProfile();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [i18n.language, refreshToken, isEditing, isReadOnly]);

  useEffect(() => {
    if (isReadOnly && isEditing) {
      setIsEditing(false);
    }
  }, [isReadOnly, isEditing]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", profile.name || "");
    formData.append("biography", profile.bio || "");
    formData.append("parcours", profile.experience.join("\n"));
    formData.append("statut", profile.title || "");
    formData.append("arabic_name", profile.arabicName || "");
    formData.append("title", profile.title || "");
    formData.append("education", JSON.stringify(profile.education));
    formData.append("experience", JSON.stringify(profile.experience));
    formData.append("specialties", JSON.stringify(profile.specialties));
    formData.append("email", profile.email || "");
    formData.append("phone", profile.phone || "");

    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      const result = profileExists ? await updateProfile(formData) : await createProfile(formData);
      const mapped = mapPublicProfile(result);
      setProfile(mapped);
      setOriginalProfile(mapped);
      setProfileExists(true);
      setPhotoFile(null);
      setIsEditing(false);
      setToast({ message: "Profil enregistré avec succès.", severity: "success" });
      triggerRefresh();
    } catch (err) {
      if (isNetworkError(err)) return;
      setToast({ message: err instanceof Error ? err.message : t("profile.saveFailed"), severity: "error" });
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }
    setPhotoFile(null);
    setIsEditing(false);
  };

  const addEducation = () => {
    setProfile({
      ...profile,
      education: [...profile.education, ""]
    });
  };

  const removeEducation = (index: number) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index)
    });
  };

  const updateEducation = (index: number, value: string) => {
    const newEducation = [...profile.education];
    newEducation[index] = value;
    setProfile({ ...profile, education: newEducation });
  };

  const addExperience = () => {
    setProfile({
      ...profile,
      experience: [...profile.experience, ""]
    });
  };

  const removeExperience = (index: number) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index)
    });
  };

  const updateExperience = (index: number, value: string) => {
    const newExperience = [...profile.experience];
    newExperience[index] = value;
    setProfile({ ...profile, experience: newExperience });
  };

  const addSpecialty = () => {
    setProfile({
      ...profile,
      specialties: [...profile.specialties, ""]
    });
  };

  const removeSpecialty = (index: number) => {
    setProfile({
      ...profile,
      specialties: profile.specialties.filter((_, i) => i !== index)
    });
  };

  const updateSpecialty = (index: number, value: string) => {
    const newSpecialties = [...profile.specialties];
    newSpecialties[index] = value;
    setProfile({ ...profile, specialties: newSpecialties });
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setProfile({ ...profile, avatar: preview });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#0B1F2A" }}>
      <Navbar isImam={isAdmin && !isReadOnly} showAdminPortal={false} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(isReadOnly ? "/" : "/dashboard")}
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "none"
          }}
        >
          {isReadOnly ? t("profile.backHome", { defaultValue: "Retour à l'accueil" }) : t("profile.back")}
        </Button>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "rgba(15, 28, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)"
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: "linear-gradient(135deg, rgba(15, 118, 110, 0.92) 0%, rgba(212, 175, 55, 0.88) 100%)",
              color: "#0B1F2A",
              p: 4,
              position: "relative"
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage:
                  "linear-gradient(120deg, rgba(11, 31, 42, 0.75), rgba(11, 31, 42, 0.6))",
                opacity: 0.9
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "start" },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 2, sm: 0 },
                  mb: 3
                }}
              >
                <Typography variant="h4" fontWeight={800}>
                  {t("profile.title")}
                </Typography>

                {!isEditing ? (
                  !isReadOnly && (
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => setIsEditing(true)}
                    sx={{
                      background: "rgba(11, 31, 42, 0.9)",
                      color: "#F8F6F1",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      width: { xs: "100%", sm: "auto" },
                      "&:hover": {
                        background: "rgba(11, 31, 42, 1)"
                      }
                    }}
                    >
                    {t("profile.edit")}
                    </Button>
                  )
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                      width: { xs: "100%", sm: "auto" }
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      sx={{
                        background: "rgba(11, 31, 42, 0.9)",
                        color: "#F8F6F1",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        width: { xs: "100%", sm: "auto" },
                        "&:hover": {
                          background: "rgba(11, 31, 42, 1)"
                        }
                      }}
                    >
                    {t("profile.save")}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{
                        borderColor: "rgba(11, 31, 42, 0.8)",
                        color: "rgba(11, 31, 42, 0.9)",
                        width: { xs: "100%", sm: "auto" },
                        "&:hover": {
                          borderColor: "rgba(11, 31, 42, 1)",
                          background: "rgba(255, 255, 255, 0.2)"
                        }
                      }}
                    >
                    {t("profile.cancel")}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      border: "4px solid white",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)"
                    }}
                    src={profile.avatar || "https://images.unsplash.com/photo-1756412066387-2b518da6a7d6?w=400"}
                  />
                  {isEditing && (
                    <>
                      <IconButton
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          background: "rgba(11, 31, 42, 0.9)",
                          color: "#F8F6F1",
                          "&:hover": {
                            background: "rgba(11, 31, 42, 1)"
                          }
                        }}
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <PhotoCamera fontSize="small" />
                      </IconButton>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                      />
                    </>
                  )}
                </Box>

                <Box>
                  {!isEditing ? (
                    <>
                      <Typography variant="h4" fontWeight={800}>
                        {profile.name || ""}
                      </Typography>
                      <Typography variant="h5" sx={{ mb: 1 }}>
                        {profile.arabicName || ""}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.85 }}>
                        {profile.title || ""}
                      </Typography>
                    </>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <TextField
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(8, 18, 25, 0.7)",
                            color: "#F8F6F1"
                          }
                        }}
                        placeholder={t("profile.name")}
                      />
                      <TextField
                        value={profile.arabicName}
                        onChange={(e) => setProfile({ ...profile, arabicName: e.target.value })}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(8, 18, 25, 0.7)",
                            color: "#F8F6F1"
                          }
                        }}
                        placeholder={t("profile.arabicName")}
                      />
                      <TextField
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(8, 18, 25, 0.7)",
                            color: "#F8F6F1"
                          }
                        }}
                        placeholder={t("profile.role")}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Biography */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {t("profile.biography")}
                  </Typography>
                </Box>
                {!isEditing ? (
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {profile.bio}
                  </Typography>
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Biographie de l'imam..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(8, 18, 25, 0.7)",
                        color: "#F8F6F1"
                      }
                    }}
                  />
                )}
              </Grid>

              {/* Contact Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "rgba(15, 28, 39, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)"
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
                    {t("profile.contacts")}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Email color="primary" />
                    {!isEditing ? (
                      <Typography variant="body1">{profile.email}</Typography>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder={t("profile.email")}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(8, 18, 25, 0.7)",
                            color: "#F8F6F1"
                          }
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Phone color="primary" />
                    {!isEditing ? (
                      <Typography variant="body1">{profile.phone}</Typography>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder={t("profile.phone")}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(8, 18, 25, 0.7)",
                            color: "#F8F6F1"
                          }
                        }}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Specialties */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "rgba(15, 28, 39, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Star color="secondary" />
                      <Typography variant="h6" fontWeight={700} color="secondary">
                        {t("profile.specialties")}
                      </Typography>
                    </Box>
                    {isEditing && (
                      <IconButton size="small" color="secondary" onClick={addSpecialty}>
                        <Add />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {!isEditing ? (
                      profile.specialties.map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          variant="outlined"
                          sx={{
                            color: "#F8F6F1",
                            borderColor: "rgba(212, 175, 55, 0.4)",
                            background: "rgba(212, 175, 55, 0.12)"
                          }}
                        />
                      ))
                    ) : (
                      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                        {profile.specialties.map((specialty, index) => (
                          <Box key={index} sx={{ display: "flex", gap: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={specialty}
                              onChange={(e) => updateSpecialty(index, e.target.value)}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  background: "rgba(8, 18, 25, 0.7)",
                                  color: "#F8F6F1"
                                }
                              }}
                            />
                            <IconButton size="small" color="error" onClick={() => removeSpecialty(index)}>
                              <Delete />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Education */}
              <Grid size={{ xs: 12 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "rgba(15, 28, 39, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <School color="primary" />
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {t("profile.education")}
                      </Typography>
                    </Box>
                    {isEditing && (
                      <Button startIcon={<Add />} onClick={addEducation} size="small">
                        {t("profile.add")}
                      </Button>
                    )}
                  </Box>

                  {!isEditing ? (
                    <List>
                      {profile.education.map((edu, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(15, 118, 110, 0.85) 0%, rgba(212, 175, 55, 0.9) 100%)"
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText primary={edu} primaryTypographyProps={{ color: "text.primary" }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {profile.education.map((edu, index) => (
                        <Box key={index} sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            fullWidth
                            value={edu}
                            onChange={(e) => updateEducation(index, e.target.value)}
                            placeholder="Formation..."
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                background: "rgba(8, 18, 25, 0.7)",
                                color: "#F8F6F1"
                              }
                            }}
                          />
                          <IconButton color="error" onClick={() => removeEducation(index)}>
                            <Delete />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Experience */}
              <Grid size={{ xs: 12 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "rgba(15, 28, 39, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Work color="primary" />
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {t("profile.experience")}
                      </Typography>
                    </Box>
                    {isEditing && (
                      <Button startIcon={<Add />} onClick={addExperience} size="small">
                        {t("profile.add")}
                      </Button>
                    )}
                  </Box>

                  {!isEditing ? (
                    <List>
                      {profile.experience.map((exp, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(15, 118, 110, 0.85) 0%, rgba(212, 175, 55, 0.9) 100%)"
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText primary={exp} primaryTypographyProps={{ color: "text.primary" }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {profile.experience.map((exp, index) => (
                        <Box key={index} sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            fullWidth
                            value={exp}
                            onChange={(e) => updateExperience(index, e.target.value)}
                            placeholder="Expérience..."
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                background: "rgba(8, 18, 25, 0.7)",
                                color: "#F8F6F1"
                              }
                            }}
                          />
                          <IconButton color="error" onClick={() => removeExperience(index)}>
                            <Delete />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

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
