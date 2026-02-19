import { useState } from "react";
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { login } from "../api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background Pattern */}
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

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)"
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "white",
                mx: "auto",
                mb: 2,
                boxShadow: "0 8px 24px rgba(4, 120, 87, 0.3)"
              }}
            >
              ق
            </Box>
            <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
              Espace Imam
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connectez-vous pour gérer vos récitations sacrées
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              disabled={loading}
              sx={{
                borderRadius: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                boxShadow: "0 8px 24px rgba(4, 120, 87, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                  boxShadow: "0 12px 32px rgba(4, 120, 87, 0.4)"
                }
              }}
            >
              Se connecter
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              onClick={() => navigate("/")}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                fontWeight: 600
              }}
            >
              ← Retour à l'accueil
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(4, 120, 87, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)",
              border: "1px solid rgba(4, 120, 87, 0.1)"
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              ℹ️ Accès sécurisé :
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Utilisez vos identifiants administrateur pour accéder au tableau de bord.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
