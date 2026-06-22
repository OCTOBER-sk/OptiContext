/**
 * Package-registry adapters.
 *
 * Each adapter is a pure-async function: takes an identifier, returns
 * a structured `PackageResult` (or `null` on miss). Adapters call
 * upstream APIs directly via the existing `safeFetch` helper and
 * cache results in KV with a 6-hour TTL (package metadata changes
 * at most a few times per day).
 *
 * IMPORTANT: do not paraphrase or summarize here. The whole point
 * is to return canonical, machine-readable data so the agent can
 * quote exact versions and coordinates without hallucination.
 */

import { kv } from "../storage/kv";
import { safeFetch, safeJson } from "../utils/safe-fetch";
import { logger } from "../utils/logger";

export type Ecosystem = "maven" | "npm" | "nuget" | "pypi" | "crates" | "pub";

export interface PackageResult {
  ecosystem: Ecosystem;
  /** "groupId" for Maven, "scope/name" for scoped npm, etc. */
  group?: string;
  /** "artifactId" / package name. */
  artifact: string;
  latestVersion: string;
  recentVersions: string[];
  license?: string;
  homepage?: string;
  repository?: string;
  description?: string;
  deprecation?: { since: string; reason?: string };
  /** Raw response for debugging. Omitted from public responses. */
  _raw?: unknown;
  /** True if the adapter did not find a result (cache miss, 404, parse error). */
  notFound?: boolean;
}

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6h

async function getCached<T>(key: string): Promise<T | null> {
  return (await kv.get("CACHE", key)) as T | null;
}

