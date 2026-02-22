import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Tooltip,
  Select,
  MenuItem
} from "@mui/material";
import { Menu as MenuIcon, AccountCircle, NightsStay } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getUserRole, isAdminRole } from "../api/storage";

interface NavbarProps {
  showAuth?: boolean;
  isImam?: boolean;
}

export function Navbar({ showAuth = true, isImam = false }: NavbarProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAdmin = isAdminRole(getUserRole());
  const [nightMode, setNightMode] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("appcoran-night") !== "false";
  });
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "fr";
    return localStorage.getItem("appcoran-lang") || "fr";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (nightMode) {
      document.body.classList.add("night-mode");
      localStorage.setItem("appcoran-night", "true");
    } else {
      document.body.classList.remove("night-mode");
      localStorage.setItem("appcoran-night", "false");
    }
  }, [nightMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("appcoran-lang", lang);
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background:
          "linear-gradient(135deg, rgba(11,31,42,0.92) 0%, rgba(15,28,39,0.92) 55%, rgba(12,35,45,0.92) 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)"
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box 
            onClick={() => navigate("/")} 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1.5, 
              cursor: "pointer" 
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#0B1F2A",
                boxShadow: "0 6px 14px rgba(0, 0, 0, 0.3)",
              }}
            >
              ق
            </Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: 0.5,
                color: "rgba(248, 246, 241, 0.95)",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
                display: { xs: "none", sm: "block" }
              }}
            >
              {t("appName")}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Select
            size="small"
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            sx={{
              minWidth: 84,
              background: "rgba(15, 28, 39, 0.6)",
              color: "text.primary",
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.15)"
              },
              "& .MuiSvgIcon-root": { color: "text.secondary" }
            }}
          >
            <MenuItem value="fr">FR</MenuItem>
            <MenuItem value="en">EN</MenuItem>
            <MenuItem value="ar">AR</MenuItem>
          </Select>
          <Tooltip title={t("navbar.nightMode")}>
            <IconButton
              color="inherit"
              onClick={() => setNightMode((prev) => !prev)}
              sx={{
                border: "1px solid rgba(255,255,255,0.2)",
                color: "text.primary",
                background: nightMode ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.04)"
              }}
            >
              <NightsStay />
            </IconButton>
          </Tooltip>
          {showAuth && !isAdmin && (
            <Button
              color="inherit"
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                border: "1px solid rgba(212, 175, 55, 0.4)",
                color: "text.primary",
                "&:hover": {
                  background: "rgba(212, 175, 55, 0.12)",
                },
              }}
            >
              {t("navbar.imamSpace")}
            </Button>
          )}
          
          {isAdmin && (
            <Button
              color="inherit"
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                border: "1px solid rgba(212, 175, 55, 0.4)",
                color: "text.primary",
                "&:hover": {
                  background: "rgba(212, 175, 55, 0.12)",
                },
              }}
            >
              {t("navbar.imamSpace")}
            </Button>
          )}

          {isImam && isAdmin && (
            <>
              <Button
                color="inherit"
                onClick={() => navigate("/record")}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  color: "#0B1F2A",
                  background:
                    "linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(15, 118, 110, 0.9) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(245, 215, 110, 0.98) 0%, rgba(15, 118, 110, 1) 100%)",
                  },
                  display: { xs: "none", md: "flex" }
                }}
              >
                {t("navbar.newRecitation")}
              </Button>
              
              <IconButton
                color="inherit"
                onClick={() => navigate("/profile")}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    bgcolor: "rgba(212, 175, 55, 0.25)",
                    border: "2px solid rgba(255, 255, 255, 0.25)"
                  }}
                  src="https://images.unsplash.com/photo-1756412066387-2b518da6a7d6?w=100"
                >
                  <AccountCircle />
                </Avatar>
              </IconButton>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
