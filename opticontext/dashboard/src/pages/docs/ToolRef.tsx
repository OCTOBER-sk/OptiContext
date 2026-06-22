import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CodeBlock } from '../../components/ui/CodeBlock';

interface SchemaRow {
  param: string;
  type: string;
  required: string;
  default_: string;
  desc: string;
}

interface OutputRow {
  field: string;
  type_: string;
  desc: string;
}

interface SubRow {
  col1: string;
  col2: string;
  col3?: string;
}

interface SubSection {
  title: string;
  columns: string[];
  rows: SubRow[];
  footerNote?: string;
}

interface ExampleBlock {
  label: string;
  code: string;
}

interface ErrorRow {
  code: string;
  cause: string;
  resolution: string;
}

interface LimitRow {
  limit: string;
  value: string;
  notes: string;
}

interface ToolPageData {
  id: string;
  name: string;
  desc: string;
  bestFor: string[];
  mcpTools: string[];
  what: string;
  problem: string;
  preFlow?: { intro: string; blocks: ExampleBlock[]; outro: string };
  inputNote?: string;
  inputSchema: SchemaRow[];
  inputSubsections?: SubSection[];
  inputSchemaExtras?: { title: string; note?: string; schema: SchemaRow[] }[];
  inputExample: ExampleBlock;
  outputSchema: OutputRow[];
  outputProse?: string;
  outputExample: ExampleBlock;
  examples: ExampleBlock[];
  errors: ErrorRow[];
  limits: LimitRow[];
}

const COL_DESC = { param: 'Parameter', type: 'Type', req: 'Required', def: 'Default', desc: 'Description' };
const COL_OUT = { field: 'Field', type: 'Type', desc: 'Description' };
const COL_ERR = { code: 'Error code', cause: 'Cause', resolution: 'Resolution' };
const COL_LIM = { limit: 'Limit', value: 'Value', notes: 'Notes' };

