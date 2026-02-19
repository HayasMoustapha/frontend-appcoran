import { get } from "./client";
import type { DashboardOverview, DashboardPerformanceItem, DashboardPeriodStat } from "../domain/types";

export async function getDashboardOverview() {
  return get<DashboardOverview>("/api/dashboard/overview", { auth: true });
}

export async function getDashboardPerformance() {
  return get<DashboardPerformanceItem[]>("/api/dashboard/performance", { auth: true });
}

export async function getDashboardStats(period: "7d" | "30d" | "1y") {
  return get<DashboardPeriodStat[]>(`/api/dashboard/stats?period=${period}`, { auth: true });
}
