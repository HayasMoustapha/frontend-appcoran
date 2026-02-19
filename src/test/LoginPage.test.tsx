import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { LoginPage } from "../app/pages/LoginPage";
import { vi } from "vitest";

const createJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => data
  });

describe("LoginPage", () => {
  it("submits credentials to backend", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/auth/login")) {
        return createJsonResponse({ token: "test-token" });
      }
      return createJsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/Email/i), "imam@test.com");
    await userEvent.type(screen.getByLabelText(/Mot de passe/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(fetchMock).toHaveBeenCalled();
  });
});
