#!/usr/bin/env -S node

import crypto from "crypto";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function generateKey(agentSlug: string): string {
  const random = crypto.randomBytes(16).toString("hex");
  return `opctx_${agentSlug}_${random}`;
}

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   OptiContext — Agent Key Generator   ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log();

  const agentId = await ask("Agent ID (e.g., openclaw, hermes): ");
  const displayName = await ask("Display name: ");
  const ownerEmail = await ask("Owner email: ");
  const tier = await ask("Tier (standard/premium): ") || "standard";
  const tools = await ask("Allowed tools (comma-separated: intellisearch,voicebridge,deepdoc,memorycore): ");
  const rpm = await ask("Rate limit (requests per minute) [30]: ") || "30";
  const daily = await ask("Daily cap [500]: ") || "500";

  const allowedTools = tools.split(",").map((t) => t.trim()).filter(Boolean);
  const key = generateKey(agentId);

  console.log();
  console.log("═══════════════════════════════════════");
  console.log("🔑 GENERATED API KEY");
  console.log("═══════════════════════════════════════");
  console.log();
  console.log(`  Key:     ${key}`);
  console.log(`  Agent:   ${agentId}`);
  console.log(`  Tools:   ${allowedTools.join(", ")}`);
  console.log(`  RPM:     ${rpm}`);
  console.log(`  Daily:   ${daily}`);
  console.log();
  console.log("⚠️  This key will NOT be shown again. Store it securely.");
  console.log();
  console.log("═══════════════════════════════════════");

  // Output JSON for programmatic use
  console.log();
  console.log(
    JSON.stringify({
      key,
      agent_id: agentId,
      display_name: displayName,
      owner_email: ownerEmail,
      tier,
      allowed_tools: allowedTools,
      rate_limits: {
        requests_per_minute: parseInt(rpm),
        daily_cap: parseInt(daily),
      },
      created_at: new Date().toISOString(),
    }),
  );

  rl.close();
}

main().catch(console.error);
