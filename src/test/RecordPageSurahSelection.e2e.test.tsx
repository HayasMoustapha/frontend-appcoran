import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { RecordPage } from "../app/pages/RecordPage";
import { createMockResponse, renderWithProviders } from "./test-utils";

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
  },
  {
    number: 2,
    name_fr: "La Plume",
    name_phonetic: "Al-Qalam",
    name_ar: "القلم",
    revelation: 2,
    verses: 52,
    words: 304,
    letters: 1277
  }
];

describe("RecordPage surah selection flow", () => {
  it("enables verse selection after choosing a surah and respects verse bounds", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/surah-reference")) {
        return Promise.resolve(createMockResponse({ body: surahReference }));
      }
      if (url.includes("/api/audios")) {
        return Promise.resolve(createMockResponse({ body: { id: "1" } }));
      }
      return Promise.resolve(createMockResponse({ body: {} }));
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <MemoryRouter>
        <RecordPage />
      </MemoryRouter>
    );

    const uploadTrigger = screen.getByText(/Importer un fichier/i);
    const input =
      uploadTrigger.closest("label")?.querySelector('input[type="file"]') ??
      uploadTrigger.parentElement?.querySelector('input[type="file"]');

    expect(input).toBeTruthy();
    const file = new File(["test"], "test.mp3", { type: "audio/mpeg" });
    await userEvent.upload(input as HTMLInputElement, file);

    await screen.findByTestId("title-select");

    const surahSelect = screen.getByTestId("surah-select");
    const verseStartSelect = screen.getByTestId("verse-start-select");
    const verseEndSelect = screen.getByTestId("verse-end-select");

    const verseStartButton = within(verseStartSelect).getByRole("combobox");
    const verseEndButton = within(verseEndSelect).getByRole("combobox");

    expect(verseStartButton).toBeTruthy();
    expect(verseEndButton).toBeTruthy();
    expect(verseStartButton).toHaveAttribute("aria-disabled", "true");
    expect(verseEndButton).toHaveAttribute("aria-disabled", "true");

    const surahButton = within(surahSelect).getByRole("combobox");
    await userEvent.click(surahButton);
    await userEvent.click(await screen.findByRole("option", { name: /L'Ouverture/i }));

    const verseStartButtonEnabled = within(verseStartSelect).getByRole("combobox");
    const verseEndButtonEnabled = within(verseEndSelect).getByRole("combobox");
    expect(verseStartButtonEnabled).not.toHaveAttribute("aria-disabled", "true");
    expect(verseEndButtonEnabled).not.toHaveAttribute("aria-disabled", "true");

    await userEvent.click(verseStartButtonEnabled as HTMLElement);
    await userEvent.click(await screen.findByRole("option", { name: /^5$/ }));

    await userEvent.click(verseEndButtonEnabled as HTMLElement);
    expect(screen.queryByRole("option", { name: /^3$/ })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("option", { name: /^7$/ }));

    expect(within(verseStartSelect).getByRole("combobox")).toHaveTextContent("5");
    expect(within(verseEndSelect).getByRole("combobox")).toHaveTextContent("7");
  });
});
