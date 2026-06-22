/**
 * Quick validation script — exercises buildOnboarding() for all 6 client
 * types and prints the structured payload. Confirms the API key is
 * actually substituted into the registration snippet.
 *
 * Run with:  npx tsx scripts/validate-onboarding.ts
 * (or just compile to dist/ and import from there)
 */
import {
  buildOnboarding,
  CLIENT_NAMES,
} from '../src/lib/runtime-config';

const TEST_KEY = 'opctx_testagent_abc123def4567890abcdef';

console.log('=== OptiContext Onboarding Validation ===\n');
console.log(`API key: ${TEST_KEY}`);
console.log(`Client types: ${CLIENT_NAMES.length} (${CLIENT_NAMES.join(', ')})\n`);

let allOk = true;
for (const client of CLIENT_NAMES) {
  try {
    const o = buildOnboarding(client, TEST_KEY);
    const hasKey = o.registration.code.includes(TEST_KEY);
    const hasPlaceholder = o.registration.code.includes('<YOUR_API_KEY>');
    const endpointOk = o.endpoint.startsWith('https://');
    const promptOk = o.setupPrompt.includes('Universal Agent Activation Protocol');
    const ok = hasKey && !hasPlaceholder && endpointOk && promptOk;
    if (!ok) allOk = false;
    console.log(
      `[${ok ? 'OK' : 'FAIL'}] ${client.padEnd(14)} ` +
      `key=${hasKey ? 'Y' : 'N'}  ` +
      `placeholder=${hasPlaceholder ? 'Y' : 'N'}  ` +
      `endpoint=${endpointOk ? 'Y' : 'N'}  ` +
      `prompt=${promptOk ? 'Y' : 'N'}  ` +
      `instr=${o.instructionsHint ? 'Y' : 'N'}`,
    );
  } catch (err) {
    allOk = false;
    console.log(`[FAIL] ${client.padEnd(14)} error: ${(err as Error).message}`);
  }
}

console.log(`\n${allOk ? 'ALL OK' : 'FAILURES PRESENT'}\n`);

// Additional check: a runtime with no instructions file should not
// have the "Copy" button enabled. We just confirm instructionsHint is null.
const openclaw = buildOnboarding('OpenClaw', TEST_KEY);
const cursor = buildOnboarding('Cursor', TEST_KEY);
console.log('--- Section-C contract check ---');
console.log(`OpenClaw.instructionsHint:    ${openclaw.instructionsHint ?? 'null (Section C shows fallback message)'}`);
console.log(`Cursor.instructionsHint:      ${cursor.instructionsHint ?? 'null'}`);

if (!allOk) process.exit(1);
