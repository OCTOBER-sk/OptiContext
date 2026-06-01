import { logger } from "../utils/logger";

interface DDGResult {
  title: string;
  url: string;
  snippet: string;
}

const DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function search(
  query: string,
  maxResults: number = 10,
): Promise<{ results: DDGResult[]; provider: string }> {
  try {
    await delay(DELAY_MS);

    const url = new URL("https://html.duckduckgo.com/html/");
    url.searchParams.set("q", query);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      logger.warn(`[DDG] Search failed: ${response.status}`);
      throw new Error(`DuckDuckGo search returned status ${response.status}`);
    }

    const html = await response.text();
    const results = parseDDGResults(html, maxResults);

    return { results, provider: "ddg" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    logger.error("[DDG] Search error", { error: message });
    throw new Error(`DuckDuckGo search failed: ${message}`);
  }
}

function parseDDGResults(html: string, maxResults: number): DDGResult[] {
  const results: DDGResult[] = [];
  const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match;
  let count = 0;
  while ((match = resultRegex.exec(html)) !== null && count < maxResults) {
    results.push({
      url: match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, ""),
      title: match[2].replace(/<[^>]*>/g, "").trim(),
      snippet: match[3].replace(/<[^>]*>/g, "").trim(),
    });
    count++;
  }

  return results;
}
