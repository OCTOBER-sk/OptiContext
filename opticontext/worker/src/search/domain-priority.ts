/**
 * Domain priority for developer queries.
 *
 * Used to:
 * 1. Build dork queries that include official-doc sites first.
 * 2. Re-rank search results so official docs outrank SEO blogs.
 *
 * Tiers:
 *   tier 2: official framework / language docs (strongest signal)
 *   tier 1: package registries (canonical metadata)
 *   tier 0: github.com for source (used as fallback only)
 *   tier -1: known SEO / low-signal domains (demoted)
 *
 * No external network calls. Pure functions, fully testable.
 */

export interface DomainPriority {
  domain: string;
  tier: 2 | 1 | 0 | -1;
  /** Free-form label for logging / debug. */
  label?: string;
}

export const DOCS_DOMAINS: DomainPriority[] = [
  // Tier 2: official framework / language docs
  { domain: "developer.android.com", tier: 2, label: "Android developer docs" },
  { domain: "kotlinlang.org", tier: 2, label: "Kotlin language docs" },
  { domain: "developer.mozilla.org", tier: 2, label: "MDN" },
  { domain: "react.dev", tier: 2, label: "React docs" },
  { domain: "docs.python.org", tier: 2, label: "Python docs" },
  { domain: "docs.oracle.com", tier: 2, label: "Java/Oracle docs" },
  { domain: "go.dev", tier: 2, label: "Go docs" },
  { domain: "rust-lang.org", tier: 2, label: "Rust docs" },
  { domain: "nodejs.org", tier: 2, label: "Node.js docs" },
  { domain: "spring.io", tier: 2, label: "Spring docs" },
  { domain: "developers.cloudflare.com", tier: 2, label: "Cloudflare docs" },
  { domain: "supabase.com", tier: 2, label: "Supabase docs" },
  { domain: "dart.dev", tier: 2, label: "Dart docs" },
  { domain: "docs.swift.org", tier: 2, label: "Swift docs" },
  { domain: "learn.microsoft.com", tier: 2, label: "Microsoft Learn" },
  { domain: "docs.microsoft.com", tier: 2, label: "Microsoft docs" },
  { domain: "docs.rs", tier: 2, label: "Rust crate docs" },
  { domain: "hexdocs.pm", tier: 2, label: "Elixir/Erlang docs" },
  { domain: "pkg.go.dev", tier: 2, label: "Go package docs" },

  // Tier 1: package registries (canonical metadata)
  { domain: "search.maven.org", tier: 1, label: "Maven Central" },
  { domain: "central.sonatype.com", tier: 1, label: "Maven Central (new)" },
  { domain: "dl.google.com", tier: 1, label: "Google Maven" },
  { domain: "mvnrepository.com", tier: 1, label: "MvnRepository" },
  { domain: "npmjs.com", tier: 1, label: "npm" },
  { domain: "pypi.org", tier: 1, label: "PyPI" },
  { domain: "crates.io", tier: 1, label: "crates.io" },
  { domain: "pub.dev", tier: 1, label: "pub.dev" },
  { domain: "nuget.org", tier: 1, label: "NuGet" },

  // Tier 0: github.com (source only, not the first choice for docs)
  { domain: "github.com", tier: 0, label: "GitHub" },
  { domain: "raw.githubusercontent.com", tier: 0, label: "GitHub raw" },
  { domain: "stackoverflow.com", tier: 0, label: "Stack Overflow" },

  // Tier -1: known SEO / low-signal (explicitly demoted)
  { domain: "medium.com", tier: -1, label: "Medium" },
  { domain: "towardsdatascience.com", tier: -1, label: "Towards Data Science" },
  { domain: "dev.to", tier: -1, label: "dev.to" },
  { domain: "hashnode.com", tier: -1, label: "Hashnode" },
  { domain: "freecodecamp.org", tier: -1, label: "freeCodeCamp" },
  { domain: "reddit.com", tier: -1, label: "Reddit" },
  { domain: "quora.com", tier: -1, label: "Quora" },
  { domain: "youtube.com", tier: -1, label: "YouTube" },
  { domain: "youtu.be", tier: -1, label: "YouTube" },
];

/** Map of normalized hostname → priority. Built once at module load. */
const DOMAIN_INDEX: Map<string, DomainPriority> = (() => {
  const m = new Map<string, DomainPriority>();
  for (const d of DOCS_DOMAINS) {
    m.set(d.domain.toLowerCase(), d);
    // Also index the immediate parent: "react.dev" → "dev" too aggressive,
    // we only do exact host match plus an explicit list of subdomain parents.
  }
  return m;
})();

/**
 * Hosts that are official only when seen as a SUBDOMAIN of these parents.
 * e.g. "kotlinx.coroutines" docs live at github.com, not at kotlinx.io,
 * so this list stays small and conservative.
 */
