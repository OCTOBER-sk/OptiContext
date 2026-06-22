export interface DorkParams {
  site_filter?: string;
  file_type?: string;
  date_after?: string;
  date_before?: string;
  exclude_terms?: string[];
  include_phrases?: string[];
  search_in?: "url" | "title" | "body";
}

export function buildDorkQuery(
  baseQuery: string,
  params?: DorkParams,
): string {
  if (!params) return baseQuery;

  const parts: string[] = [];

  if (params.site_filter) {
    const sites = params.site_filter
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (sites.length > 0) {
      parts.push(`site:${sites.join(" OR site:")}`);
    }
  }

  if (params.file_type) {
    parts.push(`filetype:${params.file_type}`);
  }

  if (params.search_in) {
    if (params.search_in === "title") parts.push("intitle:");
    else if (params.search_in === "url") parts.push("inurl:");
    else if (params.search_in === "body") parts.push("intext:");
  }

  if (params.date_after) {
    parts.push(`after:${params.date_after}`);
  }

  if (params.date_before) {
    parts.push(`before:${params.date_before}`);
  }

  if (params.include_phrases && params.include_phrases.length > 0) {
    parts.push(
      params.include_phrases.map((p) => `"${p}"`).join(" OR "),
    );
  }

  parts.push(`(${baseQuery})`);

  if (params.exclude_terms && params.exclude_terms.length > 0) {
    parts.push(
      params.exclude_terms.map((t) => `-${t}`).join(" "),
    );
  }

  return parts.join(" ");
}

/**
 * Tier-1 official-doc sites, used by the broad "developer question"
 * intent pattern. The full tier list lives in `domain-priority.ts`;
 * this is the subset that maps well to dork operators.
 */
const DEV_DOC_SITES: Array<[RegExp, string[]]> = [
  // Android / Kotlin
  [/android|kotlin|jetpack|media3|exoplayer|hilt|retrofit|okhttp|coroutines|compose/i, [
    "developer.android.com",
    "kotlinlang.org",
  ]],
  // Web frontend
  [/react|next\.?js|vue|angular|svelte|tailwind|webpack|vite/i, [
    "react.dev",
    "vuejs.org",
    "angular.io",
    "svelte.dev",
    "developer.mozilla.org",
  ]],
  // Python
  [/django|flask|fastapi|pip|pypi|poetry|conda|numpy|pandas|pytest/i, [
    "docs.python.org",
    "pypi.org",
  ]],
  // Java/JVM
  [/spring\s*boot|spring|hibernate|maven|gradle|jvm/i, [
    "docs.spring.io",
    "spring.io",
    "docs.gradle.org",
  ]],
  // JS/TS runtime
  [/node\.?js|deno|bun|npm|express|fastify/i, [
    "nodejs.org",
    "npmjs.com",
  ]],
  // Go
  [/golang|\bgo\s+module|gin|echo\s+framework/i, [
    "go.dev",
    "pkg.go.dev",
  ]],
  // Rust
  [/rust|cargo|actix|axum|rocket|wasm/i, [
    "rust-lang.org",
    "docs.rs",
  ]],
  // Swift / iOS
  [/swift|swiftui|uikit|ios|apple/i, [
    "docs.swift.org",
    "swift.org",
    "developer.apple.com",
  ]],
  // .NET
  [/\.net|dotnet|asp\.net|c#|csharp|nuget|f#/i, [
    "learn.microsoft.com",
    "docs.microsoft.com",
    "nuget.org",
  ]],
  // Database
  [/postgres|postgresql|sqlite|mysql|mongodb|redis|elasticsearch|sql|orm/i, [
    "postgresql.org",
    "sqlite.org",
    "mongodb.com",
    "redis.io",
  ]],
];

const PACKAGE_INTENT = /\b(maven|gradle|nuget|cargo|pub|pypi|npm|package|version|dependency|coordinate|latest|current|newest|stable|release)\b/i;

const FORUM_SITES = [
  "stackoverflow.com",
  "github.com",
];

export function buildDorkForIntent(intent: string): string {
  const intentLower = intent.toLowerCase();

  // 1. CVE / security — highest priority, narrow domain
  if (
    /\b(cve-\d|vulnerability|exploit|advisory|security\s+advisory)\b/i.test(intent)
  ) {
    return `(site:nvd.nist.gov OR site:cve.mitre.org OR site:github.com/advisories) ${intent}`;
  }

  // 2. GitHub-only when the user explicitly asks for source/repo
  if (
    /\b(github|repo|repository|source\s+code)\b/i.test(intent) &&
    !PACKAGE_INTENT.test(intent)
  ) {
    return `site:github.com ${intent}`;
  }

  // 3. Pricing / plans
  if (
    intentLower.includes("pricing") ||
    intentLower.includes("plans") ||
    intentLower.includes("competitor")
  ) {
    return `${intent} inurl:pricing OR inurl:plans`;
  }

  // 4. PDF / document
  if (intentLower.includes("pdf") || /\b(whitepaper|white\s*paper|report)\b/i.test(intent)) {
    return `${intent} filetype:pdf`;
  }

  // 5. Package manager / version / coordinate intent
  if (PACKAGE_INTENT.test(intent)) {
    const sites = pickSitesForQuery(intent);
    if (sites.length > 0) {
      return `(${sites.map((s) => `site:${s}`).join(" OR ")}) ${intent}`;
    }
  }

  // 6. Framework / language docs (broader match)
  const docSites = pickSitesForQuery(intent);
  if (docSites.length > 0) {
    return `(${docSites.map((s) => `site:${s}`).join(" OR ")}) ${intent}`;
  }

  // 7. Forum fallback for "error" / "how to" / "issue" / "code example" phrasing
  if (
    /\b(error|exception|stack\s*trace|fails?|broken|not\s+working|how\s+do\s+i|code\s+example|code\s+sample|snippet|example)\b/i.test(
      intent,
    )
  ) {
    return `(${FORUM_SITES.map((s) => `site:${s}`).join(" OR ")}) ${intent}`;
  }

  return intent;
}

function pickSitesForQuery(q: string): string[] {
  const out = new Set<string>();
  for (const [pattern, sites] of DEV_DOC_SITES) {
    if (pattern.test(q)) {
      for (const s of sites) out.add(s);
    }
  }
  return Array.from(out);
}
