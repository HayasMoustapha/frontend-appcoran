import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { HomePage } from "../app/pages/HomePage";
import { vi } from "vitest";
import { createMockResponse, renderWithProviders } from "./test-utils";

const audio = {
  id: "1",
  title: "Sourate Al-Fatiha",
  sourate: "الفاتحة",
  numero_sourate: 1,
  verset_start: 1,
  verset_end: 7,
  description: "Test description",
  file_path: "/uploads/audio.mp3",
  basmala_added: true,
  created_at: "2026-02-10T10:00:00.000Z",
  listen_count: 10,
  download_count: 5,
  slug: "1-al-fatiha"
};

describe("HomePage", () => {
  it("renders recitations and profile from backend", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/public/profile")) {
        return Promise.resolve(
          createMockResponse({
            body: {
              name: "Imam Test",
              biography: "Bio test",
              parcours: "Experience 1\nExperience 2",
              statut: "Imam",
              photo_url: ""
            }
          })
        );
      }
      if (url.includes("/api/audios/recent")) {
        return Promise.resolve(createMockResponse({ body: [audio] }));
      }
      if (url.includes("/api/audios/popular")) {
        return Promise.resolve(createMockResponse({ body: [audio] }));
      }
      if (url.endsWith("/api/audios")) {
        return Promise.resolve(createMockResponse({ body: [audio] }));
      }
      return Promise.resolve(createMockResponse({ body: [] }));
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const titles = await screen.findAllByText("Sourate Al-Fatiha");
    expect(titles.length).toBeGreaterThan(0);
    expect(await screen.findByText("Imam Test")).toBeInTheDocument();
  });
});
