import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Line {
  text: string;
  type: 'dim' | 'accent' | 'string' | 'key' | 'bracket' | 'text' | 'label' | 'success' | 'error' | 'info' | 'divider' | 'prompt';
  delay?: number;
}

const TOOLS = [
  'opticontext_search',
  'opticontext_tts',
  'opticontext_analyze',
  'opticontext_memory_write',
  'opticontext_memory_search',
  'opticontext_guide',
];

const PROVIDERS = ['tavily', 'ddg', 'apify', 'gemini', 'cerebras'];
const REGIONS = ['us-east', 'us-west', 'eu-west', 'apac-sin'];
const VOICES = ['Scarlett', 'Dan', 'Will', 'Liv', 'Harry', 'Priya', 'Sofia', 'Emma', 'Yuki', 'Mei'];
const LANGUAGES = ['en-US', 'en-UK', 'hi-IN', 'es-ES', 'fr-FR', 'ja-JP', 'zh-CN', 'pt-BR'];
const MODELS = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'cerebras-llama-3.3'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ts(): string {
  const d = new Date();
  return d.toISOString().replace('T', ' ').slice(0, 23);
}

function latency(): number {
  return 47 + Math.floor(Math.random() * 1200);
}

function tokens(): number {
  return 128 + Math.floor(Math.random() * 4096);
}

