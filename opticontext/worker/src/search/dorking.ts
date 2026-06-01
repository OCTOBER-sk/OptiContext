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

export function buildDorkForIntent(intent: string): string {
  const intentLower = intent.toLowerCase();

  if (intentLower.includes("github") || intentLower.includes("code")) {
    return `site:github.com ${intent}`;
  }

  if (
    intentLower.includes("cve") ||
    intentLower.includes("vulnerability") ||
    intentLower.includes("security")
  ) {
    return `site:nvd.nist.gov OR site:cve.mitre.org ${intent}`;
  }

  if (
    intentLower.includes("pricing") ||
    intentLower.includes("plans") ||
    intentLower.includes("competitor")
  ) {
    return `${intent} inurl:pricing OR inurl:plans`;
  }

  if (intentLower.includes("pdf") || intentLower.includes("document")) {
    return `${intent} filetype:pdf`;
  }

  return intent;
}
