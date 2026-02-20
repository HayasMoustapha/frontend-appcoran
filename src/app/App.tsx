import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { router } from "./routes";
import { checkHealth } from "./api/health";
import { isNetworkError } from "./api/client";
import { VisualLayers } from "./components/VisualLayers";
import { AudioPlayerProvider } from "./components/AudioPlayerProvider";

const theme = createTheme({
  palette: {
    primary: {
      main: "#D4AF37",
      light: "#F5D76E",
      dark: "#B8860B",
    },
    secondary: {
      main: "#0F766E",
      light: "#14B8A6",
      dark: "#0B4F4A",
    },
    background: {
      default: "#0B1F2A",
      paper: "rgba(255,255,255,0.04)",
    },
    text: {
      primary: "#F8F6F1",
      secondary: "rgba(248,246,241,0.7)",
    },
  },
  typography: {
    fontFamily: '"Source Serif 4", "Amiri", "Noto Naskh Arabic", serif',
    h1: {
      fontWeight: 700,
      fontFamily: '"Cormorant Garamond", "Amiri", "Noto Naskh Arabic", serif'
    },
    h2: {
      fontWeight: 700,
      fontFamily: '"Cormorant Garamond", "Amiri", "Noto Naskh Arabic", serif'
    },
    h3: {
      fontWeight: 600,
      fontFamily: '"Cormorant Garamond", "Amiri", "Noto Naskh Arabic", serif'
    },
    h4: {
      fontWeight: 600,
      fontFamily: '"Cormorant Garamond", "Amiri", "Noto Naskh Arabic", serif'
    },
    h5: {
      fontWeight: 600,
      fontFamily: '"Cormorant Garamond", "Amiri", "Noto Naskh Arabic", serif'
    }
  },
  shape: {
    borderRadius: 12,
  },
});

export default function App() {
  useEffect(() => {
    const verifyBackend = async () => {
      try {
        await checkHealth();
      } catch (err) {
        if (isNetworkError(err)) return;
        // Keep silent on UI; health check is only for diagnostics.
      }
    };
    verifyBackend();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AudioPlayerProvider>
        <VisualLayers />
        <RouterProvider router={router} />
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}