function requestId(): string {
  return `req_${Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

function generateScenario(): Line[][] {
  const tool = pick(TOOLS);
  const rid = requestId();
  const lat = latency();
  const tok = tokens();
  const region = pick(REGIONS);
  const provider = pick(PROVIDERS);
  const cached = Math.random() > 0.7;

  const scenarios: Record<string, () => Line[][]> = {
    opticontext_search: () => {
      const queries = [
        '"latest developments in MCP server specifications 2026"',
        '"Python RAG implementation patterns production"',
        '"Cloudflare Workers edge computing benchmarks"',
        '"AI agent memory systems comparison 2026"',
        '"real-time web search API latency optimization"',
        '"semantic chunking strategies for RAG pipelines"',
        '"TTS latency benchmarks sub-300ms edge"',
        '"multi-provider search routing fault tolerance"',
      ];
      const query = pick(queries);
      const modes = ['auto', 'research', 'fast', 'scrape'];
      const mode = pick(modes);
      const sources = Math.floor(Math.random() * 8) + 2;
      const confidence = (0.82 + Math.random() * 0.17).toFixed(2);
      return [
        [{ text: `→ ${ts()}`, type: 'dim' }, { text: ` ${rid}`, type: 'info' }],
        [{ text: 'MCP call   ', type: 'label' }, { text: 'tools/call', type: 'accent' }],
        [{ text: 'Tool       ', type: 'label' }, { text: tool, type: 'accent' }],
        [{ text: 'Arguments  ', type: 'label' }],
        [{ text: '{', type: 'bracket' }],
        [{ text: '  "query"', type: 'key' }, { text: ': ', type: 'text' }, { text: query, type: 'string' }],
        [{ text: '  "mode"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${mode}"`, type: 'string' }],
        [{ text: '  "max_results"', type: 'key' }, { text: ': ', type: 'text' }, { text: `${3 + Math.floor(Math.random() * 8)}`, type: 'text' }],
        [{ text: '  "summarize"', type: 'key' }, { text: ': true', type: 'text' }],
        [{ text: '}', type: 'bracket' }],
        [{ text: '───', type: 'divider' }],
        [{ text: `Edge ${region}`, type: 'label' }, { text: ' · auth OK', type: 'success' }, { text: ' · KV hit', type: 'dim' }],
        [{ text: `Route → ${pick(['tavily', 'ddg', 'apify'])}`, type: 'info' }],
        [{ text: `Cache: ${cached ? 'HIT' : 'MISS'}`, type: cached ? 'success' : 'dim' }],
        [{ text: `Streaming result (${sources} sources, confidence ${confidence})`, type: 'info' }],
        [{ text: `Response: ${lat}ms · ${tok} tokens`, type: 'dim' }],
      ];
    },

    opticontext_tts: () => {
      const voice = pick(VOICES);
      const lang = pick(LANGUAGES);
      const platform = pick(['telegram', 'discord', 'whatsapp', 'raw']);
      const duration = 1500 + Math.floor(Math.random() * 5000);
      const texts = [
        '"Your build completed successfully. All 47 tests passing."',
        '"Three tasks are overdue. Check the project dashboard."',
        '"Pull request approved. Merging to main now."',
        '"Daily summary: 12 new commits, 3 open issues, 1 pending review."',
        '"The deployment to production was rolled back due to failing health checks."',
        '"Your meeting starts in 15 minutes. Room 4B, second floor."',
      ];
      return [
        [{ text: `→ ${ts()}`, type: 'dim' }, { text: ` ${rid}`, type: 'info' }],
        [{ text: 'MCP call   ', type: 'label' }, { text: 'tools/call', type: 'accent' }],
        [{ text: 'Tool       ', type: 'label' }, { text: tool, type: 'accent' }],
        [{ text: 'Arguments  ', type: 'label' }],
        [{ text: '{', type: 'bracket' }],
        [{ text: '  "text"', type: 'key' }, { text: ': ', type: 'text' }, { text: pick(texts), type: 'string' }],
        [{ text: '  "voice"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${voice}"`, type: 'string' }],
        [{ text: '  "platform"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${platform}"`, type: 'string' }],
        [{ text: '  "speed"', type: 'key' }, { text: ': ', type: 'text' }, { text: `${(0.8 + Math.random() * 0.7).toFixed(1)}`, type: 'text' }],
        [{ text: '}', type: 'bracket' }],
        [{ text: '───', type: 'divider' }],
        [{ text: `Edge ${region}`, type: 'label' }, { text: ' · auth OK', type: 'success' }],
        [{ text: `Voice: ${voice} (${lang})`, type: 'info' }],
        [{ text: `Platform optimized: ${platform}`, type: 'info' }],
        [{ text: `Synthesizing ${(duration / 1000).toFixed(1)}s audio`, type: 'dim' }],
        [{ text: 'TTS cache MISS · generating new audio', type: cached ? 'success' : 'dim' }],
        [{ text: `Response: ${lat}ms · audio_url valid 24h`, type: 'dim' }],
      ];
    },

    opticontext_analyze: () => {
      const fileTypes = ['report.pdf', 'main.py', 'schema.sql', 'audit.log', 'contract.docx', 'architecture.md', 'data.csv'];
      const file = pick(fileTypes);
      const model = pick(MODELS);
      return [
        [{ text: `→ ${ts()}`, type: 'dim' }, { text: ` ${rid}`, type: 'info' }],
        [{ text: 'MCP call   ', type: 'label' }, { text: 'tools/call', type: 'accent' }],
        [{ text: 'Tool       ', type: 'label' }, { text: tool, type: 'accent' }],
        [{ text: 'Arguments  ', type: 'label' }],
        [{ text: '{', type: 'bracket' }],
        [{ text: '  "file_id"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${rid.slice(-12)}"`, type: 'string' }],
        [{ text: '  "query"', type: 'key' }, { text: ': ', type: 'text' }, { text: '"Summarize key findings and flag anomalies"', type: 'string' }],
        [{ text: '  "model"', type: 'key' }, { text: ': ', type: 'text' }, { text: '"auto"', type: 'string' }],
        [{ text: '}', type: 'bracket' }],
        [{ text: '───', type: 'divider' }],
        [{ text: `Edge ${region}`, type: 'label' }, { text: ' · auth OK', type: 'success' }],
        [{ text: `File: ${file} (${(1 + Math.random() * 8).toFixed(1)}MB)`, type: 'info' }],
        [{ text: `Model routed → ${model} (2M ctx)`, type: 'info' }],
        [{ text: `Analyzing document · ${tok} tokens consumed`, type: 'dim' }],
        [{ text: `Response: ${lat}ms · file_id persisted`, type: 'dim' }],
      ];
    },

    opticontext_memory_write: () => {
      const namespaces = ['personal', 'projects', 'research', 'conversations', 'system', 'preferences'];
      const ns = pick(namespaces);
      const importance = Math.floor(Math.random() * 10) + 1;
      const chunks = Math.floor(Math.random() * 4) + 1;
      return [
        [{ text: `→ ${ts()}`, type: 'dim' }, { text: ` ${rid}`, type: 'info' }],
        [{ text: 'MCP call   ', type: 'label' }, { text: 'tools/call', type: 'accent' }],
        [{ text: 'Tool       ', type: 'label' }, { text: tool, type: 'accent' }],
        [{ text: 'Arguments  ', type: 'label' }],
        [{ text: '{', type: 'bracket' }],
        [{ text: '  "content"', type: 'key' }, { text: ': ', type: 'text' }, { text: '"User prefers concise responses with code examples."', type: 'string' }],
        [{ text: '  "namespace"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${ns}"`, type: 'string' }],
        [{ text: '  "importance"', type: 'key' }, { text: ': ', type: 'text' }, { text: `${importance}`, type: 'text' }],
        [{ text: '}', type: 'bracket' }],
        [{ text: '───', type: 'divider' }],
        [{ text: `Edge ${region}`, type: 'label' }, { text: ' · auth OK', type: 'success' }],
        [{ text: `Embedding (768d) · ${chunks} chunk${chunks > 1 ? 's' : ''} stored`, type: 'info' }],
        [{ text: `Namespace: ${ns} · importance: ${importance}/10`, type: 'dim' }],
        [{ text: `memory_id: mem_${rid.slice(-12)}`, type: 'accent' }],
        [{ text: `Response: ${lat}ms`, type: 'dim' }],
      ];
    },

    opticontext_memory_search: () => {
      const queries = [
        '"user preferences for code style"',
        '"previous project context about authentication"',
        '"what did we discuss about deployment"',
        '"user language preferences"',
        '"prior analysis results for security audit"',
      ];
      const ns = pick(['personal', 'projects', 'research', 'conversations', 'general']);
      return [
        [{ text: `→ ${ts()}`, type: 'dim' }, { text: ` ${rid}`, type: 'info' }],
        [{ text: 'MCP call   ', type: 'label' }, { text: 'tools/call', type: 'accent' }],
        [{ text: 'Tool       ', type: 'label' }, { text: tool, type: 'accent' }],
        [{ text: 'Arguments  ', type: 'label' }],
        [{ text: '{', type: 'bracket' }],
        [{ text: '  "query"', type: 'key' }, { text: ': ', type: 'text' }, { text: pick(queries), type: 'string' }],
        [{ text: '  "namespace"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${ns}"`, type: 'string' }],
        [{ text: '  "top_k"', type: 'key' }, { text: ': ', type: 'text' }, { text: `${Math.floor(Math.random() * 10) + 3}`, type: 'text' }],
        [{ text: '}', type: 'bracket' }],
        [{ text: '───', type: 'divider' }],
        [{ text: `Edge ${region}`, type: 'label' }, { text: ' · auth OK', type: 'success' }],
        [{ text: `Cosine similarity search · namespace: ${ns}`, type: 'info' }],
        [{ text: `Found ${Math.floor(Math.random() * 8) + 1} results (min_score: 0.7)`, type: 'info' }],
        [{ text: `Context block assembled (${tok} tokens)`, type: 'dim' }],
        [{ text: `Response: ${lat}ms`, type: 'dim' }],
      ];
    },

    opticontext_guide: () => {
      const topics = ['all', 'search', 'memory', 'voice', 'analyze', 'limits'];
      const topic = pick(topics);
      return [
        [{ text: `→ ${ts()}`, type: 'dim' }, { text: ` ${rid}`, type: 'info' }],
        [{ text: 'MCP call   ', type: 'label' }, { text: 'tools/call', type: 'accent' }],
        [{ text: 'Tool       ', type: 'label' }, { text: tool, type: 'accent' }],
        [{ text: 'Arguments  ', type: 'label' }],
        [{ text: '{', type: 'bracket' }],
        [{ text: '  "topic"', type: 'key' }, { text: ': ', type: 'text' }, { text: `"${topic}"`, type: 'string' }],
        [{ text: '}', type: 'bracket' }],
        [{ text: '───', type: 'divider' }],
        [{ text: `Edge ${region}`, type: 'label' }, { text: ' · auth OK', type: 'success' }],
        [{ text: `Generating guide for topic: ${topic}`, type: 'info' }],
        [{ text: `Capability manifest assembled (${tok} tokens)`, type: 'dim' }],
        [{ text: `Includes: schemas, limits, error codes, examples`, type: 'info' }],
        [{ text: `Response: ${lat}ms`, type: 'dim' }],
      ];
    },
  };

  return (scenarios[tool] || scenarios.opticontext_search)();
}

const COLORS: Record<string, string> = {
  dim: 'var(--code-muted)',
  accent: 'var(--code-accent)',
  string: 'var(--code-string)',
  key: 'var(--code-accent)',
  bracket: 'var(--code-muted)',
  text: 'var(--code-text)',
  label: 'var(--code-muted)',
  success: '#34D399',
  error: '#F87171',
  info: '#60A5FA',
  divider: 'var(--code-muted)',
  prompt: 'var(--code-accent)',
};

function renderLine(segments: Line[], idx: number): React.ReactNode {
  return (
    <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
      {segments.map((seg, si) => (
        <span key={si} style={{ color: COLORS[seg.type] || 'var(--code-text)' }}>
          {seg.text}
        </span>
      ))}
    </div>
  );
}

export function McpTerminal() {
  const [displayLines, setDisplayLines] = useState<(Line[] | null)[]>([]);
  const [liveIdx, setLiveIdx] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<Line[][]>([]);
  const [phase, setPhase] = useState<'idle' | 'streaming' | 'done'>('idle');
  const [typingIdx, setTypingIdx] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const scenarioRef = useRef<Line[][]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetScenario = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const scenario = generateScenario();
    scenarioRef.current = scenario;
    setCurrentScenario(scenario);
    setDisplayLines([]);
    setLiveIdx(0);
    setTypingIdx(0);
    setPhase('streaming');
  }, []);

  useEffect(() => {
    cursorRef.current = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => { if (cursorRef.current) clearInterval(cursorRef.current); };
  }, []);

  useEffect(() => {
    resetScenario();
    const switchInterval = setInterval(() => {
      resetScenario();
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(switchInterval);
  }, [resetScenario]);

  useEffect(() => {
    if (phase !== 'streaming' || typingIdx >= currentScenario.length) {
      if (typingIdx >= currentScenario.length && phase === 'streaming') {
        setPhase('done');
        setDisplayLines(currentScenario);
      }
      return;
    }

    const delays = [120, 180, 60, 200, 80, 150, 100, 250, 90, 140, 110, 170, 80, 200, 130];
    const delay = delays[typingIdx % delays.length];

    const t = setTimeout(() => {
      setDisplayLines(prev => [...prev, null]);
      const lineIdx = typingIdx;

      requestAnimationFrame(() => {
        setDisplayLines(prev => {
          const next = [...prev];
          next[lineIdx] = currentScenario[lineIdx];
          return next;
        });
      });

      setTypingIdx(prev => prev + 1);
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, delay);

    return () => clearTimeout(t);
  }, [phase, typingIdx, currentScenario]);

  const statusDot = phase === 'idle' ? 'var(--code-muted)' :
    phase === 'streaming' ? '#34D399' : 'var(--code-muted)';
  const statusLabel = phase === 'idle' ? 'idle' :
    phase === 'streaming' ? 'streaming' : 'connected';

  return (
    <div
      className="mcp-terminal"
      style={{
        background: 'var(--code-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 640,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        color: 'var(--code-text)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', opacity: 0.8 }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', opacity: 0.8 }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--code-muted)' }}>
            MCP Streamable HTTP — mcp.opticontext.dev
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusDot,
            boxShadow: phase === 'streaming' ? '0 0 4px #34D399' : 'none',
            transition: 'all 300ms',
          }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--code-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div
        ref={terminalRef}
        style={{
          padding: '14px 16px',
          maxHeight: 400,
          minHeight: 320,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {displayLines.map((line, idx) => {
          if (!line) return <div key={idx} style={{ height: '1.6em' }} />;
          return (
            <div
              key={idx}
              className="mcp-line"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0,
                opacity: 0,
                animation: 'fadeIn 200ms ease forwards',
              }}
            >
              {line.map((seg, si) => (
                <span key={si} style={{ color: COLORS[seg.type] || 'var(--code-text)', whiteSpace: seg.type === 'divider' ? 'pre' : 'pre-wrap' }}>
                  {seg.text}
                </span>
              ))}
            </div>
          );
        })}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          opacity: phase === 'streaming' ? 1 : 0,
          transition: 'opacity 200ms',
        }}>
          <span style={{ color: 'var(--code-accent)' }}>$</span>
          <span style={{
            width: 7, height: 14,
            background: showCursor ? 'var(--code-accent)' : 'transparent',
            marginLeft: 4,
            transition: 'background 100ms',
          }} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.1)',
          fontSize: '0.65rem',
          color: 'var(--code-muted)',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        <span>{requestId()}</span>
        <span>{pick(REGIONS)} · {pick(['streamable-http', 'sse'])}</span>
        <span>{latency()}ms</span>
      </div>
    </div>
  );
}
