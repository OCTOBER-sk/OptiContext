/**
 * Deterministic developer-query classifier.
 *
 * Pure function: no LLM, no network, no side effects. Tests-friendly.
 *
 * Returns the strongest signal that matches. Order matters — package
 * lookup beats docs lookup beats compatibility lookup beats general dev.
 */

export type DevIntent =
  | "package_lookup"
  | "framework_docs"
  | "api_reference"
  | "code_example"
  | "compatibility_check"
  | "issue_diagnosis"
  | "general_dev";

export interface ClassificationResult {
  intent: DevIntent;
  /** Higher = stronger signal. Useful for confidence-thresholding downstream. */
  confidence: number;
  /** Specific structured facts extracted from the query (groupId/artifact, package name, framework, etc.). */
  extracted: ExtractedSignals;
  /** Recommended adapter chain. */
  adapters: DevAdapter[];
}

export type DevAdapter = "package" | "docs" | "code" | "issue" | "forum";

export interface ExtractedSignals {
  /** Maven coord like "androidx.media3:media3-exoplayer" */
  mavenCoord?: { group: string; artifact: string };
  /** npm package (possibly scoped) */
  npmPackage?: string;
  /** NuGet id */
  nugetId?: string;
  /** crates.io crate */
  crateName?: string;
  /** PyPI package */
  pypiPackage?: string;
  /** pub.dev Dart package */
  pubPackage?: string;
  /** Detected framework / library name (lowercased canonical form). */
  framework?: string;
  /** Detected language (if a code sample is being requested). */
  language?: string;
}

