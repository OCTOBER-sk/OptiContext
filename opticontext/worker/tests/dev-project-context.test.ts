import { describe, it, expect } from "vitest";
import {
  parseVersionsToml,
  parseGradleKts,
  parsePackageJson,
  parseCargoToml,
  parseRequirementsTxt,
  parsePyprojectToml,
  buildProjectContext,
  projectMentionsInQuery,
} from "../src/search/project-context";

describe("project-context parsers", () => {
  describe("parseVersionsToml", () => {
    it("extracts libraries with version refs", () => {
      const toml = `[versions]
agp = "8.7.0"
kotlin = "1.9.24"
media3 = "1.4.1"

[libraries]
androidx-media3 = { group = "androidx.media3", name = "media3-exoplayer", version.ref = "media3" }
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "kotlin" }
`;
      const out = parseVersionsToml(toml);
      expect(out).toContainEqual({
        name: "androidx.media3:media3-exoplayer",
        version: "1.4.1",
        source: "libs.versions.toml",
      });
      expect(out).toContainEqual({
        name: "androidx.core:core-ktx",
        version: "1.9.24",
        source: "libs.versions.toml",
      });
    });

    it("returns empty array for empty input", () => {
      expect(parseVersionsToml("")).toEqual([]);
    });

    it("handles malformed input gracefully", () => {
      const out = parseVersionsToml("not valid toml = = = ===");
      expect(Array.isArray(out)).toBe(true);
    });
  });

  describe("parseGradleKts", () => {
    it("extracts implementation deps", () => {
      const gradle = `
dependencies {
    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    testImplementation("junit:junit:4.13.2")
}
`;
      const out = parseGradleKts(gradle);
      expect(out).toContainEqual({
        name: "androidx.media3:media3-exoplayer",
        version: "1.4.1",
        source: "build.gradle.kts",
      });
      expect(out).toContainEqual({
        name: "junit:junit",
        version: "4.13.2",
        source: "build.gradle.kts",
      });
    });

    it("ignores libs.* version-catalog references", () => {
      const gradle = `dependencies { implementation(libs.androidx.core.ktx) }`;
      const out = parseGradleKts(gradle);
      expect(out).toEqual([]);
    });

    it("captures version-less deps", () => {
      const gradle = `dependencies { implementation("com.example:lib") }`;
      const out = parseGradleKts(gradle);
      expect(out[0]).toEqual({
        name: "com.example:lib",
        version: undefined,
        source: "build.gradle.kts",
      });
    });
  });

  describe("parsePackageJson", () => {
    it("extracts dependencies and devDependencies", () => {
      const pkg = JSON.stringify({
        dependencies: { react: "^18.2.0", next: "14.1.0" },
        devDependencies: { vitest: "^1.0.0" },
      });
      const out = parsePackageJson(pkg);
      expect(out).toContainEqual({ name: "react", version: "18.2.0", source: "package.json" });
      expect(out).toContainEqual({ name: "next", version: "14.1.0", source: "package.json" });
      expect(out).toContainEqual({ name: "vitest", version: "1.0.0", source: "package.json" });
    });

    it("returns empty on invalid JSON", () => {
      expect(parsePackageJson("not json")).toEqual([]);
    });
  });

  describe("parseCargoToml", () => {
    it("extracts simple and inline-table dependencies", () => {
      const cargo = `
[package]
name = "x"

[dependencies]
serde = "1.0"
tokio = { version = "1.40", features = ["full"] }

[dev-dependencies]
mockall = "0.12"
`;
      const out = parseCargoToml(cargo);
      expect(out).toContainEqual({ name: "serde", version: "1.0", source: "Cargo.toml" });
      expect(out).toContainEqual({ name: "tokio", version: "1.40", source: "Cargo.toml" });
      expect(out).toContainEqual({ name: "mockall", version: "0.12", source: "Cargo.toml" });
    });
  });

  describe("parseRequirementsTxt", () => {
    it("parses pinned and unpinned requirements", () => {
      const req = `
requests
django==4.2.0
flask>=2.0
# comment
-r other.txt
`;
      const out = parseRequirementsTxt(req);
      expect(out).toContainEqual({ name: "requests", version: undefined, source: "requirements.txt" });
      expect(out).toContainEqual({ name: "django", version: "4.2.0", source: "requirements.txt" });
      expect(out).toContainEqual({ name: "flask", version: "2.0", source: "requirements.txt" });
    });
  });

  describe("parsePyprojectToml", () => {
    it("extracts PEP 621 dependencies", () => {
      const pyproj = `
[project]
name = "x"
dependencies = [
    "requests>=2.31",
    "fastapi==0.110.0",
    "pydantic",
]
`;
      const out = parsePyprojectToml(pyproj);
      expect(out).toContainEqual({ name: "requests", version: "2.31", source: "pyproject.toml" });
      expect(out).toContainEqual({ name: "fastapi", version: "0.110.0", source: "pyproject.toml" });
    });
  });

  describe("buildProjectContext", () => {
    it("combines multiple manifests without duplication", () => {
      const ctx = buildProjectContext({
        libsVersionsToml: `[versions]\nfoo = "1.0"\n\n[libraries]\nbar = { group = "com.x", name = "bar", version.ref = "foo" }`,
        packageJson: JSON.stringify({ dependencies: { react: "^18.0.0" } }),
        languages: ["kotlin", "java"],
        toolchain: { java: "17", kotlin: "1.9.24" },
      }, "my-project");

      expect(ctx.projectId).toBe("my-project");
      expect(ctx.ecosystems).toContain("gradle");
      expect(ctx.ecosystems).toContain("npm");
      expect(ctx.languages).toEqual(["kotlin", "java"]);
      expect(ctx.toolchain?.java).toBe("17");
      expect(ctx.frameworks.some((f) => f.name === "com.x:bar")).toBe(true);
      expect(ctx.frameworks.some((f) => f.name === "react")).toBe(true);
    });

    it("dedupes frameworks across manifest sources", () => {
      const ctx = buildProjectContext({
        libsVersionsToml: `[libraries]\nandroidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "v" }\n[versions]\nv = "1.0"`,
        buildGradleKts: `dependencies { implementation("androidx.core:core-ktx:1.0") }`,
      });
      const matches = ctx.frameworks.filter((f) => f.name === "androidx.core:core-ktx");
      expect(matches.length).toBe(1);
    });
  });

  describe("projectMentionsInQuery", () => {
    it("detects framework name in query", () => {
      const ctx = buildProjectContext({
        libsVersionsToml: `[libraries]\nx = { group = "androidx.media3", name = "media3-exoplayer", version.ref = "v" }\n[versions]\nv = "1.4.1"`,
      });
      const matches = projectMentionsInQuery(ctx, "how do I configure media3-exoplayer for HLS");
      expect(matches.length).toBeGreaterThan(0);
    });

    it("returns empty for unrelated query", () => {
      const ctx = buildProjectContext({
        packageJson: JSON.stringify({ dependencies: { lodash: "4.17.21" } }),
      });
      const matches = projectMentionsInQuery(ctx, "what is the weather today");
      expect(matches).toEqual([]);
    });
  });
});
