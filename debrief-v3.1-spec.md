# Debrief — Product Specification

**Version 3.1 | LightBlue Developments**

This document replaces v3.0 as the working build specification for MVP. Sections marked **[MVP]** are in scope for the initial build. Sections marked **[Phase 2]** are defined for future development and must not be built now.

---

## 1. Product Overview

Debrief is a web-based tool that reads a GitHub repository and automatically generates four role-based views of the codebase. It is built for developers who used AI tools or agents to build software and now need a reliable way to understand, navigate, and explain what was built.

**Tagline:** *Understand the code you built.*

---

## 2. Product Principles [MVP]

These principles govern implementation decisions.

### 2.1 Professional but Low Friction

Debrief must be useful to experienced developers while remaining approachable for new-to-mid level coders. "User friendly" means:

- clear defaults
- predictable behavior
- actionable errors
- low setup friction
- no unnecessary jargon in the UI

It does **not** mean reducing technical accuracy.

### 2.2 BYOK Only

Debrief is a **bring-your-own-key** product.

- Users provide their own AI provider API key
- The selected provider bills the user directly
- Debrief does not provide shared inference credits
- Debrief does not absorb, subsidize, or resell token usage

### 2.3 Public Repos First

MVP is optimized for public GitHub repositories. GitHub authentication improves rate limits and access reliability but is not required for public-repo analysis.

### 2.4 Backend-Owned AI Execution

All AI calls must run on the backend through a provider abstraction layer. The frontend must never call model APIs directly.

---

## 3. Core User Flow [MVP]

- User lands on the Debrief homepage
- User may optionally click **Connect GitHub**
- User enters **Settings** and configures AI provider, model, and API key
- User pastes a supported GitHub repository URL
- User clicks **Debrief This Repo**
- System validates Settings and resolves the exact repository target
- System runs ingestion and cleaning deterministically with no AI
- System creates a deterministic repository metadata manifest
- System checks model-aware token budgets before any AI call
- System generates a canonical system JSON summary of the codebase (AI Stage 1)
- System uses that canonical JSON, plus deterministic metadata where allowed, to generate the four views (AI Stage 2)
- Results render progressively as each tab completes
- User may download a PDF containing all completed views

---

## 4. Business Model and AI Usage [MVP]

### 4.1 Billing Model

Debrief is BYOK-only.

- Analysis cannot run until a provider, model, and API key are configured
- The UI must clearly state that token usage is billed by the selected provider
- Debrief must not imply that inference is included

### 4.2 Key Handling

- API keys are submitted to the backend over HTTPS only
- API keys are stored in server-side session memory only
- API keys are never written to a database, file, log, analytics tool, or local storage
- API keys are never returned in API responses
- API keys are cleared when the session ends

### 4.3 Frontend Rule

The frontend may know whether a provider is configured for the current session, but it must never persist or display the raw key after submission.

---

## 5. Tech Stack [MVP]

| **Layer** | **Technology** |
| --- | --- |
| Frontend | React |
| Backend | Node.js |
| AI Model Access | BYOK via Anthropic, Google Gemini, or OpenRouter |
| Diagrams | Mermaid.js |
| Authentication | GitHub OAuth (optional for public repos) |
| Deployment | Provider-agnostic (for example Vercel, Railway, Render, or Cloud Run) |

---

## 6. Repository Access [MVP]

### 6.1 Supported GitHub URL Formats

Debrief must support both:

- Root repository URLs: `https://github.com/{owner}/{repo}`
- Subdirectory URLs: `https://github.com/{owner}/{repo}/tree/{ref}/{path}`

Optional `.git` suffixes and trailing slashes should be tolerated.

### 6.2 Exact Target Resolution

Debrief must analyze the exact target represented by the submitted URL.

- If the URL includes `tree/{ref}/{path}`, analyze that exact ref and subdirectory
- If the URL is a root repository URL, analyze the default branch HEAD

This behavior must be explained in the UI and remain consistent across retries and exports.

### 6.3 Public Repository Access

Public repositories must be analyzable without GitHub OAuth.

### 6.4 Optional GitHub OAuth

GitHub OAuth is optional in MVP and exists to:

- improve GitHub API rate limits
- improve reliability for larger public repositories
- show GitHub username and avatar as a convenience

For public information, no elevated repository scope should be requested beyond what is needed for OAuth app identity and public read access.

