import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/context", () => ({
  getEnv: vi.fn(),
  setEnv: vi.fn(),
}));

vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

const fetchMock = vi.fn();
global.fetch = fetchMock;

import { captureError } from "../src/utils/monitoring";
import { getEnv } from "../src/context";

describe("FIX 5 — Monitoring foundations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnv).mockImplementation(() => {
      throw new Error("env not initialized");
    });
  });

  describe("captureError (no webhook configured)", () => {
    it("does not crash when getEnv throws", () => {
      expect(() => captureError(new Error("boom"), { where: "test" })).not.toThrow();
    });

    it("does not attempt a fetch when MONITORING_WEBHOOK_URL is absent", () => {
      captureError(new Error("boom"), { where: "test" });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("captureError (with webhook configured)", () => {
    beforeEach(() => {
      vi.mocked(getEnv).mockReturnValue({
        MONITORING_WEBHOOK_URL: "https://example.com/ingest",
      } as unknown as ReturnType<typeof getEnv>);
    });

    it("POSTs a JSON envelope to the configured webhook", () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
      captureError(new Error("provider down"), { where: "tool_call", tool: "search" });
      // Fire-and-forget — give the microtask a tick
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(fetchMock).toHaveBeenCalledTimes(1);
          const [url, opts] = fetchMock.mock.calls[0];
          expect(url).toBe("https://example.com/ingest");
          expect(opts.method).toBe("POST");
          const body = JSON.parse(opts.body);
          expect(body.message).toBe("provider down");
          expect(body.where).toBe("tool_call");
          expect(body.tool).toBe("search");
          expect(body.timestamp).toBeDefined();
          resolve();
        }, 10);
      });
    });

    it("does not throw when the webhook fetch fails", () => {
      fetchMock.mockRejectedValueOnce(new Error("network down"));
      expect(() => captureError(new Error("x"))).not.toThrow();
    });
  });
});