const FRAMEWORK_KEYWORDS: Array<{ pattern: RegExp; canonical: string }> = [
  // Android / Kotlin
  { pattern: /\b(androidx\.media3|media3|exoplayer|jetpack\s+media)\b/i, canonical: "androidx-media3" },
  { pattern: /\b(androidx\.compose|jetpack\s+compose)\b/i, canonical: "androidx-compose" },
  { pattern: /\b(hilt|dagger\s*hilt)\b/i, canonical: "hilt" },
  { pattern: /\b(retrofit|okhttp)\b/i, canonical: "square-net" },
  { pattern: /\b(coroutines?|kotlinx\.coroutines|kotlin\s+flow)\b/i, canonical: "kotlinx-coroutines" },
  { pattern: /\b(kotlin\s+multiplatform|kmp)\b/i, canonical: "kotlin-multiplatform" },
  // Web
  { pattern: /\b(react|next\.?js|remix|gatsby)\b/i, canonical: "react" },
  { pattern: /\b(vue|nuxt)\b/i, canonical: "vue" },
  { pattern: /\b(angular)\b/i, canonical: "angular" },
  { pattern: /\b(svelte|sveltekit)\b/i, canonical: "svelte" },
  // Backend
  { pattern: /\b(spring\s*boot|spring)\b/i, canonical: "spring" },
  { pattern: /\b(ktor)\b/i, canonical: "ktor" },
  { pattern: /\b(express|fastify|hapi|koa)\b/i, canonical: "node-http" },
  { pattern: /\b(django|flask|fastapi)\b/i, canonical: "python-web" },
  // Systems
  { pattern: /\b(rust|cargo)\b/i, canonical: "rust" },
  { pattern: /\b(go(lang)?)\b/i, canonical: "go" },
  { pattern: /\b(swift|swiftui|swift\s+package\s+manager)\b/i, canonical: "swift" },
  { pattern: /(^|[\s.(])(net|dotnet|asp\.net|csharp|c#|f#|nuget)([\s.);,]|$)/i, canonical: "dotnet" },
  // Other
  { pattern: /\b(elixir|phoenix)\b/i, canonical: "elixir" },
  { pattern: /\b(ruby\s+on\s+rails|rails)\b/i, canonical: "rails" },
  { pattern: /\b(flutter|dart)\b/i, canonical: "flutter" },
  { pattern: /\b(tailwind|nextui|chakra|radix)\b/i, canonical: "css-framework" },
  { pattern: /\b(graphql|apollo|relay)\b/i, canonical: "graphql" },
  { pattern: /\b(prisma|typeorm|drizzle|sequelize)\b/i, canonical: "orm" },
  { pattern: /\b(tensor(flow|flow\.js)|pytorch|jax)\b/i, canonical: "ml-framework" },
  { pattern: /\b(duckdb|postgres|sqlite|mysql|mongo(db)?|redis|elasticsearch)\b/i, canonical: "database" },
];

const DOCS_DOMAINS: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\b(developer\.android\.com|android\s+developer)\b/i, canonical: "developer.android.com" },
  { pattern: /\b(kotlinlang\.org|kotlin\s+lang)\b/i, canonical: "kotlinlang.org" },
  { pattern: /\b(developer\.mozilla\.org|mdn)\b/i, canonical: "developer.mozilla.org" },
  { pattern: /\b(react\.dev|react\s+documentation)\b/i, canonical: "react.dev" },
  { pattern: /\b(docs\.python\.org)\b/i, canonical: "docs.python.org" },
  { pattern: /\b(docs\.oracle\.com|java\s+docs?)\b/i, canonical: "docs.oracle.com" },
  { pattern: /\b(go\.dev|golang\.org)\b/i, canonical: "go.dev" },
  { pattern: /\b(rust-lang\.org|doc\.rust-lang\.org)\b/i, canonical: "rust-lang.org" },
  { pattern: /\b(nodejs\.org)\b/i, canonical: "nodejs.org" },
  { pattern: /\b(spring\.io)\b/i, canonical: "spring.io" },
  { pattern: /\b(developers\.cloudflare\.com|cloudflare\s+docs?)\b/i, canonical: "cloudflare.com/docs" },
  { pattern: /\b(supabase\.com\/docs)\b/i, canonical: "supabase.com/docs" },
  { pattern: /\b(central\.sonatype\.com|search\.maven\.org)\b/i, canonical: "maven-central" },
  { pattern: /\b(dart\.dev|api\.flutter\.dev)\b/i, canonical: "dart.dev" },
  { pattern: /\b(docs\.swift\.org)\b/i, canonical: "docs.swift.org" },
  { pattern: /\b(learn\.microsoft\.com|docs\.microsoft\.com)\b/i, canonical: "learn.microsoft.com" },
];

/**
 * Word-boundary regex for "code" / "source" / "github" — narrower than
 * the existing dork helper, which is what we want for *classification*
 * (the dork helper still owns the dork-string-building job).
 */
const CODE_KEYWORDS = /\b(source\s+code|implementation|example|code\s+sample|snippet|repo|github)\b/i;
const DOCS_KEYWORDS = /\b(docs?|documentation|reference|api\s+ref|tutorial|guide|how\s+to)\b/i;
const COMPAT_KEYWORDS = /\b(compatib(le|ility)|works?\s+with|support(s|ed)?|interop)\b/i;
const ISSUE_KEYWORDS = /(?:\b|^)(error|exception|stack\s*trace|fails?|broken|not\s+working|bug|crash|panic|hangs?)\b|(?:NullPointer|ClassCast|IllegalState|IllegalArgument|NullReference|IndexOutOf|StackOverflow|DivideByZero)/i;

/**
 * Maven coordinate: dotted group, colon, dotted artifact. Excludes
 * `key:value` patterns where value starts with a slash (URLs).
 * Examples that match: androidx.media3:media3-exoplayer, com.squareup.retrofit2:retrofit
 * Examples that don't: https://example.com, foo:bar (too short).
 */
const MAVEN_COORD = /\b([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+):([a-z][a-z0-9_-]*)\b/i;

/**
 * npm install patterns. Allow optional @version.
 *   npm install react
 *   npm i @types/node@20
 *   pnpm add vue
 *   yarn add @apollo/client
 */
const NPM_INSTALL = /\b(?:npm|pnpm|yarn|bun)\s+(?:i|install|add)\s+(@?[a-z0-9][a-z0-9._\/-]*(?:@[a-z0-9._\-+]+)?)/i;
const NPM_BARE = /@([a-z0-9][a-z0-9_-]*)\/([a-z0-9._-]+)/;

const NUGET_ID = /\b(?:nuget|Install-Package|DotNet\s+AddPackage)\s+([A-Z][A-Za-z0-9._]+)\b/;

const CARGO_ADD = /\b(?:cargo\s+add)\s+([a-z0-9_-]+)/i;
const PYPI_INSTALL = /\b(?:pip|pip3|poetry)\s+(?:install|add)\s+([a-z0-9][a-z0-9._-]*)/i;
const PUB_ADD = /\b(?:flutter\s+pub\s+add|pub\s+add)\s+([a-z0-9_]+)/i;

const VERSION_PHRASES = /\b(latest|current|newest|most\s+recent|stable)\s+(version|release|stable)\b/i;
const COORD_PHRASES = /\b(maven\s+(coord|cordinate|dependency)|gradle\s+dependency|nuget\s+package|cargo\s+crate|pub\s+package)\b/i;

export function classifyDevQuery(query: string): ClassificationResult {
  const q = query.trim();
  const extracted: ExtractedSignals = {};
  let intent: DevIntent = "general_dev";
  let confidence = 0.2;
  let adapters: DevAdapter[] = ["docs", "code"];

  // 1. Maven coordinate — strongest signal for package_lookup
  const m = q.match(MAVEN_COORD);
  if (m && isLikelyMavenCoord(m[1], m[2])) {
    extracted.mavenCoord = { group: m[1], artifact: m[2] };
    return {
      intent: "package_lookup",
      confidence: 0.98,
      extracted,
      adapters: ["package"],
    };
  }

  // 2. Package manager install patterns
  const npmInstallMatch = q.match(NPM_INSTALL);
  if (npmInstallMatch) {
    extracted.npmPackage = npmInstallMatch[1];
    return {
      intent: "package_lookup",
      confidence: 0.95,
      extracted,
      adapters: ["package"],
    };
  }

  // Bare @scope/name in code-style queries
  const npmBareMatch = q.match(NPM_BARE);
  if (npmBareMatch && /\b(npm|package|module|lib(?:rary)?)\b/i.test(q)) {
    extracted.npmPackage = `@${npmBareMatch[1]}/${npmBareMatch[2]}`;
    return {
      intent: "package_lookup",
      confidence: 0.85,
      extracted,
      adapters: ["package"],
    };
  }

  const nugetMatch = q.match(NUGET_ID);
  if (nugetMatch) {
    extracted.nugetId = nugetMatch[1];
    return {
      intent: "package_lookup",
      confidence: 0.95,
      extracted,
      adapters: ["package"],
    };
  }

  const cargoMatch = q.match(CARGO_ADD);
  if (cargoMatch) {
    extracted.crateName = cargoMatch[1];
    return {
      intent: "package_lookup",
      confidence: 0.95,
      extracted,
      adapters: ["package"],
    };
  }

  const pypiMatch = q.match(PYPI_INSTALL);
  if (pypiMatch) {
    extracted.pypiPackage = pypiMatch[1];
    return {
      intent: "package_lookup",
      confidence: 0.95,
      extracted,
      adapters: ["package"],
    };
  }

  const pubMatch = q.match(PUB_ADD);
  if (pubMatch) {
    extracted.pubPackage = pubMatch[1];
    return {
      intent: "package_lookup",
      confidence: 0.95,
      extracted,
      adapters: ["package"],
    };
  }

  // 3. Version / coordinate phrases
  if (VERSION_PHRASES.test(q) || COORD_PHRASES.test(q)) {
    return {
      intent: "package_lookup",
      confidence: 0.8,
      extracted,
      adapters: ["package", "docs"],
    };
  }

  // 4. Compatibility check
  if (COMPAT_KEYWORDS.test(q)) {
    intent = "compatibility_check";
    confidence = 0.75;
    adapters = ["package", "docs"];
  }

  // 5. Issue diagnosis
  if (ISSUE_KEYWORDS.test(q)) {
    intent = "issue_diagnosis";
    confidence = Math.max(confidence, 0.7);
    adapters = ["issue", "docs", "code"];
  }

  // 6. API reference
  if (/\b(api\s+ref(erence)?|class\s+reference|method\s+signature|function\s+signature)\b/i.test(q)) {
    intent = "api_reference";
    confidence = Math.max(confidence, 0.85);
    adapters = ["docs"];
  }

  // 7. Code example
  if (/\b(example|sample|snippet|demo|implementation)\b/i.test(q) ||
      (CODE_KEYWORDS.test(q) && DOCS_KEYWORDS.test(q))) {
    intent = "code_example";
    confidence = Math.max(confidence, 0.75);
    adapters = ["code", "docs"];
  }

  // 8. Framework docs
  const frameworkMatch = detectFramework(q);
  if (frameworkMatch) {
    extracted.framework = frameworkMatch;
    // If we already classified as code_example, keep that — but boost confidence.
    if (intent === "general_dev") {
      intent = "framework_docs";
      confidence = Math.max(confidence, 0.75);
    } else {
      confidence = Math.min(1.0, confidence + 0.1);
    }
    adapters = dedupeAdapters([...adapters, "docs"]);
  }

  // 9. Domain hints (developer.android.com etc.) — strong docs signal,
  // but does NOT override an already-classified compatibility or issue.
  const domainMatch = detectDocsDomain(q);
  if (domainMatch && (intent === "general_dev" || intent === "framework_docs")) {
    if (intent === "general_dev") {
      intent = "framework_docs";
      confidence = Math.max(confidence, 0.9);
    } else {
      confidence = Math.min(1.0, confidence + 0.15);
    }
    adapters = dedupeAdapters([...adapters, "docs"]);
  } else if (domainMatch) {
    // Domain match but a stronger signal (issue/compat/api) won.
    confidence = Math.min(1.0, confidence + 0.05);
  }

  // 10. Pure docs keywords with no other signal
  if (intent === "general_dev" && DOCS_KEYWORDS.test(q)) {
    intent = "framework_docs";
    confidence = Math.max(confidence, 0.6);
  }

  return { intent, confidence, extracted, adapters };
}

function isLikelyMavenCoord(group: string, artifact: string): boolean {
  // Reject trivial `a:b` and obvious URL fragments.
  if (group.length < 3 || artifact.length < 2) return false;
  // Reject URL-looking artifacts.
  if (artifact.includes("/") || artifact.includes("?")) return false;
  // Maven groups contain dots, but at least one segment should be ≥3 chars.
  const segments = group.split(".");
  return segments.some((s) => s.length >= 3);
}

function detectFramework(q: string): string | undefined {
  for (const { pattern, canonical } of FRAMEWORK_KEYWORDS) {
    if (pattern.test(q)) return canonical;
  }
  return undefined;
}

function detectDocsDomain(q: string): string | undefined {
  for (const { pattern, canonical } of DOCS_DOMAINS) {
    if (pattern.test(q)) return canonical;
  }
  return undefined;
}

function dedupeAdapters(a: DevAdapter[]): DevAdapter[] {
  const seen = new Set<DevAdapter>();
  const out: DevAdapter[] = [];
  for (const x of a) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}
