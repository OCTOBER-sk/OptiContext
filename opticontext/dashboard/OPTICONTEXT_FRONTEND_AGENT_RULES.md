# OptiContext — Frontend Agent Rules

Before making ANY change:
Read these files completely:

1. `docs/TERMINOLOGY.md` — Language contract (locked)
2. `docs/MICROCOPY.md` — Microcopy system (locked)
3. `docs/ERROR_TROUBLESHOOTING.md` — Error copy (locked)
4. `docs/API_REFERENCE.md` — API reference
5. `docs/archive/old-plans/OPTICONTEXT_FRONTEND_GUIDE.txt` — Design system spec ("Paper Precision")
6. `docs/archive/old-plans/OPTICONTEXT_PLAN.md` — Architecture rationale

These files are source-of-truth documents.
Phase docs (landing, docs home, quickstart, capability docs, API reference) are archived
at `docs/archive/deprecated-phases/` — the actual dashboard code supersedes them.

━━━━━━━━━━━━━━━━━━━━
CORE RULES
━━━━━━━━━━━━━━━━━━━━

DO NOT:
- redesign the frontend architecture
- change page hierarchy
- invent new pages
- invent new capabilities
- use generic SaaS UI
- create giant card grids
- add glassmorphism
- add neon AI aesthetics
- add random gradients
- add floating blob spam
- create "AI startup" layouts

DO:
- follow the editorial infrastructure aesthetic
- use asymmetrical layouts
- maintain calm spacing
- use restrained motion only
- prioritize typography hierarchy
- maintain runtime-neutral positioning
- keep layouts clean and infrastructural

━━━━━━━━━━━━━━━━━━━━
LAYOUT RULES
━━━━━━━━━━━━━━━━━━━━

The website should feel like:
- Stripe docs
- Linear
- Vercel
- Cloudflare docs
- modern editorial systems

NOT:
- crypto landing pages
- AI wrapper sites
- dashboard template clones

Avoid:
- excessive rounded rectangles
- stacked cards everywhere
- giant glowing borders
- over-segmented sections

━━━━━━━━━━━━━━━━━━━━
ANIMATION RULES
━━━━━━━━━━━━━━━━━━━━

Allowed:
- fade
- subtle translate
- opacity transitions
- soft hover movement
- smooth page transitions

Forbidden:
- bouncing
- floating blobs
- spinning effects
- excessive parallax
- heavy motion spam

━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY RULES
━━━━━━━━━━━━━━━━━━━━

Typography must feel:
- elegant
- editorial
- calm
- premium
- infrastructural

Avoid:
- robotic fonts
- overly geometric typography
- bulky UI font stacks

━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION RULES
━━━━━━━━━━━━━━━━━━━━

Before implementing:
- analyze the relevant phase file
- create a short implementation plan
- identify reusable components
- preserve responsiveness
- preserve accessibility
- preserve layout consistency

Never:
- rewrite unrelated sections
- modify stable sections unnecessarily
- refactor entire files without request

Always:
- work incrementally
- maintain structure consistency
- preserve spacing rhythm
- preserve terminology consistency

━━━━━━━━━━━━━━━━━━━━
CONTENT RULES
━━━━━━━━━━━━━━━━━━━━

Use ONLY:
- approved terminology
- approved capability names
- approved runtime names
- approved endpoint formats

Do NOT:
- invent placeholder copy
- invent fake schemas
- invent unsupported runtime claims
- use "AI tools" wording
- use plugin language

━━━━━━━━━━━━━━━━━━━━
FINAL OUTPUT STANDARD
━━━━━━━━━━━━━━━━━━━━

Everything should feel:
- production-grade
- infrastructural
- protocol-native
- calm
- technically grounded
- implementation-ready