### 6.5 Private Repositories

Private repositories are explicitly out of scope for MVP.

---

## 7. AI Provider Support [MVP]

### 7.1 Supported Providers

Debrief supports:

- Anthropic
- Google Gemini
- OpenRouter

### 7.2 Provider Model Registry

The backend must maintain a provider model registry that stores:

- display name
- API model ID
- provider name
- context window
- whether the model is recommended
- whether custom IDs are allowed

The registry is a server-side configuration artifact. The implementation must use current official model IDs at build time rather than hard-coding stale IDs into the product specification.

### 7.3 MVP Model Selection UX

The Settings screen must present:

- a curated model list for Anthropic
- a curated model list for Gemini
- a curated model list for OpenRouter
- a custom model ID field for OpenRouter only

Recommended defaults:

- Anthropic: Sonnet-tier model
- Gemini: 2.5 Flash or 2.5 Pro
- OpenRouter: one sensible default plus custom entry

### 7.4 Provider Abstraction Layer

The backend must implement a single provider abstraction so all AI stages call one internal interface regardless of provider.

The abstraction is responsible for:

- routing to the correct provider endpoint
- formatting provider-specific request payloads
- normalizing responses into a consistent internal format
- mapping provider-specific failures to Debrief error states
- exposing model metadata such as context limits

No pipeline stage outside this abstraction may contain provider-specific logic.

### 7.5 Server-Side AI Only

All AI generation must occur on the backend. The browser must not import provider SDKs or hold callable provider clients.

---

## 8. Context Budgeting [MVP]

### 8.1 General Rule

Debrief must not treat a model's published context window as fully usable payload space. Each stage must reserve headroom for:

- system instructions
- serialized input structure
- output tokens
- provider overhead

### 8.2 Safe Budget Policy

Use the following default planning budgets:

- Stage 3 canonical synthesis input budget: **70%** of the selected model's input window
- Stage 4 Executive, Architect, and Auditor input budgets: **60%** of the selected model's input window
- Stage 4 Engineer input budget: **50%** of the selected model's input window

These numbers are planning defaults and may be refined in implementation if the behavior remains conservative.

### 8.3 Budget Enforcement

- Budget checks must happen on the backend before model calls
- Size evaluation must use token estimation, not character count alone
- If a request exceeds budget, Debrief must fail fast with the size error from Section 17

### 8.4 Engineer View Selection Rule

The Engineer view must not receive the full cleaned repository by default. It receives a selected subset of raw files capped by budget using the heuristics in Section 12.5.

---

## 9. Visual Design [MVP]

**Mode:** Dark  
**Background:** Near-black (`#0D0D0D`)  
**Typography:** Clean white, generous line height  
**Accent color:** Copper / rose gold (LightBlue Developments brand)  
**Overall feel:** Premium, minimal, confident

**Architect blueprint panel:**

- deep navy background
- white and light-blue lines and labels
- rendered via Mermaid.js inside a styled container

The UI should feel elegant and guided, not toy-like and not cluttered.

---

## 10. Screens [MVP]

### Screen 1 — Landing Page

**Purpose:** First impression. Clean, confident, minimal.

**Elements:**

- Product name: **Debrief**
- Tagline: *Understand the code you built*
- Primary CTA: **Start with a Public Repo**
- Secondary CTA: **Connect GitHub**

**Design note:** GitHub connection is offered, not required.

### Screen 2 — Settings / Configuration

**Purpose:** Configure the AI provider, model, and API key required for analysis.

**Elements:**

- Heading: *Configure your AI model*
- Provider selector: `Anthropic · Google Gemini · OpenRouter`
- Model selector populated from the selected provider's curated list
- OpenRouter custom model toggle and text input
- API key password field with reveal toggle
- Provider-specific helper link: *Get an API key ->*
- Plain-language note: *Your provider bills usage directly. Debrief does not store your key.*
- Save button

**Rules:**

- Analysis cannot start until Settings are complete
- The app may remember the chosen provider and model for the session
- The raw key must never be persisted in browser storage

### Screen 3 — Repository Input

**Purpose:** Start an analysis from a supported GitHub URL.

**Elements:**

- Heading: *Paste your repository URL*
- Input field for GitHub URL
- CTA button: **Debrief This Repo**
- Helper text: *Public repositories only for MVP.*
- Helper text: *You can paste a full repo URL or a specific subdirectory URL.*
- Active provider/model badge with link to Settings
- Subtle GitHub auth state in the corner if connected

