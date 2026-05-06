# Debrief v3.1 — Implementation Plan

This plan turns the v3.1 specification into a milestone-based build sequence. The goal is to reach a reliable MVP with the least rework by solving architecture, security, and pipeline risks early.

---

## 1. Delivery Strategy

Build Debrief in vertical slices, but in this order:

1. foundations and architecture
2. session, settings, and repository targeting
3. deterministic ingestion and budgeting
4. provider abstraction and AI pipeline
5. results rendering and retry behavior
6. export, polish, and hardening

This sequencing matters because the biggest failure modes are:

- leaking keys or GitHub tokens into the browser
- building frontend AI flows that must later be moved server-side
- under-specifying repository targeting and subdirectory analysis
- letting token-budget failures appear late in the pipeline

---

## 2. Workstreams

The implementation breaks into six workstreams:

### A. App Shell and UX

- landing page
- settings screen
- repository input
- progress states
- results tabs
- error presentation

### B. Session and Security

- server-side session management
- provider key session storage
- optional GitHub OAuth
- no browser persistence of raw secrets

### C. Repository Access and Cleaning

- GitHub URL parsing
- exact target resolution
- public repo fetch path
- cleaning rules
- `.gitignore` policy
- deterministic metadata manifest
- token estimation

### D. AI Provider Layer

- provider registry
- provider abstraction
- provider request adapters
- error normalization
- model metadata and budget checks

### E. Generation Pipeline

- Stage 3 canonical JSON generation
- Stage 4 per-view generation
- Engineer file selection heuristic
- retry semantics
- partial-results rendering

### F. Export and Hardening

- PDF export
- Mermaid degradation behavior
- telemetry-safe logging
- production checks

---

## 3. Milestones

## Milestone 0 — Project Reset and Technical Foundation

**Goal:** Start from a clean architecture that matches v3.1 instead of patching the old prototype.

**Deliverables**

- new repository or clean application structure
- frontend and backend boundaries defined
- shared TypeScript types for pipeline payloads
- environment variable strategy documented
- server-side session setup in place
- basic visual shell using the Debrief design direction

**Implementation tasks**

- scaffold the React frontend and Node backend
- choose a folder structure that separates UI, server routes, pipeline logic, provider adapters, and shared types
- add linting, typechecking, and formatting
- define shared schemas for:
  - settings session state
  - repository target
  - metadata manifest
  - canonical JSON
  - per-view result state
- remove any direct frontend dependency on model SDKs

**Acceptance criteria**

- app boots locally
- frontend cannot directly call providers
- backend can serve the app and API routes
- secrets are server-only by design

**Why first**

This milestone prevents us from rebuilding the old mistakes into the new codebase.

---

## Milestone 1 — Session, Settings, and Basic User Flow

**Goal:** Make the app usable up to the point of starting analysis, with correct secret handling.

**Deliverables**

- landing page
- settings screen
- provider selector
- model selector
- OpenRouter custom model input
- API key submission flow to backend session
- repository input screen
- protected “analysis requires settings” rule

**Implementation tasks**

- build Settings UI and validation
- create session-backed endpoints:
  - save provider settings
  - read non-secret session config state
  - clear provider settings
- ensure the frontend only knows:
  - selected provider
  - selected model
  - whether an API key is configured
- create repository input flow
- wire inline errors for missing settings

**Acceptance criteria**

- user can configure provider, model, and API key
- raw API key never appears in browser storage
- analysis CTA is blocked until AI settings are configured
- session survives navigation within the active session

**Notes**

This is the first checkpoint where the app feels real to a user.

---

## Milestone 2 — Optional GitHub OAuth and Repository Target Resolution

**Goal:** Support public repo analysis without OAuth, while allowing OAuth as a reliability upgrade.

**Deliverables**

- optional GitHub connection flow
- connected-user display state
- unauthenticated public repo path
- exact repository target parser
- support for root repo URLs and subdirectory URLs

**Implementation tasks**

- implement GitHub URL parser for:
  - `owner/repo`
  - `owner/repo/tree/ref/path`
- build target resolution service
- resolve default branch when needed
- capture commit SHA for the analyzed snapshot
- implement optional OAuth flow
- keep GitHub token server-side only
- handle unauthenticated GitHub rate-limit response with guidance to connect GitHub

**Acceptance criteria**

