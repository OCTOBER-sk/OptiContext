import { getEnv } from "../context";
import { ProviderError } from "../utils/errors";
import { logger } from "../utils/logger";
import { kv } from "../storage/kv";

const APIFY_API_BASE = "https://api.apify.com/v2";
const MONTHLY_BUDGET_CENTS = 500; // $5.00 in cents
const BUDGET_GUARD_CENTS = 450;   // $4.50 guard
const COST_PER_PAGE_CENTS = 0.1;  // $0.001 per page = 0.1 cents

/**
 * Monthly budget guard: tracked in KV so it survives across Worker instances.
 * Key: apify_spend:<YYYY-MM> → cents spent this month
 *
 * Throws ProviderError if the monthly spend guard has been reached.
 * Does NOT deduct yet — call deductApifyBudget() only after a successful API response.
 */
async function checkApifyBudget(pageCost: number): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  const key = `apify_spend:${month}`;
  const spent = parseFloat((await kv.get("CACHE", key)) ?? "0");
  if (spent + pageCost > BUDGET_GUARD_CENTS) {
    logger.warn("[Apify] Monthly spend guard triggered", {
      spent,
      limit: BUDGET_GUARD_CENTS,
    });
    throw new ProviderError(
      "Apify monthly spend guard ($4.50) exceeded. Try again next month or use auto/fast mode which routes to DuckDuckGo (free, no budget).",
      "apify",
      429,
    );
  }
}

async function deductApifyBudget(pageCost: number): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  const key = `apify_spend:${month}`;
  const spent = parseFloat((await kv.get("CACHE", key)) ?? "0");
  await kv.put("CACHE", key, (spent + pageCost).toString(), {
    expirationTtl: 35 * 24 * 3600,
  });
}

export async function scrape(
  urls: string[],
  options: {
    actorId?: string;
    maxPages?: number;
  } = {},
): Promise<{ data: Record<string, unknown>[]; cost: number; provider: string }> {
  const apiKey = getEnv().APIFY_API_KEY;

  if (!apiKey) {
    logger.warn("[Apify] APIFY_API_KEY not set");
    return { data: [], cost: 0, provider: "apify" };
  }

  const pagesScraped = Math.min(urls.length, options.maxPages ?? urls.length);
  const costCents = pagesScraped * COST_PER_PAGE_CENTS;

  await checkApifyBudget(costCents);

  const actorId = options.actorId ?? "apify~web-scraper";

  try {
    // Start actor run
    const startResponse = await fetch(
      `${APIFY_API_BASE}/acts/${actorId}/runs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          startUrls: urls.map((u) => ({ url: u })),
          maxPagesPerCrawl: pagesScraped,
        }),
      },
    );

    if (!startResponse.ok) {
      const text = await startResponse.text();
      throw new ProviderError(
        `Apify actor start failed: ${startResponse.status} ${text}`,
        "apify",
        startResponse.status,
      );
    }

    const run = (await startResponse.json()) as { data: { id: string; status: string } };
    const runId = run.data.id;

    // Poll for completion (max 30s)
    let status = run.data.status;
    for (let i = 0; i < 15 && status === "RUNNING"; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusResp = await fetch(
        `${APIFY_API_BASE}/actor-runs/${runId}`,
        { headers: { "Authorization": `Bearer ${apiKey}` } },
      );
      const statusData = (await statusResp.json()) as { data: { status: string } };
      status = statusData.data.status;
    }

    if (status !== "SUCCEEDED") {
      logger.warn("[Apify] Run did not succeed", { runId, status });
      return { data: [], cost: 0, provider: "apify" };
    }

    // Fetch results
    const dataResponse = await fetch(
      `${APIFY_API_BASE}/actor-runs/${runId}/dataset/items`,
      { headers: { "Authorization": `Bearer ${apiKey}` } },
    );

    if (!dataResponse.ok) {
      return { data: [], cost: 0, provider: "apify" };
    }

    const data = (await dataResponse.json()) as Record<string, unknown>[];

    // Deduct budget only after a confirmed successful response.
    deductApifyBudget(costCents).catch(() => {});

    return { data, cost: costCents / 100, provider: "apify" };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(
      `Apify request failed: ${err instanceof Error ? err.message : "Unknown"}`,
      "apify",
    );
  }
}