### Screen 4 — Loading / Generating

**Purpose:** Make progress understandable and alive.

**Elements:**

- animated staged progress bar
- sequential status messages tied to real stage boundaries

Recommended message set:

- *Resolving repository target...*
- *Reading repository snapshot...*
- *Cleaning and budgeting source files...*
- *Building system understanding...*
- *Writing your Executive view...*
- *Mapping your architecture...*
- *Teaching your Engineer view...*
- *Running your Audit...*

Each view begins rendering as soon as it completes.

### Screen 5 — Results

**Purpose:** The main product experience.

**Elements:**

- four tabs: **Executive · Architect · Engineer · Auditor**
- active tab highlighted with the brand accent
- tabs with completed views are fully usable
- tabs still generating show a subtle loading state
- **Download PDF** button visible once at least one view is complete
- repository target shown subtly at the top
- active provider/model shown subtly
- per-tab **Retry** button when that tab fails

### Screen 6 — Error Recovery

Errors are always inline, never modal. Every major error must include a clear next step where possible.

---

## 11. Execution Pipeline [MVP]

The pipeline has five stages. Only Stages 3 and 4 use the AI provider.

```
[1] Target Resolution + Snapshot -> [2] Cleaning + Metadata Manifest -> [3] Canonical System JSON -> [4] View Generation x4 Parallel -> [5] UI Render + Export
```

### Stage 1 — Target Resolution and Snapshot (Deterministic, No AI)

**Input:** GitHub repository URL  
**Output:** Exact repository target and raw repository snapshot

Responsibilities:

- validate the submitted GitHub URL
- resolve owner, repo, ref, and optional path
- resolve default branch when needed
- capture commit SHA for the analyzed snapshot
- fetch repository contents for the exact target

### Stage 2 — Cleaning and Metadata Manifest (Deterministic, No AI)

**Input:** Raw repository snapshot  
**Output:** Clean source payload plus deterministic metadata manifest

Responsibilities:

- apply inclusion and exclusion rules from Section 14
- preserve full relative file paths
- detect file languages
- estimate per-file tokens
- build a compact folder tree
- summarize framework and manifest evidence deterministically
- record config and test presence
- enforce model-aware size budgets before AI stages

**Deterministic metadata manifest schema:**

```json
{
  "repo": {
    "owner": "",
    "name": "",
    "url": "",
    "ref": "",
    "subpath": "",
    "commit_sha": ""
  },
  "stats": {
    "file_count": 0,
    "estimated_tokens": 0,
    "languages": []
  },
  "folder_tree": [],
  "manifests": [],
  "config_files": [],
  "test_files": [],
  "entrypoint_candidates": []
}
```

This manifest is deterministic and non-AI. It is supplemental context, not a replacement for the canonical JSON.

### Stage 3 — Canonical System JSON (AI Stage 1)

**Input:** Clean source payload + deterministic metadata manifest  
**Output:** Single structured canonical JSON representing the system

This is the primary AI synthesis stage. The output becomes the shared system understanding for all Stage 4 views.

**Rules:**

- if Stage 3 fails, retry automatically once
- do not proceed to Stage 4 if the canonical JSON is empty, malformed, or schema-invalid
- canonical JSON is an internal pipeline artifact and is not shown directly in the UI

### Stage 4 — View Generation (AI Stage 2 — Parallel)

**Input:** Canonical system JSON, with deterministic metadata where allowed  
**Output:** Four rendered views

All four views generate independently and may fail independently.

**View input rules:**

- Executive: canonical JSON only
- Architect: canonical JSON + deterministic metadata manifest
- Engineer: canonical JSON + deterministic metadata manifest + selected raw source files
- Auditor: canonical JSON + deterministic metadata manifest

**Important:** The Engineer view is the only tab that receives raw source code.

### Stage 5 — UI Render and Export

- render each tab as soon as it completes
- keep partial results visible even if another tab fails
- enable PDF export once at least one view is complete

---

## 12. Canonical System JSON [MVP]

### 12.1 Purpose

The canonical JSON is the single AI-generated system model used to keep the views internally consistent.

### 12.2 Schema