- public root repo URL works without OAuth
- public subdirectory URL resolves correctly
- exact ref and path are preserved through analysis
- GitHub token is never stored in browser storage

**Why this milestone matters**

Repository targeting changes almost every downstream assumption, so we want it stable before building the pipeline.

---

## Milestone 3 — Deterministic Ingestion, Cleaning, and Budgeting

**Goal:** Build the non-AI foundation that everything else depends on.

**Deliverables**

- repository snapshot fetcher
- cleaning pipeline
- language detection
- `.gitignore` conservative handling
- deterministic metadata manifest
- token estimation and stage budgeting
- oversize failure path

**Implementation tasks**

- fetch repository contents for the resolved target
- preserve relative paths from the target root
- implement explicit exclusion rules
- implement conservative `.gitignore` behavior
- classify files by language
- estimate tokens per file and in aggregate
- build metadata manifest:
  - repo identity
  - commit SHA
  - file count
  - estimated tokens
  - languages
  - folder tree
  - manifests
  - config files
  - test files
  - entrypoint candidates
- enforce safe model budgets before AI calls

**Acceptance criteria**

- a resolved repo target produces a clean source payload and metadata manifest
- oversized payloads fail before AI generation
- subdirectory analyses only include the intended scope
- output is deterministic for the same repo target

**Testing focus**

- URL parsing edge cases
- cleaning against fixture repos
- `.gitignore` behavior on committed but ignored-looking files
- budget checks across different model windows

---

## Milestone 4 — Provider Registry and Abstraction Layer

**Goal:** Make provider choice a backend concern instead of leaking it into product logic.

**Deliverables**

- provider model registry
- Anthropic adapter
- Gemini adapter
- OpenRouter adapter
- normalized internal generation interface
- normalized provider error mapping

**Implementation tasks**

- define the provider registry schema
- store model metadata server-side
- add runtime validation for OpenRouter custom model IDs where possible
- implement a single internal generation method with:
  - model lookup
  - request shaping
  - timeout handling
  - retry support where appropriate
  - normalized text or structured response extraction
- map provider errors into app-level errors:
  - invalid key
  - rate limit
  - model not found
  - unsupported response

**Acceptance criteria**

- the same internal call path can hit any supported provider
- model IDs are not hardcoded in UI logic
- provider-specific errors surface as Debrief errors
- no view-generation code contains provider-specific branches

**Why now**

We want the AI pipeline to build on a stable backend contract, not on one provider’s SDK shape.

---

## Milestone 5 — Canonical JSON Generation

**Goal:** Make Stage 3 reliable before building the polished Stage 4 experience.

**Deliverables**

- Stage 3 prompt implementation
- canonical JSON schema validation
- one automatic retry on failure
- storage of canonical JSON in server-side pipeline state

**Implementation tasks**

- implement canonical synthesis input assembly:
  - metadata manifest
  - cleaned files
- enforce Stage 3 budget
- call provider abstraction
- validate output against canonical schema
- handle malformed or partial JSON
- perform one automatic retry before surfacing failure

**Acceptance criteria**

- valid repositories produce schema-valid canonical JSON
- malformed outputs do not progress to view generation
- failure path is clear and recoverable

**Testing focus**

- schema validation
- retry path
- repos with sparse structure
- repos with multiple languages

---

## Milestone 6 — Parallel View Generation and Results UX

**Goal:** Deliver the core Debrief experience.

**Deliverables**

- Executive, Architect, Engineer, and Auditor generation
- per-view input assembly rules
- Engineer raw-file subset selection
- progressive results rendering
- per-tab retry
- partial success handling

**Implementation tasks**

- implement Stage 4 prompts and output contracts
- build per-view server endpoints or jobs
- assemble view inputs correctly:
  - Executive: canonical JSON only
  - Architect: canonical JSON + metadata manifest
  - Engineer: canonical JSON + metadata manifest + selected raw files
  - Auditor: canonical JSON + metadata manifest
- implement Engineer file selection heuristic
- run view generation in parallel
- store per-view status:
  - pending
  - generating
  - complete
  - error
- render tabs progressively
- implement tab-level retry from existing canonical JSON

**Acceptance criteria**

- one view can succeed while another fails
- user sees completed tabs immediately
- tab retry does not rerun the whole pipeline
- Engineer view stays within budget on repos where Stage 3 succeeded

**UX requirements**

