/**
 * Project context — the agent's view of "what's in the user's project."
 *
 * Architecture:
 *   - The agent (Claude Code, OpenCode, etc.) reads manifest files
 *     from disk and passes the *parsed* result to OptiContext. We do
 *     not have filesystem access on the server.
 *   - OptiContext stores the context against a project_id and uses
 *     it to bias dev_search results and emit memory suggestions.
 *
 * The parsers here are intentionally minimal — they extract the 80%
 * of information (dependency names + versions, toolchain versions)
 * that 80% of dev queries care about. They are pure functions, fully
 * testable, and never throw — they degrade gracefully on parse errors.
 */

import { kv } from "../storage/kv";

export type Ecosystem = "gradle" | "npm" | "cargo" | "pip" | "pub" | "go" | "swift";

export interface ProjectFramework {
  name: string;
  version?: string;
  source:
    | "build.gradle.kts"
    | "build.gradle"
    | "libs.versions.toml"
    | "package.json"
    | "Cargo.toml"
    | "requirements.txt"
    | "pyproject.toml"
    | "pubspec.yaml"
    | "go.mod"
    | "Package.swift";
}

export interface ProjectContext {
  projectId?: string;
  ecosystems: Ecosystem[];
  languages: string[];
  frameworks: ProjectFramework[];
  toolchain?: {
    java?: string;
    kotlin?: string;
    gradle?: string;
    node?: string;
    rust?: string;
    python?: string;
    dart?: string;
    go?: string;
  };
  updatedAt: string;
}

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24h