function SchemaTable({ schema, note }: { schema: SchemaRow[]; note?: string }) {
  return (
    <>
      {note && <p className="input-note">{note}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{COL_DESC.param}</th>
              <th>{COL_DESC.type}</th>
              <th>{COL_DESC.req}</th>
              <th>{COL_DESC.def}</th>
              <th>{COL_DESC.desc}</th>
            </tr>
          </thead>
          <tbody>
            {schema.map((r) => (
              <tr key={r.param}>
                <td><code>{r.param}</code></td>
                <td><code className="type-cell">{r.type}</code></td>
                <td>{r.required}</td>
                <td><code>{r.default_}</code></td>
                <td className="desc-cell">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OutputTable({ schema }: { schema: OutputRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>{COL_OUT.field}</th>
            <th>{COL_OUT.type}</th>
            <th>{COL_OUT.desc}</th>
          </tr>
        </thead>
        <tbody>
          {schema.map((r) => (
            <tr key={r.field}>
              <td><code>{r.field}</code></td>
              <td><code className="type-cell">{r.type_}</code></td>
              <td className="desc-cell">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubSchemaTable({ title, columns, rows, footerNote }: SubSection) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 className="subsection-heading">{title}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><code>{r.col1}</code></td>
                <td className="desc-cell">{r.col2}</td>
                {r.col3 !== undefined && <td className="desc-cell">{r.col3}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footerNote && <p className="body-p xs" style={{ marginTop: 8 }}>{footerNote}</p>}
    </div>
  );
}

function ErrorTable({ errors }: { errors: ErrorRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>{COL_ERR.code}</th>
            <th>{COL_ERR.cause}</th>
            <th>{COL_ERR.resolution}</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((r, i) => (
            <tr key={i}>
              <td><code className="error-cell">{r.code}</code></td>
              <td className="desc-cell">{r.cause}</td>
              <td className="desc-cell">{r.resolution}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LimitTable({ limits }: { limits: LimitRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>{COL_LIM.limit}</th>
            <th>{COL_LIM.value}</th>
            <th>{COL_LIM.notes}</th>
          </tr>
        </thead>
        <tbody>
          {limits.map((r, i) => (
            <tr key={i}>
              <td className="desc-cell">{r.limit}</td>
              <td><code>{r.value}</code></td>
              <td className="desc-cell">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NamespaceTable({ rows }: { rows: { col1: string; col2: string }[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Namespace example</th>
            <th>Suggested use</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><code>{r.col1}</code></td>
              <td className="desc-cell">{r.col2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoBlock({ content }: { content: string }) {
  return <div className="info-block">{content}</div>;
}

function BodyText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((p, i) => (
        <p key={i} className="body-p" style={{ marginTop: i > 0 ? 12 : 0 }}>{p}</p>
      ))}
    </>
  );
}

const PAGE_DATA: Record<string, ToolPageData> = {
  intellisearch: {
    id: 'intellisearch',
    name: 'IntelliSearch',
    desc: 'Web search with AI-enhanced dorking, multi-provider routing, and summarization.',
    bestFor: [
      'Agents that need current, precise information from the web.',
      'Runtimes that query time-sensitive data, research sources, documentation, or structured datasets.',
      'Any agent where hallucination from stale training data is a failure mode.',
    ],
    mcpTools: ['opticontext_search'],
    what: `IntelliSearch routes every search request through the optimal provider based on the mode parameter or automatically based on query type.

Before returning results, it constructs a precision search query using advanced dorking operators, then passes the raw results through AI inference to filter noise and produce a structured, agent-ready output.

The final response contains a summary, extracted key findings, source URLs, a confidence score, and the provider that resolved the query.

Results are cached at the edge for 15 minutes — identical queries within that window return immediately without consuming provider credits.`,
    problem: `Without IntelliSearch, agents are limited to training data with a fixed knowledge cutoff.

Any query requiring current information — news, documentation updates, CVEs, pricing, availability — either returns stale data or produces a hallucination.

IntelliSearch gives every MCP-compatible runtime live web access through a single capability call, with no per-runtime search integration required.`,
    inputSchema: [
      { param: 'query', type: 'string', required: 'Yes', default_: '\u2014', desc: 'The search query in natural language.' },
      { param: 'mode', type: 'string', required: 'No', default_: '"auto"', desc: 'Provider routing mode: "auto", "research", "fast", or "scrape".' },
      { param: 'dork', type: 'object', required: 'No', default_: '\u2014', desc: 'Advanced search operator parameters (see dork sub-schema below).' },
      { param: 'max_results', type: 'integer', required: 'No', default_: '5', desc: 'Maximum number of results to return. Range: 1\u201320.' },
      { param: 'summarize', type: 'boolean', required: 'No', default_: 'true', desc: 'Run AI filter and summarization on raw results before returning.' },
    ],
    inputSchemaExtras: [
      {
        title: 'Dork sub-schema',
        schema: [
          { param: 'site_filter', type: 'string', required: 'No', default_: '\u2014', desc: 'Restrict results to a specific domain: "github.com".' },
          { param: 'file_type', type: 'string', required: 'No', default_: '\u2014', desc: 'Filter by file extension: "pdf", "py", "md".' },
          { param: 'date_after', type: 'string', required: 'No', default_: '\u2014', desc: 'Only return results after this date. Format: "YYYY-MM-DD".' },
          { param: 'exclude_terms', type: 'array', required: 'No', default_: '\u2014', desc: 'Terms to exclude from results. Each item is a string.' },
        ],
      },
    ],
    inputSubsections: [
      {
        title: 'Mode values',
        columns: ['Value', 'Provider type', 'When to use'],
        rows: [
          { col1: '"auto"', col2: 'Primary \u2192 fallback', col3: 'Default. Routes by query type and current budget state.' },
          { col1: '"research"', col2: 'Primary', col3: 'Deep queries requiring full page content extraction.' },
          { col1: '"fast"', col2: 'Free', col3: 'Instant queries. Free. Returns snippets, not full content.' },
          { col1: '"scrape"', col2: 'Structured', col3: 'Structured data extraction from specific URLs. Use sparingly.' },
        ],
      },

    ],
    inputExample: {
      label: 'tools/call \u2014 opticontext_search',
      code: `{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_search",
    "arguments": {
      "query": "Python RAG implementation examples",
      "mode": "research",
      "dork": {
        "site_filter": "github.com",
        "file_type": "py",
        "date_after": "2025-01-01",
        "exclude_terms": ["tutorial", "beginner"]
      },
      "max_results": 5,
      "summarize": true
    }
  },
  "id": 1
}`,
    },
    outputSchema: [
      { field: 'summary', type_: 'string', desc: 'AI-generated summary of the most relevant search results.' },
      { field: 'key_findings', type_: 'array', desc: 'Extracted factual findings. Each item is a string.' },
      { field: 'sources', type_: 'array', desc: 'Source objects. Each has url (string) and title (string).' },
      { field: 'confidence', type_: 'number', desc: 'Relevance confidence score from 0.0 to 1.0.' },
      { field: 'provider_used', type_: 'string', desc: 'Which provider resolved the query.' },
      { field: 'cached', type_: 'boolean', desc: 'Whether this result was served from cache.' },
      { field: 'query_executed', type_: 'string', desc: 'The final dorked query string sent to the provider.' },
    ],
    outputProse: 'OptiContext processes the request at the edge and returns:',
    outputExample: {
      label: 'IntelliSearch response',
      code: `{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"summary\\":\\"Several production-grade Python RAG implementations were found on GitHub from 2025. Key patterns include LangChain-based retrieval chains with vector backends, and direct embedding API integrations. Most recent repos favor async pipelines over synchronous chains.\\",\\"key_findings\\":[\\"LangChain RAG with vector search is the dominant pattern in recent repos\\",\\"Async retrieval pipelines outperform sync in benchmarks by 2\\u20133x\\",\\"Chunking strategy (512 tokens, 50-token overlap) appears in most production examples\\"],\\"sources\\":[{\\"url\\":\\"https://github.com/user/rag-pgvector\\",\\"title\\":\\"Production RAG with vector search\\"},{\\"url\\":\\"https://github.com/user/async-rag\\",\\"title\\":\\"Async RAG Pipeline\\"}],\\"confidence\\":0.94,\\"provider_used\\":\\"primary\\",\\"cached\\":false,\\"query_executed\\":\\"site:github.com filetype:py retrieval augmented generation after:2025-01-01 -tutorial -beginner\\"}"
      }
    ]
  },
  "id": 1
}`,
    },
    examples: [
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_search",
      "arguments": {
        "query": "latest CVE for OpenSSL 2026"
      }
    },
    "id": 1
  }'`,
      },
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_search",
      "arguments": {
        "query": "latest CVE for OpenSSL",
        "mode": "research",
        "dork": {
          "site_filter": "nvd.nist.gov",
          "date_after": "2026-01-01"
        },
        "max_results": 3
      }
    },
    "id": 1
  }'`,
      },
    ],
    errors: [
      { code: '-32001', cause: 'UNAUTHORIZED \u2014 Agent key missing or invalid.', resolution: 'Verify Authorization: Bearer opctx_<key> header is present and correctly formatted.' },
      { code: '-32029', cause: 'RATE_LIMITED \u2014 Per-minute request limit reached for this agent key.', resolution: 'Wait for the reset window stated in the error message. Default limit: 30 req/min.' },
      { code: '-32030', cause: 'DAILY_CAP_REACHED \u2014 IntelliSearch daily cap exhausted for this agent key.', resolution: 'Resets at 00:00 UTC. Cap is 500 requests/day per agent key on the standard tier.' },
      { code: '-32040', cause: 'PROVIDER_UNAVAILABLE \u2014 All search providers failed to return results.', resolution: 'Retry with "mode": "fast" to use the free provider, which has no quota.' },
      { code: '-32041', cause: 'BUDGET_GUARD_ACTIVE \u2014 Primary search monthly credit limit approaching (\u2265800/1000 used).', resolution: 'Request automatically routes to the fallback provider. No action required.' },
      { code: '-32050', cause: 'QUERY_TOO_LONG \u2014 Query string exceeds 500 characters.', resolution: 'Shorten the query. Use dork parameters for precision instead of long queries.' },
    ],
    limits: [
      { limit: 'Requests per minute (per agent key)', value: '30', notes: 'Shared across all capabilities.' },
      { limit: 'Requests per day (per agent key)', value: '500', notes: 'IntelliSearch-specific daily cap.' },
      { limit: 'Primary search credits per month', value: '1,000', notes: 'Budget guard activates at 800. Requests route to fallback automatically.' },
      { limit: 'Fallback search', value: 'Unlimited', notes: 'Rate-limited by IP jitter. No budget guard needed.' },
      { limit: 'Structured data credits per month', value: '~$5', notes: 'Reserved for "scrape" mode. Budget guard activates at $4.50.' },
      { limit: 'Cache TTL', value: '15 minutes', notes: 'Identical query + params within TTL returns from cache. Does not consume credits.' },
      { limit: 'Max results per call', value: '20', notes: 'Default: 5.' },
      { limit: 'Max query length', value: '500 characters', notes: '' },
    ],
  },
  voicebridge: {
    id: 'voicebridge',
    name: 'VoiceBridge',
    desc: 'TTS streaming across 48 voices and 8 languages. Sub-300ms time to first byte.',
    bestFor: [
      'Runtimes that deliver audio responses to end users.',
      'Telegram, Discord, and WhatsApp agents that respond in voice.',
      'Any runtime where text-to-speech is a required output modality.',
    ],
    mcpTools: ['opticontext_tts'],
    what: `VoiceBridge converts text to natural speech and returns either an audio URL or a stream of audio chunks, depending on the stream parameter.

Incoming text is preprocessed before synthesis: markdown formatting is stripped, code blocks are replaced with spoken placeholders, numbers and abbreviations are normalized, and text longer than 3,000 characters is split into sequential chunks.

Synthesized audio is cached at the edge for 24 hours keyed on a SHA-256 hash of the text and voice combination \u2014 repeat calls with identical inputs return the cached URL without re-synthesizing.

The platform parameter optimizes the audio format automatically for the target delivery context: ogg for Telegram and WhatsApp, mp3 for Discord, wav for raw consumption.`,
    problem: `Runtimes that operate in voice-native channels \u2014 Telegram, Discord, WhatsApp \u2014 have no native TTS output path.

Each platform requires a separate audio pipeline: format negotiation, streaming handling, buffering, and delivery.

VoiceBridge resolves this to a single capability call that returns a ready-to-send audio URL or chunk stream, with platform-specific format optimization already applied.`,
    inputSchema: [
      { param: 'text', type: 'string', required: 'Yes', default_: '\u2014', desc: 'Text to synthesize. Maximum 3,000 characters per call.' },
      { param: 'voice', type: 'string', required: 'No', default_: '"Scarlett"', desc: 'Voice ID to use. See voice reference table below.' },
      { param: 'speed', type: 'number', required: 'No', default_: '1.0', desc: 'Speech speed multiplier. Range: 0.5\u20132.0.' },
      { param: 'format', type: 'string', required: 'No', default_: '"mp3"', desc: 'Output audio format: "mp3", "ogg", or "wav".' },
      { param: 'platform', type: 'string', required: 'No', default_: '"raw"', desc: 'Target delivery platform: "telegram", "discord", "whatsapp", or "raw". Overrides format with platform-optimal value.' },
      { param: 'stream', type: 'boolean', required: 'No', default_: 'false', desc: 'Return audio chunks via SSE stream instead of a URL.' },
    ],
    inputSubsections: [
      {
        title: 'Voice reference',
        columns: ['Voice ID', 'Language', 'Character'],
        footerNote: '48 voices total across 8 languages. The IDs listed above are a representative subset.',
        rows: [
          { col1: 'Scarlett', col2: 'English US', col3: 'Female, warm' },
          { col1: 'Dan', col2: 'English US', col3: 'Male, clear' },
          { col1: 'Will', col2: 'English US', col3: 'Male, deep' },
          { col1: 'Liv', col2: 'English UK', col3: 'Female, British' },
          { col1: 'Harry', col2: 'English UK', col3: 'Male, British' },
          { col1: 'Priya', col2: 'Hindi', col3: 'Female' },
          { col1: 'Arjun', col2: 'Hindi', col3: 'Male' },
          { col1: 'Sofia', col2: 'Spanish', col3: 'Female' },
          { col1: 'Miguel', col2: 'Spanish', col3: 'Male' },
          { col1: 'Emma', col2: 'French', col3: 'Female' },
          { col1: 'Pierre', col2: 'French', col3: 'Male' },
          { col1: 'Yuki', col2: 'Japanese', col3: 'Female' },
          { col1: 'Kenji', col2: 'Japanese', col3: 'Male' },
          { col1: 'Mei', col2: 'Mandarin', col3: 'Female' },
          { col1: 'Wei', col2: 'Mandarin', col3: 'Male' },
          { col1: 'Ana', col2: 'Portuguese', col3: 'Female' },
          { col1: 'Rafael', col2: 'Portuguese', col3: 'Male' },
        ],
      },
      {
        title: 'Platform and format behavior',
        columns: ['platform value', 'Effective format', 'Notes'],
        rows: [
          { col1: '"telegram"', col2: 'ogg/opus', col3: 'Required format for Telegram voice messages.' },
          { col1: '"discord"', col2: 'mp3', col3: 'Discord voice channel audio.' },
          { col1: '"whatsapp"', col2: 'ogg/opus', col3: 'Required format for WhatsApp audio messages.' },
          { col1: '"raw"', col2: 'Uses format field', col3: 'No platform optimization applied.' },
        ],
      },
    ],
    inputExample: {
      label: 'tools/call \u2014 opticontext_tts',
      code: `{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_tts",
    "arguments": {
      "text": "The build completed successfully. Three tests failed in the authentication module. Check the logs for details.",
      "voice": "Dan",
      "platform": "telegram",
      "speed": 1.0,
      "stream": false
    }
  },
  "id": 1
}`,
    },
    outputSchema: [
      { field: 'audio_url', type_: 'string', desc: 'Signed URL for the generated audio file. Valid for 24 hours.' },
      { field: 'duration_ms', type_: 'integer', desc: 'Duration of the audio in milliseconds.' },
      { field: 'voice_used', type_: 'string', desc: 'The voice ID that was used for synthesis.' },
      { field: 'format', type_: 'string', desc: 'The audio format of the returned file: "mp3", "ogg", or "wav".' },
      { field: 'cached', type_: 'boolean', desc: 'Whether this audio was served from the 24-hour TTS cache.' },
      { field: 'chunks', type_: 'array', desc: 'Present only when stream: true. Array of base64-encoded audio chunk strings.' },
    ],
    outputProse: 'OptiContext processes the request at the edge and returns:',
    outputExample: {
      label: 'VoiceBridge response',
      code: `{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"audio_url\\":\\"https://r2.opticontext.dev/tts/b4c7d9f1a3e5b7d9.ogg\\",\\"duration_ms\\":3200,\\"voice_used\\":\\"Dan\\",\\"format\\":\\"ogg\\",\\"cached\\":false,\\"chunks\\":[]}"
      }
    ]
  },
  "id": 1
}`,
    },
    examples: [
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_tts",
      "arguments": {
        "text": "Your daily summary is ready. Three tasks are overdue.",
        "voice": "Scarlett",
        "platform": "telegram"
      }
    },
    "id": 1
  }'`,
      },
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_tts",
      "arguments": {
        "text": "Pull request approved. Merging to main now.",
        "voice": "Will",
        "platform": "discord",
        "speed": 1.1
      }
    },
    "id": 1
  }'`,
      },
    ],
    errors: [
      { code: '-32001', cause: 'UNAUTHORIZED \u2014 Agent key missing or invalid.', resolution: 'Verify Authorization: Bearer opctx_<key> header.' },
      { code: '-32029', cause: 'RATE_LIMITED \u2014 Per-minute limit reached.', resolution: 'Wait for reset. Default: 30 req/min per agent key.' },
      { code: '-32060', cause: 'TEXT_TOO_LONG \u2014 Input text exceeds 3,000 characters.', resolution: 'Split text into multiple calls. Each call handles up to 3,000 characters.' },
      { code: '-32061', cause: 'INVALID_VOICE_ID \u2014 Voice ID not recognized.', resolution: 'Use a valid voice ID from the voice reference table above.' },
      { code: '-32062', cause: 'SYNTHESIS_FAILED \u2014 TTS provider returned an error.', resolution: 'Retry the call. If the error persists, switch to a different voice ID.' },
      { code: '-32063', cause: 'STREAM_UNSUPPORTED \u2014 SSE streaming not available in this context.', resolution: 'Set stream: false and use URL delivery instead.' },
    ],
    limits: [
      { limit: 'Max text per call', value: '3,000 characters', notes: 'Text longer than this is rejected with -32060. Split into sequential calls.' },
      { limit: 'Requests per minute (per agent key)', value: '30', notes: 'Shared across all capabilities.' },
      { limit: 'Requests per day (per agent key)', value: '500', notes: 'VoiceBridge-specific daily cap.' },
      { limit: 'TTS cache TTL', value: '24 hours', notes: 'Same text + voice combination returns cached URL at < 30ms.' },
      { limit: 'Audio file retention in R2', value: '24 hours', notes: 'Files are deleted after cache TTL expires.' },
      { limit: 'Free tier character limit', value: 'TTS provider free tier', notes: 'Budget guard switches to a fallback response if the monthly character limit is reached.' },
    ],
  },
  deepdoc: {
    id: 'deepdoc',
    name: 'DeepDoc',
    desc: 'File analysis with a 2M token context window. Handles any file type, any size.',
    bestFor: [
      'Agents that need to reason over uploaded files \u2014 PDFs, codebases, spreadsheets, audio, and video.',
      'Runtimes where file size exceeds what fits in a standard context window.',
      'Any agent where file analysis results should persist and be recalled in future sessions.',
    ],
    mcpTools: ['opticontext_analyze'],
    what: `DeepDoc accepts a file via four intake paths \u2014 a public URL, inline base64, a pre-upload ID, or a previously stored file ID \u2014 and routes it through the AI analysis API.

The model used for analysis is selected automatically: a fast model for small files with simple queries, a balanced model for medium files, and a large-context model (2M token context window) for files larger than 500KB or queries that require deep reasoning.

The structured response contains a summary, extracted key findings, an answer to the specific query, any data tables found in the file, relevant code blocks, a confidence score, and a file_id that can be used to re-analyze the same file without re-uploading.

Files submitted via base64 or pre-upload are automatically persisted to edge storage under the calling agent\u2019s namespace.`,
    problem: `Agents operating on large files \u2014 a 200-page PDF, a multi-file codebase, a data spreadsheet \u2014 cannot fit the content into a standard context window.

Without DeepDoc, the agent either silently truncates the file, fails the analysis, or requires the runtime operator to build a separate file-handling pipeline.

DeepDoc resolves file intake, model routing, structured extraction, and optional memory persistence to a single capability call.`,
    preFlow: {
      intro: 'For files too large to send as base64 (recommended threshold: > 5MB), use the /upload endpoint first.',
      blocks: [
        { label: 'bash \u2014 POST /upload', code: `curl -X POST https://opticontext.opticontext.workers.dev/upload \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -F "file=@/path/to/report.pdf"` },
        { label: '/upload response', code: `{
  "upload_id": "upload_7f3a9b2e",
  "filename": "report.pdf",
  "size_bytes": 8421376,
  "expires_at": "2026-05-22T14:30:00Z"
}` },
        { label: 'tools/call \u2014 opticontext_analyze', code: `{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "upload_id": "upload_7f3a9b2e",
      "query": "Summarize the key financial findings and flag any anomalies."
    }
  },
  "id": 1
}` },
      ],
      outro: 'The response includes a file_id. Use this ID in future calls to re-analyze without re-uploading.\nThe file is retained in edge storage under your agent\'s namespace.',
    },
    inputNote: 'One of file_url, file_b64, upload_id, or file_id is required. query is required in all cases.',
    inputSchema: [
      { param: 'file_url', type: 'string', required: 'Conditional', default_: '\u2014', desc: 'Public URL of the file to fetch and analyze.' },
      { param: 'file_b64', type: 'string', required: 'Conditional', default_: '\u2014', desc: 'Base64-encoded file content. For files under 100MB.' },
      { param: 'upload_id', type: 'string', required: 'Conditional', default_: '\u2014', desc: 'ID returned from POST /upload.' },
      { param: 'file_id', type: 'string', required: 'Conditional', default_: '\u2014', desc: 'ID from a previous DeepDoc response. Re-analyzes without re-uploading.' },
      { param: 'query', type: 'string', required: 'Yes', default_: '\u2014', desc: 'The specific question or analysis task to run against the file.' },
      { param: 'model', type: 'string', required: 'No', default_: '"auto"', desc: 'Model selection: "auto", "flash", or "pro".' },
      { param: 'output_format', type: 'string', required: 'No', default_: '"structured"', desc: 'Response shape: "structured", "markdown", "json", or "summary_only".' },
      { param: 'save_to_memory', type: 'boolean', required: 'No', default_: 'false', desc: 'Store the analysis result in MemoryCore for future semantic recall.' },
      { param: 'max_tokens', type: 'integer', required: 'No', default_: '4096', desc: 'Maximum response tokens. Range: 1\u201316384.' },
    ],
    inputSubsections: [
      {
        title: 'Model routing behavior',
        columns: ['Condition', 'Model selected', 'Context window'],
        rows: [
          { col1: 'File < 50KB and simple query', col2: 'Fast model', col3: '1M tokens' },
          { col1: 'File < 500KB or complex query', col2: 'Balanced model', col3: '1M tokens' },
          { col1: 'File > 500KB or model: "pro"', col2: 'Large-context model', col3: '2M tokens' },
          { col1: 'model: "flash" (explicit)', col2: 'Fast model', col3: '1M tokens' },
          { col1: 'model: "auto"', col2: 'AI router decides', col3: '\u2014' },
        ],
      },
      {
        title: 'Supported file types',
        columns: ['Category', 'Formats'],
        footerNote: 'Maximum file size: 2GB via the file analysis API. Inline base64 (file_b64): 100MB maximum.',
        rows: [
          { col1: 'Documents', col2: 'PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, HTML, XML, JSON', col3: '' },
          { col1: 'Images', col2: 'PNG, JPG, JPEG, WEBP, HEIC, HEIF, GIF (static)', col3: '' },
          { col1: 'Code', col2: '.py, .js, .ts, .java, .cpp, .c, .go, .rs, .rb, .php, .sh, .yaml, .toml', col3: '' },
          { col1: 'Audio', col2: 'MP3, WAV, FLAC, AAC, OGG, OPUS', col3: '' },
          { col1: 'Video', col2: 'MP4, AVI, MOV, MKV, WEBM', col3: '' },
          { col1: 'Archives', col2: 'ZIP (contents extracted and analyzed)', col3: '' },
        ],
      },
    ],
    inputExample: {
      label: 'tools/call \u2014 opticontext_analyze',
      code: `{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "file_id": "a3f8d9e1b2c4",
      "query": "What are the three most critical security vulnerabilities identified in this audit report?",
      "model": "auto",
      "output_format": "structured",
      "save_to_memory": true,
      "max_tokens": 4096
    }
  },
  "id": 1
}`,
    },
    outputSchema: [
      { field: 'summary', type_: 'string', desc: 'High-level summary of the file\u2019s content relative to the query.' },
      { field: 'key_findings', type_: 'array', desc: 'Extracted facts, structured conclusions, or notable elements. Each item is a string.' },
      { field: 'answer', type_: 'string', desc: 'Direct answer to the query field. The most agent-relevant field.' },
      { field: 'tables', type_: 'array', desc: 'Data tables extracted from the file. Each item is a structured table object.' },
      { field: 'code_blocks', type_: 'array', desc: 'Code segments extracted from the file. Each item has language and content.' },
      { field: 'confidence', type_: 'number', desc: 'Model confidence in the analysis quality. Range: 0.0\u20131.0.' },
      { field: 'file_id', type_: 'string', desc: '12-character hex ID for this file. Use in future calls to re-analyze without re-uploading.' },
      { field: 'tokens_used', type_: 'integer', desc: 'Total tokens consumed by the analysis.' },
      { field: 'model_used', type_: 'string', desc: 'Which AI model was selected by the router.' },
    ],
    outputProse: 'OptiContext processes the request at the edge and returns:',
    outputExample: {
      label: 'DeepDoc response',
      code: `{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"summary\\":\\"The security audit report covers 47 findings across three severity tiers. Critical findings are concentrated in the authentication layer and input validation modules.\\",\\"key_findings\\":[\\"SQL injection vulnerability in the user login endpoint (CVSS 9.1)\\",\\"Hardcoded JWT secret in production environment variables (CVSS 8.7)\\",\\"Unvalidated file upload endpoint accessible without authentication (CVSS 8.4)\\"],\\"answer\\":\\"The three most critical vulnerabilities are: (1) SQL injection in the login endpoint with CVSS score 9.1, (2) hardcoded JWT secret in production config with CVSS 8.7, and (3) unauthenticated file upload endpoint with CVSS 8.4.\\",\\"tables\\":[],\\"code_blocks\\":[],\\"confidence\\":0.97,\\"file_id\\":\\"a3f8d9e1b2c4\\",\\"tokens_used\\":3847,\\"model_used\\":\\"gemini-2.5-flash\\"}"
      }
    ]
  },
  "id": 1
}`,
    },
    examples: [
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_analyze",
      "arguments": {
        "file_id": "a3f8d9e1b2c4",
        "query": "List all functions that interact with the database layer.",
        "model": "pro"
      }
    },
    "id": 1
  }'`,
      },
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_analyze",
      "arguments": {
        "file_url": "https://example.com/spec/api-contract-v2.pdf",
        "query": "What breaking changes were introduced in v2 compared to v1?"
      }
    },
    "id": 1
  }'`,
      },
    ],
    errors: [
      { code: '-32001', cause: 'UNAUTHORIZED \u2014 Agent key missing or invalid.', resolution: 'Verify Authorization header.' },
      { code: '-32029', cause: 'RATE_LIMITED \u2014 Per-minute limit reached.', resolution: 'Wait for reset window stated in error message.' },
      { code: '-32070', cause: 'FILE_NOT_FOUND \u2014 file_id does not exist for this agent.', resolution: 'The file may have been deleted or the ID is from a different agent key. Re-upload.' },
      { code: '-32071', cause: 'UPLOAD_EXPIRED \u2014 upload_id has expired (temp files expire after 1 hour).', resolution: 'Re-upload the file via POST /upload and use the new upload_id.' },
      { code: '-32072', cause: 'FILE_TOO_LARGE \u2014 File exceeds 2GB limit.', resolution: 'Split the file before uploading. Archives (ZIP) are unpacked automatically within the limit.' },
      { code: '-32073', cause: 'UNSUPPORTED_FILE_TYPE \u2014 File format not supported by the analysis API.', resolution: 'Check the supported file types table.' },
      { code: '-32074', cause: 'ANALYSIS_QUOTA_REACHED \u2014 Daily analysis request limit reached.', resolution: 'Large-context model: 50 req/day. Fast model: 1,500 req/day. Resets at midnight.' },
      { code: '-32075', cause: 'ANALYSIS_FAILED \u2014 The analysis service returned an empty or malformed response.', resolution: 'Retry with a more specific query or switch model with model: "pro".' },
    ],
    limits: [
      { limit: 'Max file size (inline base64)', value: '100MB', notes: 'Larger files must use POST /upload.' },
      { limit: 'Max file size (pre-upload)', value: '2GB', notes: 'Analysis API limit.' },
      { limit: 'File retention for re-analysis', value: '48 hours', notes: 'Files are reusable within this window.' },
      { limit: 'File retention in edge storage (via file_id)', value: 'No expiry', notes: 'Agent-managed. Files persist until explicitly deleted.' },
      { limit: 'Fast analysis model requests/day', value: '1,500', notes: 'Budget guard activates at 1,200.' },
      { limit: 'Large-context model requests/day', value: '50', notes: 'Budget guard activates at 40. Reserved for files > 500KB or explicit model: "pro".' },
      { limit: 'Max response tokens', value: '16,384', notes: 'Default: 4,096.' },
      { limit: 'Requests per minute (per agent key)', value: '30', notes: 'Shared across all capabilities.' },
    ],
  },
  memorycore: {
    id: 'memorycore',
    name: 'MemoryCore',
    desc: 'Persistent RAG memory with semantic search. Agents store and retrieve context across sessions.',
    bestFor: [
      'Personal agents that maintain a model of users across conversations.',
      'Runtimes that need to recall past task outputs, document analyses, or research results.',
      'Any agent where state should persist beyond a single session window.',
    ],
    mcpTools: ['opticontext_memory_write', 'opticontext_memory_search'],
    what: `MemoryCore provides two paired operations \u2014 write and search \u2014 that together give an agent a persistent, semantically searchable memory store.

On write, content is chunked into 512-token segments with 50-token overlap, embedded using an AI embedding model (768-dimensional vectors), and stored in a vector database under the calling agent\u2019s namespace.

On search, the query is embedded with the same model, and a cosine similarity search retrieves the most relevant stored chunks ranked by similarity score.

Results can optionally be re-ranked before being assembled into a context block for direct injection into the agent\u2019s prompt.

Memory is scoped per agent key and per namespace \u2014 one agent\u2019s memories are never accessible to another.`,
    problem: `Without MemoryCore, every agent session starts from zero.

Facts learned in one session \u2014 a user\u2019s preferences, a completed task\u2019s output, a file analysis result \u2014 are discarded when the session ends.

The agent must ask the user to repeat context, cannot build continuity across interactions, and cannot reference its own prior outputs.

MemoryCore resolves this with two capability calls: one to store, one to retrieve.`,
    inputSchema: [
      { param: 'content', type: 'string', required: 'Yes', default_: '\u2014', desc: 'Text content to store in memory. Chunked automatically if long.' },
      { param: 'namespace', type: 'string', required: 'No', default_: '"general"', desc: 'Logical partition for this memory. Used to scope searches.' },
      { param: 'importance', type: 'integer', required: 'No', default_: '5', desc: 'Importance score from 1 (lowest) to 10 (highest). Used during auto-summarization.' },
      { param: 'source', type: 'string', required: 'No', default_: '\u2014', desc: 'Origin of this memory: e.g., "user_message", "deepdoc_analysis", "search_result".' },
      { param: 'expires_at', type: 'string', required: 'No', default_: '\u2014', desc: 'ISO 8601 datetime after which this memory is excluded from searches.' },
    ],
    inputExample: {
      label: 'tools/call \u2014 opticontext_memory_write',
      code: `{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_write",
    "arguments": {
      "content": "User's name is Arjun. Preferred language is Tamil. Works in Chennai. Prefers concise responses without code blocks unless explicitly requested.",
      "namespace": "personal",
      "importance": 9,
      "source": "user_message"
    }
  },
  "id": 1
}`,
    },
    outputSchema: [
      { field: 'memory_id', type_: 'string', desc: 'Unique identifier for this memory entry.' },
      { field: 'chunks_stored', type_: 'integer', desc: 'Number of 512-token chunks the content was split into.' },
      { field: 'namespace', type_: 'string', desc: 'The namespace this memory was stored under.' },
      { field: 'embedding_dimensions', type_: 'integer', desc: 'Dimensions of the embedding vector: 768.' },
    ],
    outputProse: 'OptiContext processes the request at the edge and returns:',
    outputExample: {
      label: 'memory_write response',
      code: `{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"memory_id\\":\\"mem_c8d2f1a9b3e4\\",\\"chunks_stored\\":1,\\"namespace\\":\\"personal\\",\\"embedding_dimensions\\":768}"
      }
    ]
  },
  "id": 1
}`,
    },
    examples: [
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_memory_write",
      "arguments": {
        "content": "Completed migration of authentication module to JWT RS256. All 47 tests passing. Deployment to staging was successful on 2026-05-21.",
        "namespace": "projects",
        "importance": 7,
        "source": "task_completion"
      }
    },
    "id": 1
  }'`,
      },
      {
        label: 'bash',
        code: `curl -X POST https://opticontext.opticontext.workers.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_memory_search",
      "arguments": {
        "query": "authentication module status",
        "namespace": "projects",
        "top_k": 5
      }
    },
    "id": 1
  }'`,
      },
    ],
    errors: [
      { code: '-32001', cause: 'UNAUTHORIZED \u2014 Agent key missing or invalid.', resolution: 'Verify Authorization header.' },
      { code: '-32029', cause: 'RATE_LIMITED \u2014 Per-minute limit reached.', resolution: 'Wait for the reset window in the error message.' },
      { code: '-32080', cause: 'CONTENT_TOO_LONG \u2014 Single content string exceeds embedding capacity.', resolution: 'Split content into multiple write calls. Maximum per call: ~32,000 characters.' },
      { code: '-32081', cause: 'EMBEDDING_FAILED \u2014 Embedding API returned an error.', resolution: 'Retry the call.' },
      { code: '-32082', cause: 'STORAGE_LIMIT_REACHED \u2014 Agent has reached the 10,000-chunk memory limit.', resolution: 'Auto-summarization will run at 8,000 chunks to compress old memories. If limit is still reached, delete low-importance memories or expand the namespace scope.' },
      { code: '-32083', cause: 'NAMESPACE_NOT_FOUND \u2014 Search was run against a namespace with no stored memories.', resolution: 'No error action required. total_found will be 0 and memories will be an empty array. This is a no-result state, not a failure.' },
    ],
    limits: [
      { limit: 'Max chunks per agent', value: '10,000', notes: 'Auto-summarization triggers at 8,000 chunks to compress old memories.' },
      { limit: 'Chunk size', value: '512 tokens', notes: 'Fixed. 50-token overlap between adjacent chunks.' },
      { limit: 'Embedding dimensions', value: '768', notes: 'AI embedding model output. Fixed.' },
      { limit: 'Max top_k', value: '20', notes: '' },
      { limit: 'min_similarity range', value: '0.0\u20131.0', notes: 'Default: 0.7. Values below 0.5 may return low-relevance results.' },
      { limit: 'Requests per minute (per agent key)', value: '30', notes: 'Shared across all capabilities.' },
      { limit: 'Requests per day (per agent key)', value: '500', notes: 'MemoryCore write and search each count as one request.' },
      { limit: 'Memory retention', value: 'No expiry by default', notes: 'Set expires_at on write to create time-bounded memories.' },
    ],
  },
};