```json
{
  "project_name": "",
  "purpose": "",
  "architecture_style": "",
  "main_languages": [],
  "frameworks": [],
  "entry_points": [],
  "modules": [
    {
      "name": "",
      "responsibility": "",
      "key_files": [],
      "interactions": []
    }
  ],
  "folder_structure": [],
  "data_flow": [],
  "external_services": [],
  "key_dependencies": [],
  "config_files": [],
  "test_footprint": "",
  "key_patterns": [],
  "risks": [],
  "unknowns": []
}
```

### 12.3 Field Intent

- `frameworks`: application frameworks or major platform libraries supported by source evidence
- `entry_points`: startup files, request handlers, jobs, scripts, or UI bootstraps that begin execution
- `folder_structure`: concise explanations of important directories and why they matter
- `key_dependencies`: major libraries or services that materially shape the architecture
- `test_footprint`: current state of testing presence and coverage shape, if inferable
- `unknowns`: areas where the source does not support a confident conclusion

### 12.4 Quality Rules

- no empty fields unless genuinely unknown
- no speculative features
- no contradictions between modules and data flow
- risks must be actionable and specific

### 12.5 Engineer File Selection Heuristic

To assemble the Engineer view input, the backend should prioritize:

- entry points
- files named in canonical JSON `key_files`
- root manifests and config files
- files directly adjacent to core modules
- files that define routing, data models, or business logic

Stop adding files when the Engineer view budget is reached.

---

## 13. The Four Views [MVP]

### 13.1 Executive View

**Audience:** The project owner explaining the project to a collaborator, investor, advisor, or teammate.  
**Input:** Canonical JSON only  
**Format:** Structured one-pager. No code. No file names.

**Sections:**

- Project Identity
- The Problem It Solves
- Who It's For
- What It Does — Feature by Feature
- Current State
- Notable Decisions

### 13.2 Architect View

**Audience:** The project owner navigating, modifying, or extending the codebase.  
**Input:** Canonical JSON + deterministic metadata manifest  
**Format:** Blueprint-style system map + structured explanation.

**Sections:**

- System Map
- Folder and File Structure
- Entry Points
- Dependency Map
- Data Flow

### 13.3 Engineer View

**Audience:** The project owner learning the codebase in practical terms.  
**Input:** Canonical JSON + deterministic metadata manifest + selected raw source files  
**Format:** Code explanation + contextual pattern callouts + flow diagrams.

**Sections:**

- What This Code Does
- Key Logic Flows
- Patterns and Techniques — In Context

### 13.4 Auditor View

**Audience:** The project owner who wants to know what needs attention.  
**Input:** Canonical JSON + deterministic metadata manifest  
**Format:** Health assessment with prioritized recommendations.

**Sections:**

- Overall Health
- Gaps
- Risks
- Technical Debt
- Recommendations

---

## 14. Ingestion and Cleaning Rules [MVP]

### 14.1 Always Exclude

**Dependency and lock files:**

- `node_modules/`
- `package-lock.json`
- `yarn.lock`
- `pnpm-lock.yaml`
- `bun.lockb`

**Build artifacts:**

- `dist/`
- `build/`
- `.next/`
- `out/`
- `.turbo/`
- `coverage/`

**Environment and secrets:**

- `.env`
- `.env.local`
- `.env.production`
- `.env.*`

**Version control internals:**

- `.git/`

**System files:**

- `.DS_Store`
- `Thumbs.db`

**Binary and non-code assets:**

- common image, font, audio, video, archive, and compiled binary formats

### 14.2 `.gitignore` Policy

Debrief must read the repository `.gitignore` if present, but `.gitignore` must not blindly remove source files that are actually present in the analyzed snapshot and look materially relevant.

Implementation rule:

- always apply the explicit exclusion list above
- apply `.gitignore` patterns conservatively
- if a file is present in the analyzed Git snapshot and looks like source, config, manifest, or documentation needed for system understanding, keep it unless it matches an explicit exclusion rule

This avoids confusing "the file exists in the repo but Debrief ignored it" behavior.

### 14.3 Preserve Paths

All included files must retain their full relative paths from the analyzed target root. Structural context is required for architecture reasoning.

### 14.4 Size Handling

The enforced limit is applied after cleaning and token estimation, not on raw repository byte size alone.

---

## 15. GitHub OAuth [MVP]

### 15.1 OAuth Role

GitHub OAuth is optional in MVP.

Use it to:

- raise public API rate limits
- improve reliability
- show connected-user context in the UI

### 15.2 Storage Rules

- GitHub access tokens are stored in server-side session memory only
- GitHub access tokens are never written to browser local storage
- GitHub access tokens are never exposed to the frontend as raw values
- GitHub access tokens are cleared when the session ends

### 15.3 UX Rule

If unauthenticated access hits GitHub rate limits, Debrief should prompt the user to connect GitHub and retry.

---

## 16. PDF Export [MVP]

**Trigger:** Download PDF button appears once at least one view is complete  
**Contents:** All views completed at the time of export  
**Format:** Clean and readable for sharing  
**Filename:** `debrief-[repo-name]-[date].pdf`

If not all views are complete, the PDF should include a small note indicating that it contains partial results.

---

## 17. Error States [MVP]

| **Scenario** | **Message** |
| --- | --- |
| Invalid or inaccessible URL | *"We couldn't access this repository. Check that the URL is correct and that the repository is public."* |
| Unsupported GitHub URL shape | *"That GitHub link isn't supported yet. Use a repo URL or a repo subdirectory URL."* |
| Repo too large after cleaning and budgeting | *"This repository is too large for the selected model. Try a model with a larger context window, or point Debrief at a specific subdirectory URL."* |
| Missing AI configuration | *"No AI model is configured. Go to Settings to choose a provider, model, and API key before running an analysis."* |
| Invalid API key | *"Your API key was rejected by [Provider]. Check the key in Settings and try again."* |
| Provider rate limit reached | *"[Provider] is limiting requests right now. Wait a moment and try again, or switch to another provider or model."* |
| GitHub OAuth failure | *"GitHub connection failed. Please try connecting again."* |
| GitHub rate limit unauthenticated | *"GitHub is limiting unauthenticated requests right now. Connect GitHub and try again."* |
| Canonical JSON generation failure | *"We had trouble understanding this repository. Try again in a moment."* |
| Single view failure | Retry button shown on that tab only |
| All views failed | *"Something went wrong while generating your Debrief. Try again in a moment."* |
| Mermaid render failure | Show the written section, replace the diagram block with an inline diagram failure notice, and keep Retry available |

All error messages are inline. No modals. No raw provider error dumps.

---

## 18. Retry Strategy [MVP]

| **Stage** | **On Failure** |
| --- | --- |
| Stage 1 — Target Resolution and Snapshot | Surface GitHub or URL error |
| Stage 2 — Cleaning and Metadata Manifest | Surface size or repository-format error |
| Stage 3 — Canonical JSON | Retry automatically once, then surface error |
| Stage 4 — Single View | Show Retry button on that tab only |
| Stage 4 — All Views Failed | Surface general error and offer full retry |

**Retry semantics:**

- tab retry reruns only that tab's Stage 4 generation using the existing canonical JSON
- full retry reruns the pipeline from Stage 1

---

## 19. Security and Privacy [MVP]

- no raw provider API keys in browser storage
- no raw GitHub tokens in browser storage
- no AI prompts or repository contents written to logs unless explicitly redacted and safe
- no persistent user accounts or saved history in MVP
- no private repository support in MVP

---

## 20. MVP Scope Boundaries

**In scope for MVP:**

- web UI only
- public GitHub repository analysis
- optional GitHub OAuth for public repo access improvements
- Settings screen with provider selector, model selector, and BYOK API key input
- backend provider abstraction for Anthropic, Gemini, and OpenRouter
- deterministic metadata manifest
- canonical system JSON as shared AI system understanding
- four auto-generated views with parallel generation and independent retry
- partial-results rendering
- Mermaid diagrams in Architect and Engineer views
- PDF export
- subdirectory URL support
- exact ref/path analysis from submitted URL
- server-side token budgeting and model-aware size checks

**Explicitly out of scope for MVP — see Phase 2:**

- private repository support
- provider-paid inference
- caching by commit hash
- file-level summarization as a separate AI stage
- confidence scoring
- prompt injection sanitization
- CLI version
- IDE plugin
- real-time sync
- multi-repository analysis
- saved history or user accounts
- sharing links
- team features

---

## 21. Phase 2 Roadmap

### Phase 2A — Reliability and Performance

- caching by `repo_target + commit_sha + model`
- file-level summarization stage for oversized repositories
- confidence scoring on canonical JSON quality

