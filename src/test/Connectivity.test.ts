import { checkHealth } from "../app/api/health";
import { vi } from "vitest";

describe("Connectivity", () => {
  it("pings backend health endpoint", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ status: "ok" })
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await checkHealth();
    expect(result.status).toBe("ok");
  });
});
