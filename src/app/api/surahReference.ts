import { get } from "./client";
import type { ApiSurahReference } from "./types";

export function getSurahReference() {
  return get<ApiSurahReference[]>("/api/surah-reference");
}
