/**
 * Smoke test — print the OpenCode onboarding output so a human can
 * eyeball that the registration snippet is correct and the prompt is
 * well-formed.
 */
import { buildOnboarding } from '../src/lib/runtime-config';

const TEST_KEY = 'opctx_testagent_abc123def4567890abcdef';
const o = buildOnboarding('OpenCode', TEST_KEY);

console.log('=== Sample: OpenCode onboarding with API key ===\n');
console.log('Endpoint:    ', o.endpoint);
console.log('Client:      ', o.registration.client);
console.log('Config file: ', o.registration.file);
console.log('API key in snippet:  ', o.registration.code.includes(TEST_KEY) ? 'YES' : 'NO');
console.log('Placeholder present:', o.registration.code.includes('<YOUR_API_KEY>') ? 'YES' : 'NO');
console.log();
console.log('--- Registration snippet (first 30 lines) ---');
console.log(o.registration.code.split('\n').slice(0, 30).join('\n'));
console.log('...');
console.log();
console.log('--- Instructions hint ---');
console.log(o.instructionsHint ?? '(no native instructions file)');
console.log();
console.log('--- Activation prompt (first 20 lines) ---');
console.log(o.setupPrompt.split('\n').slice(0, 20).join('\n'));
console.log('...');
console.log(`... [prompt continues for ${o.setupPrompt.split('\n').length - 20} more lines]`);