### Phase 2B — Access and Security

- private repository support
- prompt injection detection and neutralization
- stronger encrypted session storage strategy if needed

### Phase 2C — Product Expansion

- shareable read-only links
- saved history
- team workspaces

---

## 22. Repository

**Organization:** LightBlue Developments (GitHub: `lightbluedev`)  
**Target repo name:** `repo-debrief`  
**License:** MIT

The README should tell a clear story: Debrief exists because developers who built with AI still need to understand, explain, and maintain what they built.

---

## Appendix A — Canonical Synthesis Prompt [MVP]

This prompt is for Stage 3. It may be adapted to provider formatting, but its content intent must remain intact.

---

You are a senior software architect and systems analyst.

Your task is to reconstruct a coherent, high-level understanding of a codebase based ONLY on the repository evidence provided.

You must produce a SINGLE, CONSISTENT system-level representation of the project.

INPUT

You are given:

1. A deterministic repository metadata manifest
2. A cleaned set of source files with full relative paths

GOAL

Synthesize these into a unified system model that captures:

- what the system does
- how it is structured
- where execution begins
- how components interact
- how data moves through the system
- what important dependencies, patterns, and risks exist
- what remains genuinely uncertain

HARD RULES

- DO NOT invent functionality not supported by the provided evidence
- DO NOT speculate beyond reasonable architectural inference
- USE THE SOURCE FILES AS THE PRIMARY EVIDENCE
- USE THE METADATA MANIFEST AS SUPPLEMENTAL DETERMINISTIC CONTEXT
- RESOLVE conflicts by choosing the most consistent interpretation
- OUTPUT MUST BE VALID JSON ONLY
- NO markdown
- NO commentary
- NO code fences
- BE CONCISE BUT COMPLETE

OUTPUT SCHEMA

```json
{
  "project_name": "string",
  "purpose": "string",
  "architecture_style": "string",
  "main_languages": ["string"],
  "frameworks": ["string"],
  "entry_points": ["string"],
  "modules": [
    {
      "name": "string",
      "responsibility": "string",
      "key_files": ["string"],
      "interactions": ["string"]
    }
  ],
  "folder_structure": ["string"],
  "data_flow": ["string"],
  "external_services": ["string"],
  "key_dependencies": ["string"],
  "config_files": ["string"],
  "test_footprint": "string",
  "key_patterns": ["string"],
  "risks": ["string"],
  "unknowns": ["string"]
}
```

FIELD GUIDANCE

`project_name` — infer from naming or source evidence. If unclear, use a descriptive placeholder.

`purpose` — explain what the system does and why it exists in 2 to 3 sentences.

`architecture_style` — choose the closest fit such as monolith, modular monolith, client-server, event-driven, microservices, static site, background worker, or unknown.

`frameworks` — include only frameworks or major platform libraries with evidence in the source.

`entry_points` — include real startup files, route handlers, app bootstraps, scripts, or jobs that begin execution.

`modules` — group files into meaningful responsibility boundaries rather than folder dumps.

`folder_structure` — explain the important top-level or major directories and why they matter.

`data_flow` — describe how information moves from inputs to processing to outputs.

`external_services` — include APIs, databases, storage systems, or third-party platforms only if evidenced.

`key_dependencies` — list major libraries or infrastructure choices that materially shape the system.

`test_footprint` — summarize the state of tests if inferable from the evidence.

`key_patterns` — include architectural or implementation patterns only when supported by evidence.

`risks` — every risk must be concrete and actionable.

`unknowns` — call out genuine blind spots where the evidence is insufficient.

FINAL CHECK

Before returning:

- ensure modules align with purpose
- ensure data flow matches modules and entry points
- ensure no field is empty unless truly unknown
- ensure risks are specific
- ensure output is valid JSON with no surrounding text

Now produce the JSON.

---

## Appendix B — Non-Negotiable MVP Rules

- Debrief is BYOK-only
- public repos must work without GitHub OAuth
- all AI calls run on the backend
- no raw provider keys in browser storage
- no raw GitHub tokens in browser storage
- root repo URLs and subdirectory URLs are both supported
- exact submitted ref/path must be analyzed when present
- token budgeting happens before model calls
- Engineer view receives selected raw files, not the whole repo

---

*Specification v3.1 complete.*  
*Build only what is marked [MVP]. Everything else is Phase 2.*
