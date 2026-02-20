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
  Alert,
  Snackbar
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { login } from "../api/auth";
import { isNetworkError } from "../api/client";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("login.errorFill"));
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      setToast({ message: t("login.success"), severity: "success" });
      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      if (isNetworkError(err)) return;
      setError(err instanceof Error ? err.message : t("login.failed"));
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
        background:
          "radial-gradient(circle at top, rgba(15, 38, 52, 0.9) 0%, rgba(11, 31, 42, 1) 55%, rgba(8, 20, 28, 1) 100%)",
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
          backgroundImage:
            "linear-gradient(120deg, rgba(212, 175, 55, 0.08), rgba(15, 118, 110, 0.1))",
          opacity: 0.85
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            background: "rgba(15, 28, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(14px)"
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(212, 175, 55, 0.95))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#0B1F2A",
                mx: "auto",
                mb: 2,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)"
              }}
            >
              ق
            </Box>
            <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
              {t("login.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("login.subtitle")}
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label={t("login.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  background: "rgba(8, 18, 25, 0.6)",
                  color: "text.primary"
                }
              }}
            />

            <TextField
              fullWidth
              label={t("login.password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  background: "rgba(8, 18, 25, 0.6)",
                  color: "text.primary"
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: "text.secondary" }}>
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
                color: "#0B1F2A",
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
                "&:hover": {
                  background: "linear-gradient(135deg, rgba(245, 215, 110, 0.98) 0%, rgba(15, 118, 110, 1) 100%)",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.4)"
                }
              }}
            >
              {t("login.login")}
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
              {t("login.backHome")}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(212, 175, 55, 0.08) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              ℹ️ {t("login.secureAccess")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("login.secureHint")}
            </Typography>
          </Box>
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
        autoHideDuration={3000}
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
