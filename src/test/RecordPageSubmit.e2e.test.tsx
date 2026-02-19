import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { RecordPage } from "../app/pages/RecordPage";
import { setAuthToken, clearAuthToken } from "../app/api/storage";

const createJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => data
  });

const surahReference = [
  {
    number: 1,
    name_fr: "L'Ouverture",
    name_phonetic: "Al-Fatihah",
    name_ar: "الفاتحة",
    revelation: 5,
    verses: 7,
    words: 29,
    letters: 139
  }
];

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe("RecordPage submit flow", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    setAuthToken("test-token");
  });

  afterEach(() => {
    clearAuthToken();
    vi.restoreAllMocks();
  });

  it(
    "submits a complete recitation payload",
    async () => {
      const user = userEvent.setup();

    const fetchMock = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/surah-reference")) {
        return createJsonResponse(surahReference);
      }
      if (url.includes("/api/audios")) {
        expect(init?.method).toBe("POST");
        const headers = init?.headers as Record<string, string> | undefined;
        expect(headers?.Authorization).toBe("Bearer test-token");
        expect(init?.body).toBeInstanceOf(FormData);
        return createJsonResponse({ id: "1" });
      }
      return createJsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <RecordPage />
      </MemoryRouter>
    );

    const uploadTrigger = screen.getByText(/Importer un fichier/i);
    const input =
      uploadTrigger.closest("label")?.querySelector('input[type="file"]') ??
      uploadTrigger.parentElement?.querySelector('input[type="file"]');

    const file = new File(["test"], "test.mp3", { type: "audio/mpeg" });
    await user.upload(input as HTMLInputElement, file);

    await user.type(screen.getByLabelText(/Titre de la récitation/i), "Sourate Al-Fatihah");

    const surahSelect = screen.getByTestId("surah-select");
    const surahButton = within(surahSelect).getByRole("combobox");
    await user.click(surahButton);
    await user.click(await screen.findByRole("option", { name: /L'Ouverture/i }));

    const verseStartSelect = screen.getByTestId("verse-start-select");
    const verseEndSelect = screen.getByTestId("verse-end-select");
    await user.click(within(verseStartSelect).getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /^1$/ }));
    await user.click(within(verseEndSelect).getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /^7$/ }));

    await user.type(
      screen.getByLabelText(/Description/i),
      "Description de test pour la récitation."
    );

    const publishButton = screen.getByRole("button", { name: /Publier la récitation/i });
    expect(publishButton).not.toBeDisabled();

      await user.click(publishButton);

      await screen.findByText(/Récitation publiée avec succès/i);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1600));
      });

      expect(fetchMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    },
    10000
  );
});
