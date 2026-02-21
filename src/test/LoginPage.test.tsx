import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { LoginPage } from "../app/pages/LoginPage";
import { vi } from "vitest";
import { createMockResponse, renderWithProviders } from "./test-utils";

describe("LoginPage", () => {
  it("submits credentials to backend", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/auth/login")) {
        return Promise.resolve(createMockResponse({ body: { token: "test-token" } }));
      }
      return Promise.resolve(createMockResponse({ body: {} }));
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), "imam@test.com");
    await userEvent.type(screen.getByLabelText(/password|mot de passe/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /login|se connecter/i }));

    expect(fetchMock).toHaveBeenCalled();
  });
});
