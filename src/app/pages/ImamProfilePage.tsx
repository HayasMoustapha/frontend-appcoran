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
import { useNavigate } from "react-router";
import type { ImamProfile } from "../domain/types";
import { createProfile, getProfile, updateProfile } from "../api/profile";
import { isNetworkError } from "../api/client";
import { mapPublicProfile } from "../api/mappers";

export function ImamProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (!active) return;
      if (data) {
        const mapped = mapPublicProfile(data);
        setProfile(mapped);
        setOriginalProfile(mapped);
        setProfileExists(true);
        setError("");
      } else {
        setProfileExists(false);
      }
      } catch (err) {
        if (!active) return;
        if (isNetworkError(err)) return;
        setError(err instanceof Error ? err.message : "Chargement impossible");
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setError("");
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
      setError("");
    } catch (err) {
      if (isNetworkError(err)) return;
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
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
    <Box sx={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Navbar isImam />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "primary.main",
            textTransform: "none"
          }}
        >
          Retour au tableau de bord
        </Button>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
              color: "white",
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
                backgroundImage: `url('https://images.unsplash.com/photo-1769065579937-07dadad748a2?w=1200')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.1
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 3 }}>
                <Typography variant="h4" fontWeight={800}>
                  Profil de l'Imam
                </Typography>

                {!isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    sx={{
                      background: "rgba(212, 175, 55, 0.95)",
                      "&:hover": {
                        background: "rgba(212, 175, 55, 1)"
                      }
                    }}
                  >
                    Modifier
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      sx={{
                        background: "rgba(212, 175, 55, 0.95)",
                        "&:hover": {
                          background: "rgba(212, 175, 55, 1)"
                        }
                      }}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{
                        borderColor: "white",
                        color: "white",
                        "&:hover": {
                          borderColor: "white",
                          background: "rgba(255, 255, 255, 0.1)"
                        }
                      }}
                    >
                      Annuler
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
                          background: "white",
                          color: "primary.main",
                          "&:hover": {
                            background: "rgba(255, 255, 255, 0.9)"
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
                      <Typography variant="h5" sx={{ mb: 1, fontFamily: "Arial" }}>
                        {profile.arabicName || ""}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
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
                            background: "rgba(255, 255, 255, 0.95)"
                          }
                        }}
                        placeholder="Nom"
                      />
                      <TextField
                        value={profile.arabicName}
                        onChange={(e) => setProfile({ ...profile, arabicName: e.target.value })}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(255, 255, 255, 0.95)"
                          }
                        }}
                        placeholder="Nom en arabe"
                      />
                      <TextField
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(255, 255, 255, 0.95)"
                          }
                        }}
                        placeholder="Titre"
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
                    Biographie
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
                  />
                )}
              </Grid>

              {/* Contact Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: "rgba(4, 120, 87, 0.03)",
                    border: "1px solid rgba(4, 120, 87, 0.1)"
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
                    Coordonnées
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
                        placeholder="Email"
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
                        placeholder="Téléphone"
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
                    background: "rgba(212, 175, 55, 0.05)",
                    border: "1px solid rgba(212, 175, 55, 0.2)"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Star color="secondary" />
                      <Typography variant="h6" fontWeight={700} color="secondary">
                        Spécialités
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
                        <Chip key={index} label={specialty} color="secondary" variant="outlined" />
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
                    border: "1px solid",
                    borderColor: "divider"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <School color="primary" />
                      <Typography variant="h6" fontWeight={700} color="primary">
                        Formation
                      </Typography>
                    </Box>
                    {isEditing && (
                      <Button startIcon={<Add />} onClick={addEducation} size="small">
                        Ajouter
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
                                background: "linear-gradient(135deg, #047857 0%, #D4AF37 100%)"
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText primary={edu} />
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
                    border: "1px solid",
                    borderColor: "divider"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Work color="primary" />
                      <Typography variant="h6" fontWeight={700} color="primary">
                        Parcours Professionnel
                      </Typography>
                    </Box>
                    {isEditing && (
                      <Button startIcon={<Add />} onClick={addExperience} size="small">
                        Ajouter
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
                                background: "linear-gradient(135deg, #047857 0%, #D4AF37 100%)"
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText primary={exp} />
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
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