const BG_PATTERNS: Record<string, string> = {
  intellisearch: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M260 40 L60 190 M260 40 L160 250 M260 40 L210 280 M260 40 L290 200 M260 40 L110 100' stroke='%231A6B4A' stroke-width='0.3' fill='none' opacity='0.025'/%3E%3Ccircle cx='260' cy='40' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='60' cy='190' r='1' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='160' cy='250' r='1' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='110' cy='100' r='1' fill='%231A6B4A' opacity='0.025'/%3E%3C/svg%3E")`,
  voicebridge: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60 Q37.5 20 75 60 T150 60 T225 60 T300 60 M0 120 Q37.5 80 75 120 T150 120 T225 120 T300 120 M0 180 Q37.5 140 75 180 T150 180 T225 180 T300 180 M0 240 Q37.5 200 75 240 T150 240 T225 240 T300 240' stroke='%23C8C4BB' stroke-width='0.3' fill='none' opacity='0.02'/%3E%3C/svg%3E")`,
  deepdoc: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='30' x2='300' y2='30' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Cline x1='0' y1='70' x2='260' y2='70' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Cline x1='40' y1='110' x2='300' y2='110' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Cline x1='0' y1='150' x2='300' y2='150' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Cline x1='20' y1='190' x2='280' y2='190' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Cline x1='0' y1='230' x2='300' y2='230' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Cline x1='60' y1='270' x2='260' y2='270' stroke='%23C8C4BB' stroke-width='0.3' opacity='0.02'/%3E%3Crect x='40' y='20' width='220' height='14' rx='1' fill='%23C8C4BB' opacity='0.015'/%3E%3Crect x='30' y='130' width='240' height='14' rx='1' fill='%23C8C4BB' opacity='0.015'/%3E%3C/svg%3E")`,
  memorycore: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='150' cy='50' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='250' cy='50' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='50' cy='150' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='150' cy='150' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='250' cy='150' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='50' cy='250' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='150' cy='250' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='250' cy='250' r='1.5' fill='%231A6B4A' opacity='0.025'/%3E%3Cline x1='50' y1='50' x2='150' y2='50' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='150' y1='50' x2='250' y2='50' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='150' y1='50' x2='150' y2='150' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='50' y1='50' x2='50' y2='150' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='250' y1='50' x2='250' y2='150' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='50' y1='150' x2='150' y2='150' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='150' y1='150' x2='250' y2='150' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='150' y1='150' x2='150' y2='250' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='50' y1='150' x2='50' y2='250' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='250' y1='150' x2='250' y2='250' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='150' y1='250' x2='250' y2='250' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3Cline x1='50' y1='250' x2='150' y2='250' stroke='%231A6B4A' stroke-width='0.2' opacity='0.015'/%3E%3C/svg%3E")`,
};

