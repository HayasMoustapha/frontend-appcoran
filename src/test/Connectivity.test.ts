import { checkHealth } from "../app/api/health";
import { vi } from "vitest";
import { createMockResponse } from "./test-utils";

describe("Connectivity", () => {
  it("pings backend health endpoint", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(createMockResponse({ body: { status: "ok" } }))
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await checkHealth();
    expect(result.status).toBe("ok");
  });
});
