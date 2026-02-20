import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RecitationPlayer } from "./pages/RecitationPlayer";
import { RecordPage } from "./pages/RecordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ImamProfilePage } from "./pages/ImamProfilePage";
import { AppShell } from "./components/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "recitation/:id",
        Component: RecitationPlayer,
      },
      {
        path: "record",
        Component: RecordPage,
      },
      {
        path: "dashboard",
        Component: DashboardPage,
      },
      {
        path: "profile",
        Component: ImamProfilePage,
      },
    ],
  },
]);