export default function ToolRef() {
  const { toolName } = useParams<{ toolName: string }>();
  const navigate = useNavigate();
  const page = toolName ? PAGE_DATA[toolName.toLowerCase()] : null;
  const pattern = toolName ? BG_PATTERNS[toolName.toLowerCase()] : '';
  const isMemoryCore = toolName?.toLowerCase() === 'memorycore';

  if (!page) {
    return (
      <div>
        <p className="breadcrumb" style={{ marginBottom: 8 }}>Documentation</p>
        <h1 className="page-h1">Capability not found</h1>
        <p className="body-p">Available capabilities: IntelliSearch, VoiceBridge, DeepDoc, MemoryCore.</p>
      </div>
    );
  }

  const toolLinks: Record<string, string> = {
    intellisearch: 'IntelliSearch',
    voicebridge: 'VoiceBridge',
    deepdoc: 'DeepDoc',
    memorycore: 'MemoryCore',
  };

  const navOrder = ['intellisearch', 'voicebridge', 'deepdoc', 'memorycore'];
  const currentIndex = navOrder.indexOf(page.id);
  const prevPage = currentIndex > 0 ? navOrder[currentIndex - 1] : null;
  const nextPage = currentIndex < navOrder.length - 1 ? navOrder[currentIndex + 1] : null;

  return (
    <div style={{ position: 'relative' }}>
      {pattern && <div className="bg-pattern" style={{ backgroundImage: pattern, backgroundRepeat: 'no-repeat', backgroundPosition: 'right top' }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p className="breadcrumb" style={{ marginBottom: 8 }}>
          Documentation  &rsaquo;  Capabilities  &rsaquo;  {page.name}
        </p>

        <h1 className="page-h1">{page.name}</h1>
        <p className="page-desc">{page.desc}</p>

        <div className="best-for-block">
          <p className="best-for-label">BEST FOR</p>
          {page.bestFor.map((line, i) => (
            <p key={i} className="body-p" style={{ marginTop: i > 0 ? 4 : 0 }}>{line}</p>
          ))}
        </div>

        <div className="mcp-chip-row">
          {page.mcpTools.map((t, i) => (
            <span key={i} className="mcp-chip">{t}</span>
          ))}
        </div>

        <Section title="What it does">
          <BodyText text={page.what} />
        </Section>

        <Section title="Problem it solves">
          <BodyText text={page.problem} />
        </Section>

        {page.id === 'deepdoc' && page.preFlow && (
          <Section title="Pre-upload flow (for large files)">
            <p className="body-p sm">{page.preFlow.intro}</p>
            {page.preFlow.blocks.map((block, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                {i === 0 && <p className="step-label">Step 1 &mdash; Upload the file:</p>}
                {i === 1 && <p className="step-label">Upload response:</p>}
                {i === 2 && <p className="step-label">Step 2 &mdash; Analyze using the upload ID:</p>}
                <CodeBlock code={block.code} label={block.label} />
              </div>
            ))}
            <p className="body-p xs" style={{ marginTop: 8 }}>{page.preFlow.outro}</p>
          </Section>
        )}

        {isMemoryCore ? (
          <MemoryCoreSections page={page} />
        ) : (
          <>
            <Section title="Input schema">
              <SchemaTable schema={page.inputSchema} note={page.inputNote} />
              {page.inputSchemaExtras?.map((ext, i) => (
                <div key={i} style={{ marginTop: 24 }}>
                  <h3 className="subsection-heading">{ext.title}</h3>
                  <SchemaTable schema={ext.schema} note={ext.note} />
                </div>
              ))}
              {page.inputSubsections?.map((sub, i) => (
                <SubSchemaTable key={i} title={sub.title} columns={sub.columns} rows={sub.rows} />
              ))}
              <div style={{ marginTop: 16 }}>
                <CodeBlock code={page.inputExample.code} label={page.inputExample.label} />
              </div>
            </Section>

            <Section title="Output schema">
              <OutputTable schema={page.outputSchema} />
              {page.outputProse && <p className="output-prose">{page.outputProse}</p>}
              <CodeBlock code={page.outputExample.code} label={page.outputExample.label} />
            </Section>

            <Section title="Example calls">
              {renderExamples(page)}
            </Section>

            {page.id === 'voicebridge' && (
              <>
                <Section title="Platform delivery patterns">
                  <InfoBlock content={`Telegram delivery sequence:
   1. Runtime calls opticontext_tts with platform: "telegram"
   2. VoiceBridge synthesizes and returns audio_url (R2 signed URL, ogg/opus)
   3. Runtime downloads audio from audio_url
   4. Runtime sends audio file as Telegram voice message via bot API
   End-to-end target: < 800ms

Discord delivery sequence:
   1. Runtime calls opticontext_tts with platform: "discord"
   2. VoiceBridge returns audio_url (mp3)
   3. Runtime streams audio into Discord voice channel
   Time to first audio chunk: < 500ms

WhatsApp delivery sequence:
   1. Runtime calls opticontext_tts with platform: "whatsapp"
   2. VoiceBridge returns audio_url (ogg/opus) and duration_ms
   3. Runtime sends as WhatsApp audio message via Business API
   End-to-end target: < 1s`} />
                </Section>

                <Section title="Cache behavior">
                  <InfoBlock content={`Cache key: SHA-256(text + voice_id)
Cache hit:  Returns audio_url from CF KV \u2192 R2 in < 30ms. No synthesis cost.
Cache miss: Full synthesis pipeline. TTFB ~300ms. Total ~600ms for short text.
Cache TTL:  24 hours from time of synthesis.

Effect: If the same message is spoken multiple times (e.g., a daily summary
with identical text), it is synthesized once and served from cache on all
subsequent calls within the 24-hour window.`} />
                </Section>
              </>
            )}
          </>
        )}

        {page.id === 'memorycore' && (
          <MemoryCoreNamespace />
        )}

        <Section title="Error states">
          <ErrorTable errors={page.errors} />
        </Section>

        <Section title="Limits">
          <LimitTable limits={page.limits} />
        </Section>

        {page.id === 'intellisearch' && (
          <Section title="Budget guard behavior">
            <InfoBlock content={`When primary search credits reach 800/1000 for the month:
  \u2192 IntelliSearch automatically routes all requests to the fallback provider
  \u2192 No error is returned to the runtime
  \u2192 provider_used field in response reflects the fallback provider
  \u2192 Dashboard shows a warning indicator under Usage Alerts

When the free search provider is unavailable (rare):
  \u2192 Returns PROVIDER_UNAVAILABLE error with code -32040
  \u2192 Retry with explicit "mode": "fast" or "mode": "scrape"`} />
          </Section>
        )}
        {page.id === 'memorycore' && <MemoryCoreExtras />}

        <div className="divider" style={{ marginBottom: 24 }} />

        <nav className="page-nav">
          <div>
            {prevPage && (
              <button onClick={() => navigate(`/docs/tools/${prevPage}`)} className="btn-ghost sm">
                &larr; {toolLinks[prevPage]}
              </button>
            )}
          </div>
          <button onClick={() => navigate('/docs/api-reference')} className="btn-ghost sm">
            View full API reference
          </button>
          <div>
            {nextPage && (
              <button onClick={() => navigate(`/docs/tools/${nextPage}`)} className="btn-ghost sm">
                {toolLinks[nextPage]} &rarr;
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 className="section-h2">{title}</h2>
      {children}
    </section>
  );
}

function renderExamples(page: ToolPageData) {
  const labels: Record<string, string[]> = {
    intellisearch: ['Minimal call (auto mode, no dorking)', 'Research call with dorking (CVE example)'],
    voicebridge: ['Telegram voice message (URL delivery)', 'Discord audio (mp3 with speed adjustment)'],
    deepdoc: ['Re-analyze a stored file', 'Analyze a public URL'],
    memorycore: ['Write a task output to memory', 'Search for project context'],
  };
  const exampleLabels = labels[page.id] || [];
  return (
    <>
      {page.examples.map((ex, i) => (
        <div key={i} style={{ marginBottom: i < page.examples.length - 1 ? 24 : 0 }}>
          {exampleLabels[i] && <p className="example-label">{exampleLabels[i]}</p>}
          <CodeBlock code={ex.code} label={ex.label} />
        </div>
      ))}
    </>
  );
}

function MemoryCoreSections({ page }: { page: ToolPageData }) {
  const searchSchema: SchemaRow[] = [
    { param: 'query', type: 'string', required: 'Yes', default_: '\u2014', desc: 'The search query. Embedded and compared against stored vectors.' },
    { param: 'namespace', type: 'string', required: 'No', default_: '"general"', desc: 'Namespace to search within. Searches are scoped to this namespace only.' },
    { param: 'top_k', type: 'integer', required: 'No', default_: '5', desc: 'Number of top results to return. Maximum: 20.' },
    { param: 'min_similarity', type: 'number', required: 'No', default_: '0.7', desc: 'Minimum cosine similarity threshold. Range: 0.0\u20131.0. Results below this score are excluded.' },
    { param: 'rerank', type: 'boolean', required: 'No', default_: 'true', desc: 'Re-rank results using AI before returning. Improves relevance ordering.' },
  ];
  const searchOutputSchema: OutputRow[] = [
    { field: 'memories', type_: 'array', desc: 'Ranked list of matching memory entries. Each has content, namespace, importance, source, created_at.' },
    { field: 'relevance_scores', type_: 'array', desc: 'Cosine similarity score for each returned memory. Parallel array to memories.' },
    { field: 'total_found', type_: 'integer', desc: 'Total number of memories matching the query above min_similarity, before top_k truncation.' },
    { field: 'context_block', type_: 'string', desc: 'Pre-assembled context string from top results. Ready for direct injection into an agent prompt.' },
  ];

  return (
    <>
      <Section title="Write operation">
        <h3 className="subsection-heading">Input schema &mdash; opticontext_memory_write</h3>
        <SchemaTable schema={page.inputSchema} />
        <div style={{ marginTop: 16 }}>
          <CodeBlock code={page.inputExample.code} label={page.inputExample.label} />
        </div>

        <h3 className="subsection-heading" style={{ marginTop: 32 }}>Write output schema</h3>
        <OutputTable schema={page.outputSchema} />
        {page.outputProse && <p className="output-prose">{page.outputProse}</p>}
        <CodeBlock code={page.outputExample.code} label={page.outputExample.label} />
      </Section>

      <Section title="Search operation">
        <h3 className="subsection-heading">Input schema &mdash; opticontext_memory_search</h3>
        <SchemaTable schema={searchSchema} />
        <div style={{ marginTop: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_search",
    "arguments": {
      "query": "What does the user prefer about response formatting?",
      "namespace": "personal",
      "top_k": 3,
      "min_similarity": 0.75,
      "rerank": true
    }
  },
  "id": 1
}`} label="tools/call \u2014 opticontext_memory_search" />
        </div>

        <h3 className="subsection-heading" style={{ marginTop: 32 }}>Search output schema</h3>
        <OutputTable schema={searchOutputSchema} />
        <p className="output-prose">OptiContext processes the request at the edge and returns:</p>
        <CodeBlock code={`{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"memories\\":[{\\"content\\":\\"User prefers concise responses without code blocks unless explicitly requested.\\",\\"namespace\\":\\"personal\\",\\"importance\\":9,\\"source\\":\\"user_message\\",\\"created_at\\":\\"2026-05-21T10:14:00Z\\"}],\\"relevance_scores\\":[0.94],\\"total_found\\":1,\\"context_block\\":\\"User preferences: Prefers concise responses without code blocks unless explicitly requested.\\"}"
      }
    ]
  },
  "id": 1
}`} label="memory_search response" />
      </Section>

      <Section title="Example calls">
        {renderExamples(page)}
      </Section>
    </>
  );
}

function MemoryCoreNamespace() {
  return (
    <Section title="Namespace system">
      <p className="body-p sm" style={{ marginBottom: 12 }}>
        Namespaces partition memory within a single agent key. Searches are scoped to one namespace per call.
      </p>
      <NamespaceTable rows={[
        { col1: 'general', col2: 'Default. Mixed-purpose storage.' },
        { col1: 'personal', col2: 'Facts about the end user: preferences, name, location.' },
        { col1: 'projects', col2: 'Project-specific state, task outputs, decisions.' },
        { col1: 'web_research', col2: 'Saved search results from IntelliSearch.' },
        { col1: 'conversations', col2: 'Session summaries and notable exchanges.' },
      ]} />
      <p className="body-p xs" style={{ marginTop: 8 }}>
        Namespaces are created automatically on first write. No schema setup required. Use consistent namespace strings within an agent to keep memory scoped correctly.
      </p>
    </Section>
  );
}

function MemoryCoreExtras() {
  return (
    <>
      <Section title="Auto-summarization">
        <InfoBlock content={`Trigger:    Agent's memory store reaches 8,000 chunks.
Action:     AI summarization pass runs over the oldest, lowest-importance chunks.
            Groups of related chunks are compressed into single summary entries.
            Original chunks are deleted after summarization.
Effect:     Memory count is reduced. Total semantic coverage is preserved.
            Agents do not notice the compression \u2014 search results remain coherent.
Threshold:  Hard cap at 10,000 chunks. Writes above this limit return -32082.`} />
      </Section>

      <Section title="How save_to_memory works across capabilities">
        <InfoBlock content={`IntelliSearch, VoiceBridge, and DeepDoc all accept a save_to_memory parameter.
When set to true, OptiContext automatically calls opticontext_memory_write
after the primary capability completes, storing the result under the general namespace
(or a capability-specific namespace if configured).

This means memory accumulates passively as the agent works,
without requiring explicit write calls in the runtime.`} />
      </Section>
    </>
  );
}
