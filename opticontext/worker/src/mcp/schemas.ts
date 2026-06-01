export const TOOL_SCHEMAS = [
  {
    name: "opticontext_search",
    description:
      "Web search with AI-powered summarization. Three search modes and Google-dork precision. Use for ANY question that requires current, external, or factual information. Best for: recent events, research, code discovery, security research, pricing lookups, and validating claims. The 'research' mode uses Tavily (deep, curated), 'fast' mode uses DuckDuckGo (instant, lightweight), 'scrape' mode uses Apify (full page scraping). When summarize=true (default), Cerebras AI distills raw results into clean, structured answers. Supports Google dorking for power searches: site-specific, file type, date range, exclusion filters. Use dork.search_in='code' for GitHub code search, 'security' for CVE lookups, 'pricing' for product costs. Call opticontext_guide with topic:'search' for operational patterns and mode selection guidance.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Natural language search query. Best results: be specific about what you need. Example: 'latest developments in GPT-5 2026', 'compare React 19 vs Svelte 5 performance benchmarks', 'CVE-2026-* critical vulnerabilities in nginx'. For dorked searches, keep the query as the core topic and use the 'dork' parameter for modifiers.",
        },
        mode: {
          type: "string",
          enum: ["auto", "research", "fast", "scrape"],
          default: "auto",
          description:
            "auto=smart routing (Tavily for depth, DDG for speed), research=Tavily deep search (best quality, costs credit), fast=DuckDuckGo instant (free, lower latency, no budget), scrape=Apify full-page scrape (extracts full page content, costs credit). Default is auto which intelligently routes.",
        },
        max_results: {
          type: "integer",
          default: 5,
          description:
            "Number of results to return (1-50). Higher values work best with summarize=true to filter noise.",
        },
        summarize: {
          type: "boolean",
          default: true,
          description:
            "When true, Cerebras AI filters and summarizes raw results into a coherent answer. When false, returns raw search results. Always keep true unless you need to inspect unfiltered results.",
        },
        dork: {
          type: "object",
          description:
            "Search query operators for precision searching. Use when you need site-restricted, file-type-filtered, or date-bounded results. Operators (site:, filetype:, intitle:, inurl:) are preserved as-is and sent to the search provider. Support varies by provider: DuckDuckGo supports most operators natively; Tavily's support is limited — results may degrade for complex dork queries. Use 'fast' mode for DDG-backed dork searches.",
          properties: {
            site_filter: { type: "string", description: "Restrict to a domain. Example: 'github.com', 'news.ycombinator.com', 'arxiv.org'" },
            file_type: { type: "string", description: "File type extension. Examples: 'pdf', 'md', 'py', 'json'" },
            date_after: { type: "string", format: "date", description: "Only results after this date (YYYY-MM-DD)" },
            date_before: { type: "string", format: "date", description: "Only results before this date (YYYY-MM-DD)" },
            exclude_terms: { type: "array", items: { type: "string" }, description: "Terms to exclude from results" },
            include_phrases: { type: "array", items: { type: "string" }, description: "Phrases that must appear in results" },
            search_in: { type: "string", enum: ["url", "title", "body"], description: "Where to search for the query terms" },
          },
        },
      },
      required: ["query"],
    },
  },
  {
    name: "opticontext_tts",
    description:
      "Text-to-speech using Unreal Speech (48 voices, 8 languages). Converts text to natural-sounding audio. Returns an audio URL or streaming chunks. Use when the user asks for spoken content, voice messages, audio responses, or when text needs to be delivered as speech for Telegram/Discord/WhatsApp platforms. Automatically preprocesses text: strips markdown code blocks, removes special formatting, normalizes whitespace. Text over 2,900 characters is automatically chunked into sequential segments. The 'platform' parameter optimizes audio bitrate for each target (Telegram=48k, Discord=128k, WhatsApp=48k, raw=192k). 48 voices available including: Scarlett (default, warm female US), Dan (deep male US), Will (neutral male US), Liv (bright female UK), Priya (soft female IN), Amy, Bella, Charlotte, Chloe, Emily, Emma, Grace, Hannah, Isabella, Jessica, Lily, Mia, Olivia, Sophie, Zoe, Amelia, Ava, Ella, Harper, Isla, Luna, Maya, Noah, Oliver, Liam, Ethan, Lucas, Mason, Logan, James, Benjamin, Elijah, Aiden, Carter, Henry. Call opticontext_guide with topic:'tts' for voice selection guidance and platform optimization tips.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "Text to convert to speech. Max 30,000 characters. Automatically strips markdown code blocks, headings, bold/italic markers, and normalizes whitespace before synthesis. Long text is chunked at sentence boundaries.",
        },
        voice: {
          type: "string",
          default: "Scarlett",
          description:
            "Voice ID. Popular options: Scarlett (warm female US, default), Dan (deep male US), Will (neutral male US), Liv (bright female UK), Priya (soft female IN), Amy, Bella, Charlotte, Chloe, Emily, Emma, Grace, Hannah, Isabella, Jessica, Lily, Mia, Olivia, Sophie, Zoe, Amelia, Ava, Ella, Harper, Isla, Luna, Maya, Noah, Oliver, Liam, Ethan, Lucas, Mason, Logan, James, Benjamin, Elijah, Aiden, Carter, Henry. Use names for emotional voice matching.",
        },
        speed: {
          type: "number",
          default: 1.0,
          minimum: 0.25,
          maximum: 4.0,
          description:
            "Speech speed multiplier. 0.5=half speed (slow, deliberate), 1.0=normal, 1.5=faster, 2.0=double speed (fast). Recommended range: 0.8-1.2 for natural speech.",
        },
        format: {
          type: "string",
          enum: ["mp3", "ogg", "wav", "aac", "flac"],
          default: "mp3",
          description:
            "Audio format. mp3=universal, ogg=good for Telegram, wav=uncompressed high quality, aac=Apple ecosystem, flac=lossless. Most agents should use default mp3.",
        },
        platform: {
          type: "string",
          enum: ["raw", "telegram", "discord", "whatsapp"],
          default: "raw",
          description:
            "Target platform optimizes bitrate: telegram=48k (file size limit), discord=128k (voice channel quality), whatsapp=48k, raw=192k (best quality). Set this to the target platform for optimal file sizes.",
        },
        stream: {
          type: "boolean",
          default: false,
          description:
            "When true, returns base64-encoded audio chunks in the response instead of an R2 audio URL. Each chunk contains the raw audio data. Useful when the agent needs to stream audio directly or the target platform requires inline data. Default false returns an HTTPS URL to the cached audio in R2.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "opticontext_analyze",
    description:
      "Deep file analysis using Google Gemini's 2M token context window. Analyze PDFs, images (JPG/PNG/WebP/GIF), code files (40+ languages), documents (DOCX/PPTX/XLSX/CSV), spreadsheets, audio files, video files, archive files (ZIP/TAR/GZ), and more. Accepts files via 4 methods: public URL (file_url — SSRF-protected, HTTPS only), base64 inline (file_b64, under 100MB, MIME-validated), pre-uploaded via /upload endpoint (upload_id, max 2GB), or re-analyze existing (file_id — files persist 30 days). Returns structured analysis with summary, key findings, and answer to query. Output formats: structured (JSON, default), summary_only (brief), markdown (readable). Optionally saves analysis to MemoryCore for future recall. Use for: extracting insights from documents, analyzing codebases, processing images, transcribing audio, summarizing PDFs, code review, and any file-based analysis task. Call opticontext_guide with topic:'analyze' for delivery method selection and model routing guidance.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Your analysis question or task for the file. Be specific about what you want extracted. Examples: 'Summarize this PDF in 3 bullet points', 'Find all API endpoints in this codebase', 'What are the key financial metrics in this spreadsheet?', 'Transcribe this audio file', 'Describe what this image shows in detail'.",
        },
        file_url: {
          type: "string",
          description:
            "Publicly accessible URL of the file to analyze. Best method for remote files. Accepts PDF, images, audio, video, code, and documents. Example: 'https://arxiv.org/pdf/2401.12345.pdf'",
        },
        file_b64: {
          type: "string",
          description:
            "Base64-encoded file content. Use for small files under 100MB. Best for inline file data the AI already has. Always provide mime_type when using this.",
        },
        upload_id: {
          type: "string",
          description:
            "File upload ID from a prior POST /upload call. Best for large files (>100MB). Upload via POST /upload first (returns upload_id), then reference it here.",
        },
        file_id: {
          type: "string",
          description:
            "File ID from a previous analysis. Use this to re-analyze a file you've already analyzed without re-uploading. File data is persisted for 30 days.",
        },
        mime_type: {
          type: "string",
          description:
            "MIME type of the file. Required for file_b64. Common types: application/pdf, image/png, image/jpeg, text/plain, text/markdown, application/json, text/x-python, text/javascript, audio/mpeg, video/mp4.",
        },
        model: {
          type: "string",
          enum: ["auto", "flash", "pro"],
          default: "auto",
          description:
            "auto=AI routes based on file size and complexity (recommended), flash=Gemini 2.5 Flash (fast, good for most files), pro=Gemini 1.5 Pro (best for complex/large files, 2M context window). Use flash for quick analysis, pro for deep document analysis.",
        },
        output_format: {
          type: "string",
          enum: ["structured", "summary_only", "markdown"],
          default: "structured",
          description:
            "structured=JSON with summary, key_findings, answer_to_query (default, best for AI consumption), summary_only=just the summary text, markdown=readable markdown with sections for summary, key findings, and answer.",
        },
        save_to_memory: {
          type: "boolean",
          default: false,
          description:
            "If true, saves this analysis into MemoryCore (vector memory) so the agent can recall it later via opticontext_memory_search. Use when analysis is important enough to persist across sessions.",
        },
        max_tokens: {
          type: "integer",
          default: 4096,
          maximum: 65536,
          description:
            "Maximum output tokens for the analysis. Larger values allow more detailed analysis. 4096 is good for most files, 16384+ for very large documents.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "opticontext_memory_write",
    description:
      "Store information in persistent vector memory for cross-session recall. Use this when you need to remember user preferences, project context, important facts, decisions, or any information that should be available in future conversations. Memories are stored as vector embeddings using Gemini embedding-2 for semantic search. Content over 8,000 characters is automatically summarized by Cerebras AI before storage. Use importance (1-10) to prioritize: 8+ for critical facts, 5-7 for important context, 1-4 for temporary notes. Use namespaces to organize: 'general' (default), 'user_prefs', 'project', 'notes', or custom namespaces. When writing project-specific context, include the project name in namespace. Each agent key has an isolated memory store — memories cannot leak across agents. Call opticontext_guide with topic:'memory' for namespace patterns and importance scoring guidance.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description:
            "The information to remember. Should be a clear, self-contained statement or fact. Best practice: write as complete sentences the agent would want to recall. Example: 'User prefers concise bullet-point responses', 'Project Acme runs on Next.js 15 with Prisma ORM and PostgreSQL', 'The deployment workflow requires CI approval from senior dev.' Max 100,000 characters.",
        },
        namespace: {
          type: "string",
          default: "general",
          description:
            "Logical group for organizing memories. Use for scoping search later. Examples: 'general' (cross-cutting knowledge), 'user_prefs' (user preferences), 'project' (project context), 'notes' (session notes). Search by namespace for faster retrieval.",
        },
        importance: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 5,
          description:
            "Priority score 1-10. 10=critical (company policies, auth credentials), 8-9=very important (user identity, project stack), 5-7=important (user preferences, decisions), 3-4=normal (session notes), 1-2=trivial (temporary context). Affects recall priority.",
        },
        source: {
          type: "string",
          description:
            "Source identifier for provenance tracking. Examples: 'user', 'deepdoc-analysis', 'search-results', 'conversation'.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "opticontext_memory_search",
    description:
      "Search persistent vector memory using semantic similarity. Use this to recall cross-session information stored via opticontext_memory_write. Finds memories by meaning, not just keywords. Returns results with similarity scores. Use namespace to scope your search to a specific category. Use top_k to control result count. Use min_similarity (0-1) to filter quality — 0.5 is a good default, 0.7+ for high-precision recall. Enable rerank to reorder results by relevance using Cerebras AI ranking. When searching, provide a query that matches how the memory was written. Example: if memory says 'User prefers dark mode', search 'what are the user display preferences'. Call opticontext_guide with topic:'memory' for retrieval strategy guidance.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Semantic search query. Should be what you want to find, phrased naturally. More specific queries yield better results. Examples: 'What are the user's preferences?', 'What tech stack does project Acme use?', 'What decisions were made about deployment?'",
        },
        namespace: {
          type: "string",
          default: "general",
          description:
            "Search within a specific logical group. Use the same namespace used during memory_write. Examples: 'general', 'user_prefs', 'project', 'notes'. Scoping to a namespace improves result relevance.",
        },
        top_k: {
          type: "integer",
          default: 5,
          description:
            "Number of results to return (1-100). Higher values for broader recall, lower for precise results.",
        },
        min_similarity: {
          type: "number",
          default: 0.5,
          description:
            "Minimum cosine similarity threshold 0-1. 0.3=broad recall (includes loosely related), 0.5=moderate (recommended default), 0.7=high precision (only strong matches), 0.9=exact matches only. Adjust based on how specific your query is.",
        },
        rerank: {
          type: "boolean",
          default: false,
          description:
            "When true, re-ranks results using Cerebras AI for better relevance ordering. Slightly increases latency but improves result quality. Recommended when top_k > 5.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "opticontext_guide",
    description:
      "CALL THIS FIRST. Returns the OptiContext capabilities guide — a compact protocol reference covering tool selection heuristics, parameter cheat sheets, constraints, error codes, and efficiency rules. Call once on first connect to self-orient. Re-call whenever tool behavior is unclear, parameters fail, or you need to refresh operational knowledge. Topic-scoped: use 'search', 'tts', 'analyze', 'memory', 'limits', 'errors', or 'best-practices' for targeted retrieval. Use 'all' for the full guide.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["all", "search", "tts", "analyze", "memory", "limits", "errors", "best-practices"],
          default: "all",
          description:
            "Guide topic. 'all' = full capabilities guide (recommended first call). 'search' = web search patterns. 'tts' = text-to-speech reference. 'analyze' = file analysis reference. 'memory' = persistent memory patterns. 'limits' = rate limits and constraints. 'errors' = error codes and recovery. 'best-practices' = routing heuristics and efficiency rules.",
        },
      },
    },
  },
];