- loading messages map to real stages
- failed diagram rendering does not destroy the whole tab
- errors remain inline and actionable

---

## Milestone 7 — PDF Export and Presentation Quality

**Goal:** Make outputs shareable and polished.

**Deliverables**

- PDF export for all completed views
- print/export layout
- partial-results note in PDF
- blueprint styling for Architect diagrams
- readable light export treatment

**Implementation tasks**

- build export layout independent from the live tab chrome
- ensure Mermaid diagrams render acceptably in export mode
- include repo target, model, and export date
- include partial-results notice when fewer than four views are complete
- verify typography and pagination quality

**Acceptance criteria**

- user can export whenever at least one view is complete
- exported PDF contains only completed views
- export is legible and presentation-ready

---

## Milestone 8 — Hardening, QA, and MVP Release Readiness

**Goal:** Make the MVP dependable enough to release publicly.

**Deliverables**

- end-to-end QA pass
- security review of session and secret handling
- logging review
- rate-limit handling review
- launch checklist

**Implementation tasks**

- test against a matrix of real public repos:
  - small single-language repo
  - frontend-heavy app
  - backend-heavy app
  - monorepo subdirectory target
  - repo with large docs/config surface
- verify error handling across providers
- verify unauthenticated and authenticated GitHub flows
- review all logs for leaked secrets or repository content
- verify no raw tokens or keys touch browser storage
- tighten copy, loading states, and empty states

**Acceptance criteria**

- all critical flows work on real repositories
- no secret leaks found in browser or logs
- rate-limit and size-limit paths are understandable
- the product is stable enough for external use

---

## 4. Recommended Sequence and Shipping Checkpoints

If we want fast momentum without sacrificing architecture, ship internal checkpoints at these points:

### Checkpoint A

After Milestone 2:

- app shell exists
- settings work
- GitHub targeting works
- no AI yet

This is the first good architecture review point.

### Checkpoint B

After Milestone 4:

- deterministic repo pipeline works
- provider layer works
- still no polished output experience

This is the first good backend integration review point.

### Checkpoint C

After Milestone 6:

- end-to-end Debrief experience works
- tabs generate progressively
- retry behavior works

This is the first true MVP feature-complete point.

### Checkpoint D

After Milestone 8:

- export is polished
- QA and security review are complete

This is release readiness.

---

## 5. Suggested Build Order Inside the Codebase

Recommended implementation order at the file/module level:

1. shared schemas and types
2. session and settings endpoints
3. GitHub target parser and resolution service
4. ingestion and cleaning pipeline
5. metadata manifest builder
6. provider registry
7. provider adapters
8. canonical synthesis service
9. per-view generation services
10. frontend loading and results flows
11. PDF export
12. hardening and QA

---

## 6. Risks to Watch Closely

### Risk 1 — Token budgeting is too optimistic

Mitigation:

- estimate early
- fail before model calls
- keep Engineer input intentionally narrower than Stage 3

### Risk 2 — GitHub path/ref resolution becomes inconsistent

Mitigation:

- create one canonical repository target object
- pass that same object through the entire pipeline

### Risk 3 — Provider abstraction gets bypassed

Mitigation:

- forbid direct SDK calls outside the provider layer
- centralize model metadata and error normalization

### Risk 4 — Architect and Auditor outputs feel thin

Mitigation:

- include deterministic metadata manifest in those views
- expand canonical JSON fields exactly as defined in v3.1

### Risk 5 — Security regressions creep in during convenience work

Mitigation:

- no localStorage for keys or GitHub tokens
- review logs early
- keep secret-handling code concentrated in a few server modules

---

## 7. Definition of MVP Complete

Debrief MVP is complete when all of the following are true:

- public repo root URLs work without GitHub auth
- public repo subdirectory URLs work correctly
- provider, model, and BYOK settings are required and session-backed
- all AI calls run on the backend
- Stage 3 produces validated canonical JSON
- all four views can generate in parallel with partial success behavior
- Engineer view uses selected raw files, not the whole repo by default
- per-tab retry works from existing canonical JSON
- PDF export works for completed views
- no raw provider keys or GitHub tokens are stored in the browser
- main errors are actionable and understandable

---

## 8. Recommended Next Step

Start with **Milestone 0 and Milestone 1 together**. They are tightly connected and will let us establish the right architecture quickly. After that, move to Milestone 2 before writing any AI generation code.
