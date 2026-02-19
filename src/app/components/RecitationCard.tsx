import { Card, CardContent, CardMedia, Typography, Box, IconButton, Chip } from "@mui/material";
import { PlayArrow, Download, Visibility } from "@mui/icons-material";
import type { Recitation } from "../domain/types";
import { useNavigate } from "react-router";

interface RecitationCardProps {
  recitation: Recitation;
  featured?: boolean;
}

export function RecitationCard({ recitation, featured = false }: RecitationCardProps) {
  const navigate = useNavigate();

  const targetId = recitation.slug || recitation.id;

  return (
    <Card
      onClick={() => navigate(`/recitation/${targetId}`)}
      sx={{
        height: "100%",
        width: "300px",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        borderRadius: 3,
        overflow: "hidden",
        transition: "all 0.3s ease",
        position: "relative",
        minHeight: 420, // Hauteur minimum fixe
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 20px 40px rgba(4, 120, 87, 0.15)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #047857 0%, #D4AF37 100%)",
          opacity: 0,
          transition: "opacity 0.3s ease",
        },
        "&:hover::before": {
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          paddingTop: "50%", // Ratio fixe pour toutes les cartes
          background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `url('https://images.unsplash.com/photo-1769065579937-07dadad748a2?w=400') center/cover`,
            opacity: 0.15,
          }}
        />
        
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography
            variant={featured ? "h3" : "h4"}
            sx={{
              color: "white",
              fontWeight: 700,
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              fontFamily: "Arial, sans-serif",
              mb: 1,
            }}
          >
            {recitation.surah}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              fontWeight: 600,
            }}
          >
            Sourate {recitation.surahNumber} • Verset {recitation.ayatRange}
          </Typography>
        </Box>

        <IconButton
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(212, 175, 55, 0.95)",
            color: "white",
            width: 56,
            height: 56,
            opacity: 0,
            transition: "opacity 0.3s ease",
            "&:hover": {
              background: "rgba(212, 175, 55, 1)",
              transform: "translate(-50%, -50%) scale(1.1)",
            },
            ".MuiCard-root:hover &": {
              opacity: 1,
            },
          }}
        >
          <PlayArrow sx={{ fontSize: 32 }} />
        </IconButton>

        {recitation.withBasmala && (
          <Chip
            label="Avec Basmala"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(212, 175, 55, 0.95)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "text.primary",
            mb: 1,
          }}
        >
          {recitation.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {recitation.description}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Visibility sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {recitation.listens.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Download sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {recitation.downloads.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {recitation.duration || "—"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
