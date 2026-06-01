#!/usr/bin/env -S node

import crypto from "crypto";

interface AgentSeed {
  agent_id: string;
  display_name: string;
  allowed_tools: string[];
  tier: string;
  rate_limits: {
    requests_per_minute: number;
    daily_cap: number;
  };
}

const SEED_AGENTS: AgentSeed[] = [
  {
    agent_id: "openclaw",
    display_name: "OpenClaw",
    allowed_tools: ["intellisearch", "voicebridge", "deepdoc", "memorycore"],
    tier: "standard",
    rate_limits: { requests_per_minute: 30, daily_cap: 500 },
  },
  {
    agent_id: "hermes",
    display_name: "Hermes",
    allowed_tools: ["intellisearch", "voicebridge", "memorycore"],
    tier: "standard",
    rate_limits: { requests_per_minute: 30, daily_cap: 500 },
  },
  {
    agent_id: "antigravity",
    display_name: "Antigravity",
    allowed_tools: ["intellisearch", "deepdoc", "memorycore"],
    tier: "standard",
    rate_limits: { requests_per_minute: 60, daily_cap: 1000 },
  },
  {
    agent_id: "claudecode",
    display_name: "Claude Code",
    allowed_tools: ["intellisearch", "deepdoc", "memorycore"],
    tier: "standard",
    rate_limits: { requests_per_minute: 30, daily_cap: 500 },
  },
];

function generateKey(agentSlug: string): string {
  const random = crypto.randomBytes(16).toString("hex");
  return `opctx_${agentSlug}_${random}`;
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   OptiContext — Seed KV & Database       ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();

  const kvData: Record<string, unknown>[] = [];
  const tursoInserts: string[] = [];
  const supabaseInserts: string[] = [];

  for (const agent of SEED_AGENTS) {
    const key = generateKey(agent.agent_id);
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");
    const kvKey = `opctx_key:${key}`;

    kvData.push({
      key: kvKey,
      value: JSON.stringify(agent),
      ttl: 86400,
      note: `${agent.display_name} API key cache`,
    });

    tursoInserts.push(
      `INSERT INTO api_keys (key_hash, agent_id, created_at) VALUES ('${keyHash}', '${agent.agent_id}', datetime('now'));`,
    );
    tursoInserts.push(
      `INSERT INTO agent_registry (agent_id, display_name, allowed_tools, tier) VALUES ('${agent.agent_id}', '${agent.display_name}', '${JSON.stringify(agent.allowed_tools)}', '${agent.tier}');`,
    );

    supabaseInserts.push(
      `INSERT INTO agent_profiles (agent_id, display_name, allowed_tools, tier, settings) VALUES ('${agent.agent_id}', '${agent.display_name}', '{${agent.allowed_tools.join(",")}}', '${agent.tier}', '{}'::jsonb) ON CONFLICT (agent_id) DO NOTHING;`,
    );

    console.log(`✅ ${agent.display_name}`);
    console.log(`   Key: ${key}`);
    console.log(`   Hash: ${keyHash}`);
    console.log();
  }

  console.log("══════════════════════════════════════════");
  console.log("📋 Turso SQL to execute:");
  console.log("══════════════════════════════════════════");
  console.log(tursoInserts.join("\n"));

  console.log();
  console.log("══════════════════════════════════════════");
  console.log("📋 Supabase SQL to execute:");
  console.log("══════════════════════════════════════════");
  console.log(supabaseInserts.join("\n"));

  console.log();
  console.log("⚠️  To seed KV, use wrangler:");
  for (const item of kvData) {
    console.log(`   wrangler kv:key put "${item.key}" '${item.value as string}' --namespace-id=<API_KEYS_ID>`);
  }

  console.log();
  console.log("✅ Seed data generated. Store keys securely!");
}

main().catch(console.error);