async function setCached(key: string, value: unknown, ttl: number = CACHE_TTL_SECONDS): Promise<void> {
  try {
    await kv.put("CACHE", key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (err) {
    logger.warn("[registries] cache write failed", {
      key,
      error: err instanceof Error ? err.message : "Unknown",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Maven / Google Maven
// ─────────────────────────────────────────────────────────────────────────────

interface MavenMetadata {
  groupId: string;
  artifactId: string;
  versioning: {
    latest: string;
    release: string;
    versions: string[];
  };
  lastUpdated?: string;
}

/**
 * Resolve a Maven coordinate by hitting maven-metadata.xml.
 * Tries Google Maven first (covers androidx.* and most modern Android libs),
 * then falls back to Maven Central. Returns null on total miss.
 */
export async function lookupMaven(group: string, artifact: string): Promise<PackageResult | null> {
  const cacheKey = `pkg:maven:${group}:${artifact}`;
  const cached = await getCached<PackageResult | { notFound: true }>(cacheKey);
  if (cached) {
    if ("notFound" in cached) return null;
    return cached;
  }

  const path = `${group.replace(/\./g, "/")}/${artifact}/maven-metadata.xml`;

  // Google Maven (covers androidx)
  const google = await fetchMavenMetadata(path, "https://dl.google.com/dl/android/maven2/");
  if (google) {
    const result = toPackageResult(google, group, artifact);
    await setCached(cacheKey, result);
    return result;
  }

  // Maven Central
  const central = await fetchMavenMetadata(path, "https://repo.maven.apache.org/maven2/");
  if (central) {
    const result = toPackageResult(central, group, artifact);
    await setCached(cacheKey, result);
    return result;
  }

  await setCached(cacheKey, { notFound: true });
  return null;
}

async function fetchMavenMetadata(path: string, base: string): Promise<MavenMetadata | null> {
  try {
    const resp = await safeFetch(base + path);
    if (!resp.ok) return null;
    const xml = await resp.text();
    return parseMavenMetadataXml(xml);
  } catch (err) {
    logger.debug("[registries] maven fetch failed", {
      path,
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}

/**
 * Tiny maven-metadata.xml parser. Avoids pulling in a full XML lib.
 * Returns null if the response is not a recognizable metadata doc.
 */
export function parseMavenMetadataXml(xml: string): MavenMetadata | null {
  if (!xml.includes("<metadata") && !xml.includes("<versioning")) return null;
  const groupId = matchTag(xml, "groupId");
  const artifactId = matchTag(xml, "artifactId");
  const latest = matchTag(xml, "latest") ?? matchTag(xml, "release");
  if (!groupId || !artifactId || !latest) return null;

  const versions: string[] = [];
  const versionRe = /<version>([^<]+)<\/version>/g;
  let m: RegExpExecArray | null;
  while ((m = versionRe.exec(xml)) !== null) {
    versions.push(m[1]);
  }

  return {
    groupId,
    artifactId,
    versioning: { latest, release: latest, versions },
  };
}

function matchTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([^<]+)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function toPackageResult(meta: MavenMetadata, group: string, artifact: string): PackageResult {
  const versions = meta.versioning.versions ?? [];
  const recentVersions = versions.slice(-5).reverse();
  return {
    ecosystem: "maven",
    group,
    artifact,
    latestVersion: meta.versioning.latest,
    recentVersions: recentVersions.length > 0 ? recentVersions : [meta.versioning.latest],
    _raw: meta,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// npm
// ─────────────────────────────────────────────────────────────────────────────

interface NpmPackument {
  name: string;
  description?: string;
  "dist-tags"?: { latest?: string };
  versions: Record<string, { license?: string; repository?: { url?: string }; homepage?: string }>;
  time?: Record<string, string>;
  license?: string;
  repository?: { url?: string };
  homepage?: string;
}

export async function lookupNpm(pkg: string): Promise<PackageResult | null> {
  const cacheKey = `pkg:npm:${pkg}`;
  const cached = await getCached<PackageResult | { notFound: true }>(cacheKey);
  if (cached) {
    if ("notFound" in cached) return null;
    return cached;
  }

  try {
    const resp = await safeFetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
    if (!resp.ok) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const data = await safeJson<NpmPackument>(resp);
    if (!data) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const latest = data["dist-tags"]?.latest;
    if (!latest) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const versionKeys = Object.keys(data.versions ?? {}).filter((v) => /^\d/.test(v));
    const recent = versionKeys.slice(-5).reverse();
    const v = data.versions[latest] ?? {};
    const result: PackageResult = {
      ecosystem: "npm",
      artifact: data.name,
      latestVersion: latest,
      recentVersions: recent.length > 0 ? recent : [latest],
      license: v.license ?? data.license,
      homepage: v.homepage ?? data.homepage,
      repository: v.repository?.url ?? data.repository?.url,
      description: data.description,
    };
    await setCached(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn("[registries] npm lookup failed", {
      pkg,
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NuGet
// ─────────────────────────────────────────────────────────────────────────────

interface NugetRegistration {
  items: Array<{
    items: Array<{ catalogEntry: { version: string; description?: string; projectUrl?: string; license?: string } }>;
  }>;
}

export async function lookupNuget(id: string): Promise<PackageResult | null> {
  const cacheKey = `pkg:nuget:${id}`;
  const cached = await getCached<PackageResult | { notFound: true }>(cacheKey);
  if (cached) {
    if ("notFound" in cached) return null;
    return cached;
  }

  try {
    // Use the flat-container index which is fast and has a single canonical "version" listing.
    const resp = await safeFetch(
      `https://api.nuget.org/v3-flatcontainer/${encodeURIComponent(id.toLowerCase())}/index.json`,
    );
    if (!resp.ok) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const data = await safeJson<{ versions: string[] }>(resp);
    if (!data?.versions || data.versions.length === 0) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const versions = data.versions.filter((v) => /^\d/.test(v));
    const recent = versions.slice(-5).reverse();
    const result: PackageResult = {
      ecosystem: "nuget",
      artifact: id,
      latestVersion: versions[versions.length - 1],
      recentVersions: recent,
    };
    // Best-effort: also fetch registration to get description / license.
    try {
      const regResp = await safeFetch(
        `https://api.nuget.org/v3/registration5-semver1/${encodeURIComponent(id.toLowerCase())}/index.json`,
      );
      if (regResp.ok) {
        const reg = await safeJson<NugetRegistration>(regResp);
        const lastPage = reg?.items?.[reg.items.length - 1];
        const lastItem = lastPage?.items?.[lastPage.items.length - 1];
        if (lastItem?.catalogEntry) {
          result.description = lastItem.catalogEntry.description;
          result.homepage = lastItem.catalogEntry.projectUrl;
          result.license = lastItem.catalogEntry.license;
        }
      }
    } catch {
      // ignore — best effort
    }
    await setCached(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn("[registries] nuget lookup failed", {
      id,
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PyPI
// ─────────────────────────────────────────────────────────────────────────────

interface PypiInfo {
  info: {
    name: string;
    version: string;
    license?: string;
    home_page?: string;
    project_url?: string;
    project_urls?: Record<string, string>;
    summary?: string;
  };
  releases: Record<string, unknown>;
}

export async function lookupPypi(pkg: string): Promise<PackageResult | null> {
  const cacheKey = `pkg:pypi:${pkg}`;
  const cached = await getCached<PackageResult | { notFound: true }>(cacheKey);
  if (cached) {
    if ("notFound" in cached) return null;
    return cached;
  }
  try {
    const resp = await safeFetch(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`);
    if (!resp.ok) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const data = await safeJson<PypiInfo>(resp);
    if (!data?.info) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const versions = Object.keys(data.releases ?? {}).filter((v) => /^\d/.test(v));
    const recent = versions.slice(-5).reverse();
    const result: PackageResult = {
      ecosystem: "pypi",
      artifact: data.info.name,
      latestVersion: data.info.version,
      recentVersions: recent.length > 0 ? recent : [data.info.version],
      license: data.info.license,
      homepage: data.info.home_page,
      repository: data.info.project_urls?.["Source"] ?? data.info.project_urls?.["Repository"],
      description: data.info.summary,
    };
    await setCached(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn("[registries] pypi lookup failed", {
      pkg,
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// crates.io
// ─────────────────────────────────────────────────────────────────────────────

interface CratesCrate {
  crate: {
    name: string;
    max_version: string;
    newest_version: string;
    description?: string;
    homepage?: string;
    repository?: string;
    license?: string;
  };
  versions: Array<{ num: string }>;
}

export async function lookupCrates(crate: string): Promise<PackageResult | null> {
  const cacheKey = `pkg:crates:${crate}`;
  const cached = await getCached<PackageResult | { notFound: true }>(cacheKey);
  if (cached) {
    if ("notFound" in cached) return null;
    return cached;
  }
  try {
    const resp = await safeFetch(`https://crates.io/api/v1/crates/${encodeURIComponent(crate)}`);
    if (!resp.ok) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const data = await safeJson<CratesCrate>(resp);
    if (!data?.crate) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const versions = data.versions.map((v) => v.num).filter((v) => /^\d/.test(v));
    const recent = versions.slice(-5).reverse();
    const result: PackageResult = {
      ecosystem: "crates",
      artifact: data.crate.name,
      latestVersion: data.crate.newest_version,
      recentVersions: recent.length > 0 ? recent : [data.crate.newest_version],
      license: data.crate.license,
      homepage: data.crate.homepage,
      repository: data.crate.repository,
      description: data.crate.description,
    };
    await setCached(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn("[registries] crates lookup failed", {
      crate,
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// pub.dev
// ─────────────────────────────────────────────────────────────────────────────

interface PubLatest {
  name: string;
  version: string;
  pubspec?: { description?: string; homepage?: string; repository?: string };
  versions?: { version: string }[];
}

export async function lookupPub(pkg: string): Promise<PackageResult | null> {
  const cacheKey = `pkg:pub:${pkg}`;
  const cached = await getCached<PackageResult | { notFound: true }>(cacheKey);
  if (cached) {
    if ("notFound" in cached) return null;
    return cached;
  }
  try {
    const resp = await safeFetch(`https://pub.dev/api/packages/${encodeURIComponent(pkg)}`);
    if (!resp.ok) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const data = await safeJson<PubLatest>(resp);
    if (!data?.version) {
      await setCached(cacheKey, { notFound: true });
      return null;
    }
    const versions = (data.versions ?? []).map((v) => v.version).filter((v) => /^\d/.test(v));
    const recent = versions.slice(-5).reverse();
    const result: PackageResult = {
      ecosystem: "pub",
      artifact: data.name,
      latestVersion: data.version,
      recentVersions: recent.length > 0 ? recent : [data.version],
      homepage: data.pubspec?.homepage,
      repository: data.pubspec?.repository,
      description: data.pubspec?.description,
    };
    await setCached(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn("[registries] pub lookup failed", {
      pkg,
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}
