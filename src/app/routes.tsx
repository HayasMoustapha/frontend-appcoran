import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { AppShell } from "./components/AppShell";

const RecitationPlayer = lazy(() =>
  import("./pages/RecitationPlayer").then((mod) => ({ default: mod.RecitationPlayer }))
);
const RecordPage = lazy(() =>
  import("./pages/RecordPage").then((mod) => ({ default: mod.RecordPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((mod) => ({ default: mod.DashboardPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((mod) => ({ default: mod.LoginPage }))
);
const ImamProfilePage = lazy(() =>
  import("./pages/ImamProfilePage").then((mod) => ({ default: mod.ImamProfilePage }))
);

const withSuspense = (Component: ComponentType) => () => (
  <Suspense fallback={null}>
    <Component />
  </Suspense>
);

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
        Component: withSuspense(LoginPage),
      },
      {
        path: "recitation/:id",
        Component: withSuspense(RecitationPlayer),
      },
      {
        path: "record",
        Component: withSuspense(RecordPage),
      },
      {
        path: "dashboard",
        Component: withSuspense(DashboardPage),
      },
      {
        path: "profile",
        Component: withSuspense(ImamProfilePage),
      },
    ],
  },
]);