export async function getProjectContext(agentId: string, projectId: string): Promise<ProjectContext | null> {
  const raw = await kv.get("CACHE", `project_ctx:${agentId}:${projectId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProjectContext;
  } catch {
    return null;
  }
}

export async function setProjectContext(
  agentId: string,
  ctx: ProjectContext,
): Promise<{ stored: boolean; suggestions: MemorySuggestion[] }> {
  const projectId = ctx.projectId ?? "default";
  const stored: ProjectContext = { ...ctx, projectId, updatedAt: new Date().toISOString() };
  await kv.put(
    "CACHE",
    `project_ctx:${agentId}:${projectId}`,
    JSON.stringify(stored),
    { expirationTtl: CACHE_TTL_SECONDS },
  );

  // Diff against the previous context to surface memory suggestions.
  const previous = await getProjectContext(agentId, projectId);
  const suggestions = diffProjectContext(previous, stored);
  return { stored: true, suggestions };
}

export interface MemorySuggestion {
  action: "write";
  content: string;
  namespace: string;
  importance: number;
  reason: string;
}

function diffProjectContext(prev: ProjectContext | null, next: ProjectContext): MemorySuggestion[] {
  const out: MemorySuggestion[] = [];
  const ns = `project:${next.projectId}`;

  if (!prev) {
    // First observation. Persist a compact stack snapshot.
    if (next.frameworks.length > 0) {
      out.push({
        action: "write",
        content: `Project stack detected: ${next.frameworks.slice(0, 10).map((f) => `${f.name}${f.version ? "@" + f.version : ""}`).join(", ")}`,
        namespace: `${ns}:stack`,
        importance: 6,
        reason: "First-time project context sync",
      });
    }
    if (next.toolchain) {
      const tcs = Object.entries(next.toolchain).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(", ");
      if (tcs) {
        out.push({
          action: "write",
          content: `Project toolchain: ${tcs}`,
          namespace: `${ns}:toolchain`,
          importance: 5,
          reason: "First-time project context sync",
        });
      }
    }
    return out;
  }

  const prevNames = new Set(prev.frameworks.map((f) => f.name));
  const nextNames = new Set(next.frameworks.map((f) => f.name));
  for (const f of next.frameworks) {
    if (!prevNames.has(f.name)) {
      out.push({
        action: "write",
        content: `New dependency added: ${f.name}${f.version ? " " + f.version : ""}`,
        namespace: `${ns}:deps`,
        importance: 4,
        reason: "Detected in project context diff",
      });
    } else {
      const prevVersion = prev.frameworks.find((p) => p.name === f.name)?.version;
      if (prevVersion && f.version && prevVersion !== f.version) {
        out.push({
          action: "write",
          content: `Dependency version change: ${f.name} ${prevVersion} → ${f.version}`,
          namespace: `${ns}:deps`,
          importance: 5,
          reason: "Version bump detected",
        });
      }
    }
  }
  for (const name of prevNames) {
    if (!nextNames.has(name)) {
      out.push({
        action: "write",
        content: `Dependency removed: ${name}`,
        namespace: `${ns}:deps`,
        importance: 3,
        reason: "No longer in project context",
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest parsers — extract, do not validate.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse libs.versions.toml (Gradle version catalog). Extracts the
 * `[versions]` block (alias → version) and the `[libraries]`
 * block (alias → "group:artifact" with optional version-ref).
 *
 * Output is a list of `ProjectFramework` items.
 */
export function parseVersionsToml(text: string): ProjectFramework[] {
  const out: ProjectFramework[] = [];
  const versions: Record<string, string> = {};
  const versionBlock = text.match(/\[versions\]([\s\S]*?)(?=\n\[|$)/);
  if (versionBlock) {
    for (const m of versionBlock[1].matchAll(/^(\w[\w-]*)\s*=\s*"([^"]+)"\s*$/gm)) {
      versions[m[1]] = m[2];
    }
  }
  const libBlock = text.match(/\[libraries\]([\s\S]*?)(?=\n\[|$)/);
  if (libBlock) {
    for (const m of libBlock[1].matchAll(/^([\w.-]+)\s*=\s*\{\s*(?:group\s*=\s*"([^"]+)"\s*,\s*)?name\s*=\s*"([^"]+)"(?:\s*,\s*version\.ref\s*=\s*"([^"]+)")?\s*\}/gm)) {
      const alias = m[1];
      const group = m[2] ?? "";
      const name = m[3];
      const versionRef = m[4];
      const version = versionRef ? versions[versionRef] : undefined;
      out.push({
        name: group ? `${group}:${name}` : name,
        version,
        source: "libs.versions.toml",
      });
    }
  }
  return out;
}

/**
 * Parse build.gradle.kts dependencies block. Matches:
 *   implementation("group:artifact:version")
 *   implementation("group:artifact")  // version-less
 *   implementation(libs.androidx.core.ktx)
 */
export function parseGradleKts(text: string): ProjectFramework[] {
  const out: ProjectFramework[] = [];
  const re = /(?:implementation|api|compileOnly|runtimeOnly|testImplementation|androidTestImplementation|kapt|ksp|annotationProcessor)\s*\(\s*(?:"([^"]+)"|([^)]+))\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const dep = m[1] ?? m[2];
    if (dep.startsWith("libs.")) continue; // resolved by version catalog
    const parts = dep.split(":");
    if (parts.length >= 2) {
      out.push({
        name: `${parts[0]}:${parts[1]}`,
        version: parts[2],
        source: "build.gradle.kts",
      });
    }
  }
  return out;
}

export function parseGradleGroovy(text: string): ProjectFramework[] {
  return parseGradleKts(text.replace(/\(/g, "(").replace(/'/g, '"'));
}

/**
 * Parse package.json dependencies + devDependencies.
 */
export function parsePackageJson(text: string): ProjectFramework[] {
  const out: ProjectFramework[] = [];
  let data: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    data = JSON.parse(text);
  } catch {
    return out;
  }
  for (const [name, ver] of Object.entries(data.dependencies ?? {})) {
    out.push({ name, version: stripVersionRange(ver), source: "package.json" });
  }
  for (const [name, ver] of Object.entries(data.devDependencies ?? {})) {
    out.push({ name, version: stripVersionRange(ver), source: "package.json" });
  }
  return out;
}

function stripVersionRange(v: string): string | undefined {
  if (!v) return undefined;
  return v.replace(/^[\^~>=<]+/, "").split(/\s*\|\|.*/)[0];
}

/**
 * Parse Cargo.toml [dependencies] / [dev-dependencies] / [build-dependencies].
 * Inline tables: crate = { version = "1.0" }
 * Simple:       crate = "1.0"
 */
export function parseCargoToml(text: string): ProjectFramework[] {
  const out: ProjectFramework[] = [];
  const sections = text.match(/\[(dev-|build-)?dependencies?\]([\s\S]*?)(?=\n\[|$)/g);
  if (!sections) return out;
  for (const section of sections) {
    for (const m of section.matchAll(/^([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]+)"|\{[^}]*version\s*=\s*"([^"]+)"[^}]*\})/gm)) {
      const name = m[1];
      const version = m[2] ?? m[3];
      out.push({ name, version, source: "Cargo.toml" });
    }
  }
  return out;
}

/**
 * Parse requirements.txt — one package per line, optional pinned version.
 *   requests
 *   requests==2.31.0
 *   requests >= 2.31
 */
export function parseRequirementsTxt(text: string): ProjectFramework[] {
  const out: ProjectFramework[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line || line.startsWith("-")) continue;
    const m = line.match(/^([A-Za-z0-9_.\-]+)\s*([=<>~!]=?)?\s*([\w.*]+)?/);
    if (m) {
      out.push({ name: m[1], version: m[3], source: "requirements.txt" });
    }
  }
  return out;
}

/**
 * Parse pyproject.toml dependencies from PEP 621 [project] table.
 *   dependencies = ["foo>=1.0", "bar==2.0"]
 */
export function parsePyprojectToml(text: string): ProjectFramework[] {
  const out: ProjectFramework[] = [];
  const m = text.match(/\[project\]([\s\S]*?)(?=\n\[|$)/);
  if (!m) return out;
  const depList = m[1].match(/dependencies\s*=\s*\[([^\]]*)\]/);
  if (!depList) return out;
  for (const dep of depList[1].matchAll(/["']([^"']+)["']/g)) {
    const spec = dep[1];
    const parsed = spec.match(/^([A-Za-z0-9_.\-]+)\s*([=<>~!]=?)?\s*([\w.*]+)?/);
    if (parsed) {
      out.push({ name: parsed[1], version: parsed[3], source: "pyproject.toml" });
    }
  }
  return out;
}

/**
 * Build a ProjectContext from a raw bundle of manifest text blobs.
 * Best-effort: only runs parsers whose source is present in the bundle.
 */
export function buildProjectContext(
  bundle: {
    libsVersionsToml?: string;
    buildGradleKts?: string;
    buildGradle?: string;
    packageJson?: string;
    cargoToml?: string;
    requirementsTxt?: string;
    pyprojectToml?: string;
    languages?: string[];
    toolchain?: ProjectContext["toolchain"];
  },
  projectId?: string,
): ProjectContext {
  const frameworks: ProjectFramework[] = [];
  const ecosystems = new Set<Ecosystem>();

  if (bundle.libsVersionsToml) {
    frameworks.push(...parseVersionsToml(bundle.libsVersionsToml));
    ecosystems.add("gradle");
  }
  if (bundle.buildGradleKts) {
    frameworks.push(...parseGradleKts(bundle.buildGradleKts));
    ecosystems.add("gradle");
  }
  if (bundle.buildGradle) {
    frameworks.push(...parseGradleGroovy(bundle.buildGradle));
    ecosystems.add("gradle");
  }
  if (bundle.packageJson) {
    frameworks.push(...parsePackageJson(bundle.packageJson));
    ecosystems.add("npm");
  }
  if (bundle.cargoToml) {
    frameworks.push(...parseCargoToml(bundle.cargoToml));
    ecosystems.add("cargo");
  }
  if (bundle.requirementsTxt) {
    frameworks.push(...parseRequirementsTxt(bundle.requirementsTxt));
    ecosystems.add("pip");
  }
  if (bundle.pyprojectToml) {
    frameworks.push(...parsePyprojectToml(bundle.pyprojectToml));
    ecosystems.add("pip");
  }

  return {
    projectId,
    ecosystems: Array.from(ecosystems),
    languages: bundle.languages ?? [],
    frameworks: dedupeFrameworks(frameworks),
    toolchain: bundle.toolchain,
    updatedAt: new Date().toISOString(),
  };
}

function dedupeFrameworks(items: ProjectFramework[]): ProjectFramework[] {
  const seen = new Map<string, ProjectFramework>();
  for (const f of items) {
    const existing = seen.get(f.name);
    if (!existing || (existing.version === undefined && f.version !== undefined)) {
      seen.set(f.name, f);
    }
  }
  return Array.from(seen.values());
}

/**
 * Bias helper — return the names+versions of frameworks in this project
 * that the query mentions. Used to re-rank search results.
 *
 * Matches on:
 *   - The full name (e.g. "androidx.media3:media3-exoplayer")
 *   - The artifact / package portion (e.g. "media3-exoplayer")
 *   - The last segment of a Maven group (e.g. "media3")
 *   - The version string (e.g. "1.4.1")
 */
export function projectMentionsInQuery(ctx: ProjectContext, query: string): ProjectFramework[] {
  const q = query.toLowerCase();
  return ctx.frameworks.filter((f) => {
    const n = f.name.toLowerCase();
    if (q.includes(n)) return true;
    if (f.version && q.includes(f.version)) return true;
    // Split Maven coord group:artifact → match the artifact.
    if (n.includes(":")) {
      const [, artifact] = n.split(":");
      if (artifact && q.includes(artifact)) return true;
    }
    // For scoped npm (@scope/name), match the short name.
    if (n.startsWith("@")) {
      const short = n.split("/")[1];
      if (short && q.includes(short)) return true;
    }
    return false;
  });
}
