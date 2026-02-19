import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { vi } from "vitest";
import { RecitationPlayer } from "../app/pages/RecitationPlayer";

const createJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => data
  });

describe("RecitationPlayer", () => {
  it("loads stream url and triggers share endpoint", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/audios")) {
        return createJsonResponse([
          {
            id: "1",
            title: "Test",
            sourate: "الفاتحة",
            numero_sourate: 1,
            verset_start: 1,
            verset_end: 7,
            description: "desc",
            file_path: "uploads/test.mp3",
            basmala_added: true,
            created_at: "2026-02-10T10:00:00.000Z",
            listen_count: 2,
            download_count: 1,
            slug: "1-test"
          }
        ]);
      }
      if (url.includes("/public/audios/1-test/share")) {
        return createJsonResponse({ share_url: "http://localhost:5173/recitation/1-test" });
      }
      if (url.includes("/public/audios/1-test")) {
        return createJsonResponse({
          title: "Test",
          sourate: "الفاتحة",
          numero_sourate: 1,
          verset_start: 1,
          verset_end: 7,
          description: "desc",
          slug: "1-test",
          view_count: 0,
          listen_count: 0,
          download_count: 0,
          created_at: "2026-02-10T10:00:00.000Z",
          stream_url: "http://localhost:4000/public/audios/1-test/stream",
          download_url: "http://localhost:4000/public/audios/1-test/download",
          share_url: "http://localhost:5173/recitation/1-test"
        });
      }
      return createJsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <MemoryRouter initialEntries={["/recitation/1-test"]}>
        <Routes>
          <Route path="/recitation/:id" element={<RecitationPlayer />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Test")).toBeInTheDocument();

    const shareButton = screen.getByRole("button", { name: /Partager/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
