import { Outlet } from "react-router";
import { MiniPlayer } from "./MiniPlayer";

export function AppShell() {
  return (
    <>
      <Outlet />
      <MiniPlayer />
    </>
  );
}
