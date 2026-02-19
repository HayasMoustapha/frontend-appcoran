import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { router } from "./routes";
import { checkHealth } from "./api/health";
import { isNetworkError } from "./api/client";

const theme = createTheme({
  palette: {
    primary: {
      main: "#047857",
      light: "#059669",
      dark: "#065f46",
    },
    secondary: {
      main: "#D4AF37",
      light: "#F59E0B",
      dark: "#B8860B",
    },
    background: {
      default: "#F9FAFB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F2937",
      secondary: "#6B7280",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
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
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