const SUBDOMAIN_PARENTS: Record<string, DomainPriority> = {
  "developer.android.com": { domain: "developer.android.com", tier: 2, label: "Android developer docs" },
  "docs.spring.io": { domain: "docs.spring.io", tier: 2, label: "Spring docs" },
  "api.flutter.dev": { domain: "api.flutter.dev", tier: 2, label: "Flutter API" },
  "api.kotlinlang.org": { domain: "api.kotlinlang.org", tier: 2, label: "Kotlin API" },
  "kotlinlang.org": { domain: "kotlinlang.org", tier: 2, label: "Kotlin docs" },
  "docs.gradle.org": { domain: "docs.gradle.org", tier: 2, label: "Gradle docs" },
  "maven.apache.org": { domain: "maven.apache.org", tier: 2, label: "Maven docs" },
  "tomcat.apache.org": { domain: "tomcat.apache.org", tier: 2, label: "Tomcat docs" },
  "ktor.io": { domain: "ktor.io", tier: 2, label: "Ktor docs" },
};

export function getDomainPriority(url: string): DomainPriority | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  // Strip leading "www." for matching.
  const hostNoWww = host.startsWith("www.") ? host.slice(4) : host;
  if (DOMAIN_INDEX.has(hostNoWww)) return DOMAIN_INDEX.get(hostNoWww)!;
  if (DOMAIN_INDEX.has(host)) return DOMAIN_INDEX.get(host)!;
  if (SUBDOMAIN_PARENTS[host]) return SUBDOMAIN_PARENTS[host];
  // Walk up subdomains (max 2 levels deep) to find a tier-2 match.
  const parts = host.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (SUBDOMAIN_PARENTS[parent]) return SUBDOMAIN_PARENTS[parent];
  }
  return null;
}

/**
 * Multiplier applied to a search result's relevance score. Higher = better.
 * Unknown domains = 1.0. Tier 2 = 1.6. Tier 1 = 1.3. Tier 0 = 1.0.
 * Tier -1 = 0.55.
 */
export function boostScore(url: string, baseScore: number = 1.0): number {
  const p = getDomainPriority(url);
  if (!p) return baseScore;
  switch (p.tier) {
    case 2: return baseScore * 1.6;
    case 1: return baseScore * 1.3;
    case 0: return baseScore * 1.0;
    case -1: return baseScore * 0.55;
  }
}

/**
 * Build a `site:` dork fragment from a list of preferred domains,
 * in tier order. Returns "" if the list is empty.
 *
 *   "site:developer.android.com OR site:kotlinlang.org"
 */
export function buildSiteDork(domains: string[]): string {
  if (domains.length === 0) return "";
  return domains.map((d) => `site:${d}`).join(" OR ");
}

/**
 * Returns the official-doc domains relevant to a given framework
 * canonical name (from the classifier). Falls back to the universal
 * Tier-2 list.
 */
export function preferredDomainsForFramework(framework?: string): string[] {
  const all = DOCS_DOMAINS.filter((d) => d.tier === 2).map((d) => d.domain);
  if (!framework) return all;

  const FRAMEWORK_TO_DOCS: Record<string, string[]> = {
    "androidx-media3": ["developer.android.com", "github.com"],
    "androidx-compose": ["developer.android.com"],
    "hilt": ["developer.android.com", "dagger.dev"],
    "square-net": ["square.github.io", "github.com"],
    "kotlinx-coroutines": ["kotlinlang.org", "github.com"],
    "kotlin-multiplatform": ["kotlinlang.org"],
    "react": ["react.dev", "github.com"],
    "vue": ["vuejs.org"],
    "angular": ["angular.io"],
    "svelte": ["svelte.dev"],
    "spring": ["spring.io", "docs.spring.io"],
    "ktor": ["ktor.io"],
    "node-http": ["nodejs.org"],
    "python-web": ["docs.python.org"],
    "rust": ["rust-lang.org", "docs.rs"],
    "go": ["go.dev", "pkg.go.dev"],
    "swift": ["docs.swift.org", "swift.org"],
    "dotnet": ["learn.microsoft.com", "docs.microsoft.com"],
    "elixir": ["hexdocs.pm"],
    "rails": ["guides.rubyonrails.org"],
    "flutter": ["api.flutter.dev", "dart.dev"],
    "css-framework": ["tailwindcss.com"],
    "graphql": ["graphql.org"],
    "orm": ["orm.drizzle.team", "prisma.io", "typeorm.io"],
    "ml-framework": ["tensorflow.org", "pytorch.org"],
    "database": ["duckdb.org", "postgresql.org", "sqlite.org", "mongodb.com", "redis.io"],
  };

  return FRAMEWORK_TO_DOCS[framework] ?? all;
}
