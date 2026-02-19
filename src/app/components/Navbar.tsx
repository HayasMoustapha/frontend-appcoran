import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar } from "@mui/material";
import { Menu as MenuIcon, AccountCircle } from "@mui/icons-material";
import { useNavigate } from "react-router";

interface NavbarProps {
  showAuth?: boolean;
  isImam?: boolean;
}

export function Navbar({ showAuth = true, isImam = false }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
                background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "white",
                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
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
                display: { xs: "none", sm: "block" }
              }}
            >
              Récitations Sacrées
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {showAuth && !isImam && (
            <Button
              color="inherit"
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Espace Imam
            </Button>
          )}
          
          {isImam && (
            <>
              <Button
                color="inherit"
                onClick={() => navigate("/record")}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  background: "rgba(212, 175, 55, 0.2)",
                  border: "1px solid rgba(212, 175, 55, 0.5)",
                  "&:hover": {
                    background: "rgba(212, 175, 55, 0.3)",
                  },
                  display: { xs: "none", md: "flex" }
                }}
              >
                + Nouvelle Récitation
              </Button>
              
              <IconButton
                color="inherit"
                onClick={() => navigate("/profile")}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    bgcolor: "rgba(212, 175, 55, 0.3)",
                    border: "2px solid rgba(255, 255, 255, 0.5)"
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