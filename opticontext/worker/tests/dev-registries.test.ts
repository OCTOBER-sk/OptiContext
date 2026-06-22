import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/storage/kv", () => ({
  kv: { get: vi.fn().mockResolvedValue(null), put: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("../src/utils/safe-fetch", () => ({
  safeFetch: vi.fn(),
  safeJson: vi.fn(),
}));

import { parseMavenMetadataXml } from "../src/search/registries";
import { lookupMaven, lookupNpm, lookupNuget, lookupPypi, lookupCrates, lookupPub } from "../src/search/registries";
import { safeFetch, safeJson } from "../src/utils/safe-fetch";

const mockFetch = vi.mocked(safeFetch);
const mockJson = vi.mocked(safeJson);

beforeEach(() => {
  mockFetch.mockReset();
  mockJson.mockReset();
});

describe("registries — XML parser", () => {
  it("parses a typical maven-metadata.xml", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>androidx.media3</groupId>
  <artifactId>media3-exoplayer</artifactId>
  <versioning>
    <latest>1.4.1</latest>
    <release>1.4.1</release>
    <versions>
      <version>1.0.0</version>
      <version>1.1.0</version>
      <version>1.2.0</version>
      <version>1.3.0</version>
      <version>1.4.0</version>
      <version>1.4.1</version>
    </versions>
  </versioning>
</metadata>`;
    const meta = parseMavenMetadataXml(xml);
    expect(meta?.groupId).toBe("androidx.media3");
    expect(meta?.artifactId).toBe("media3-exoplayer");
    expect(meta?.versioning.latest).toBe("1.4.1");
    expect(meta?.versioning.versions).toHaveLength(6);
  });

  it("returns null for non-metadata XML", () => {
    expect(parseMavenMetadataXml("<html>404 not found</html>")).toBeNull();
  });

  it("uses <release> when <latest> is absent", () => {
    const xml = `<metadata>
  <groupId>g</groupId>
  <artifactId>a</artifactId>
  <versioning><release>2.0.0</release></versioning>
</metadata>`;
    const meta = parseMavenMetadataXml(xml);
    expect(meta?.versioning.latest).toBe("2.0.0");
  });
});

describe("registries — lookupMaven", () => {
  it("returns structured result on success", async () => {
    const xml = `<metadata>
        <groupId>androidx.media3</groupId>
        <artifactId>media3-exoplayer</artifactId>
        <versioning>
          <latest>1.4.1</latest>
          <versions>
            <version>1.4.0</version>
            <version>1.4.1</version>
          </versions>
        </versioning>
      </metadata>`;
    const okResponse = {
      ok: true,
      status: 200,
      text: () => Promise.resolve(xml),
    } as unknown as Response;
    mockFetch.mockResolvedValue(okResponse);
    const result = await lookupMaven("androidx.media3", "media3-exoplayer");
    expect(result?.latestVersion).toBe("1.4.1");
    expect(result?.ecosystem).toBe("maven");
    expect(result?.group).toBe("androidx.media3");
    expect(result?.artifact).toBe("media3-exoplayer");
  });

  it("returns null on 404 from both registries", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await lookupMaven("com.doesnotexist", "fake-lib");
    expect(result).toBeNull();
  });
});

describe("registries — lookupNpm", () => {
  it("returns structured result on success", async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    mockJson.mockResolvedValue({
      name: "react",
      "dist-tags": { latest: "18.2.0" },
      description: "React is a JavaScript library",
      license: "MIT",
      versions: { "18.0.0": {}, "18.1.0": {}, "18.2.0": {} },
    });
    const result = await lookupNpm("react");
    expect(result?.ecosystem).toBe("npm");
    expect(result?.latestVersion).toBe("18.2.0");
    expect(result?.recentVersions).toContain("18.2.0");
  });

  it("returns null on 404", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    expect(await lookupNpm("does-not-exist-12345")).toBeNull();
  });
});

describe("registries — lookupNuget", () => {
  it("returns structured result from flat-container", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);
    mockJson.mockResolvedValueOnce({ versions: ["13.0.1", "13.0.2", "13.0.3"] });
    // Registration call (best effort) returns 404 — should not throw
    mockFetch.mockResolvedValueOnce({ ok: false } as Response);
    const result = await lookupNuget("Newtonsoft.Json");
    expect(result?.ecosystem).toBe("nuget");
    expect(result?.latestVersion).toBe("13.0.3");
  });

  it("returns null when version list is empty", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response);
    mockJson.mockResolvedValueOnce({ versions: [] });
    expect(await lookupNuget("empty-pkg")).toBeNull();
  });
});

describe("registries — lookupPypi", () => {
  it("returns structured result", async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    mockJson.mockResolvedValue({
      info: {
        name: "requests",
        version: "2.31.0",
        license: "Apache-2.0",
        summary: "HTTP library",
      },
      releases: { "2.0.0": {}, "2.31.0": {} },
    });
    const result = await lookupPypi("requests");
    expect(result?.ecosystem).toBe("pypi");
    expect(result?.latestVersion).toBe("2.31.0");
    expect(result?.license).toBe("Apache-2.0");
  });
});

describe("registries — lookupCrates", () => {
  it("returns structured result", async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    mockJson.mockResolvedValue({
      crate: { name: "serde", newest_version: "1.0.200", description: "Serialization" },
      versions: [{ num: "1.0.199" }, { num: "1.0.200" }],
    });
    const result = await lookupCrates("serde");
    expect(result?.ecosystem).toBe("crates");
    expect(result?.latestVersion).toBe("1.0.200");
  });
});

describe("registries — lookupPub", () => {
  it("returns structured result", async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);
    mockJson.mockResolvedValue({
      name: "http",
      version: "1.2.0",
      pubspec: { description: "HTTP client", homepage: "https://example.com" },
      versions: [{ version: "1.1.0" }, { version: "1.2.0" }],
    });
    const result = await lookupPub("http");
    expect(result?.ecosystem).toBe("pub");
    expect(result?.latestVersion).toBe("1.2.0");
  });
});
