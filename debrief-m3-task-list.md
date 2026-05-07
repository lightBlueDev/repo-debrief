# Debrief — Milestone 3 Engineering Task List

This document turns Milestone 3 into a concrete implementation backlog.

Scope covered here:

- deterministic repository snapshot processing
- cleaning and exclusion rules
- conservative `.gitignore` handling
- file classification
- token estimation
- metadata manifest generation
- budget enforcement before AI stages

Out of scope for this task list:

- AI provider calls
- canonical JSON generation
- role-based view generation
- PDF export

---

## 1. Objectives

By the end of Milestone 3, we should have:

- a deterministic cleaned source payload derived from a resolved repository target
- a stable metadata manifest that later AI stages can trust
- model-aware size and budget checks before any AI call
- deterministic failure paths for oversized repositories

---

## 2. Current Starting Point

Milestone 3 has already begun.

Existing foundation:

- resolved repository targets from Milestone 2
- shared ingestion schemas in `src/shared/schemas/ingestion.ts`
- deterministic snapshot fetcher in `src/server/services/repository/fetchRepositorySnapshot.ts`

This task list assumes those foundations remain the entrypoint into ingestion.

---

## 3. Core Outputs of Milestone 3

Milestone 3 should produce two primary backend artifacts:

### A. Clean Source Payload

```ts
type CleanSourceFile = {
  path: string;
  content: string;
  language: string;
  sizeBytes: number;
  estimatedTokens: number;
};
```

### B. Deterministic Metadata Manifest

```ts
type RepositoryMetadataManifest = {
  repo: {
    owner: string;
    name: string;
    url: string;
    ref: string;
    subpath: string | null;
    commitSha: string;
  };
  stats: {
    fileCount: number;
    estimatedTokens: number;
    languages: string[];
  };
  folderTree: string[];
  manifests: string[];
  configFiles: string[];
  testFiles: string[];
  entrypointCandidates: string[];
};
```

These outputs must be deterministic and reusable.

---

## 4. Milestone 3 Tickets

## M3-T1 — Formalize Clean Source Types and Schemas

**Goal**

Add the missing shared contract for cleaned files so the rest of Milestone 3 has a stable type boundary.

**Tasks**

- define `CleanSourceFile`
- define `CleanSourcePayload`
- add runtime schemas in shared ingestion schema files
- ensure the manifest and snapshot types compose cleanly

**Deliverables**

- shared clean-source schemas and exported types

**Done when**

- cleaned payloads are typed and validated consistently

**Depends on**

- current ingestion schemas

---

## M3-T2 — Implement Explicit Cleaning and Exclusion Rules

**Goal**

Filter raw snapshot files down to materially useful source input.

**Tasks**

- implement explicit exclusions for:
  - dependency directories
  - lock files
  - build artifacts
  - `.env*`
  - system files
  - binary/image/font/archive/media formats
- keep relative paths stable
- preserve deterministic ordering

**Deliverables**

- cleaning service layered on top of the snapshot fetcher

**Done when**

- raw snapshot files become a deterministic cleaned payload
- excluded files are removed consistently

**Depends on**

- M3-T1

---

## M3-T3 — Implement Conservative `.gitignore` Handling

**Goal**

Respect `.gitignore` without accidentally hiding useful committed source.

**Tasks**

- detect `.gitignore` in the cleaned snapshot root
- parse and apply patterns conservatively
- keep source/config/docs/manifests if they are materially useful and present in the snapshot
- document the conservative behavior in code comments where needed

**Deliverables**

- `.gitignore` filtering layer integrated into cleaning

**Done when**

- `.gitignore` helps remove junk
- committed relevant source is not dropped blindly

**Depends on**

- M3-T2

---

## M3-T4 — Add File Classification and Language Detection

**Goal**

Attach language and structural metadata to every cleaned file.

**Tasks**

- map file extensions to language labels
- support common config and manifest file cases
- detect root manifests and likely entrypoint files
- preserve size in bytes

**Deliverables**

- classified cleaned files

**Done when**

- each cleaned file has path, content, size, and language

**Depends on**

- M3-T2

---

## M3-T5 — Add Token Estimation

**Goal**

Estimate file and payload size in token-like units early enough to enforce budgets before AI.

**Tasks**

- define a deterministic token estimation heuristic
- estimate tokens per file
- estimate total tokens for the cleaned payload
- include token counts in cleaned file data and manifest stats

**Deliverables**

- token estimation utility
- aggregate token counts

**Done when**

- cleaned payload size can be evaluated before Stage 3

**Depends on**

- M3-T4

---

## M3-T6 — Build Deterministic Metadata Manifest

**Goal**

Produce a compact, deterministic metadata summary from the cleaned payload.

**Tasks**

- build language summary
- build file count and aggregate token count
- detect manifests
- detect config files
- detect test files
- generate a compact folder tree
- identify entrypoint candidates deterministically

**Deliverables**

- manifest builder service

**Done when**

- the same cleaned payload always yields the same manifest

**Depends on**

- M3-T4
- M3-T5

---

## M3-T7 — Enforce Stage 3 Budget Before AI

**Goal**

Fail fast when the cleaned payload exceeds the selected model budget.

**Tasks**

- define budget-check input shape
- compare aggregate estimated tokens against the selected model budget
- return clear size failures
- preserve room for later stage-specific budgeting

**Deliverables**

- budget enforcement utility or service

**Done when**

- oversized repositories fail before canonical JSON generation begins

**Depends on**

- M3-T5

---

## M3-T8 — Expose an Ingestion/Preparation Service Boundary

**Goal**

Create one backend entrypoint that turns a resolved repository target into the deterministic artifacts needed by later stages.

**Tasks**

- compose:
  - snapshot fetching
  - cleaning
  - `.gitignore`
  - classification
  - token estimation
  - manifest generation
  - budget checks
- return a stable combined output contract

**Deliverables**

- orchestration service for deterministic preparation

**Done when**

- later pipeline stages can call one deterministic preparation path

**Depends on**

- M3-T2 through M3-T7

---

## M3-T9 — Add Fixture-Based Deterministic Tests

**Goal**

Protect Milestone 3 from regressions before AI stages depend on it.

**Suggested coverage**

- full repo snapshot path handling
- subdirectory scope handling
- explicit exclusions
- `.gitignore` conservative behavior
- language detection
- token estimation stability
- manifest determinism
- oversize failure path

**Deliverables**

- repeatable tests for deterministic preparation

**Done when**

- key ingestion behavior is covered by non-network tests where practical

**Depends on**

- M3-T2 through M3-T8

---

## 5. Suggested Implementation Order

Build in this order:

1. M3-T1 Formalize clean source types and schemas
2. M3-T2 Implement explicit cleaning and exclusion rules
3. M3-T3 Implement conservative `.gitignore` handling
4. M3-T4 Add file classification and language detection
5. M3-T5 Add token estimation
6. M3-T6 Build deterministic metadata manifest
7. M3-T7 Enforce Stage 3 budget before AI
8. M3-T8 Expose an ingestion/preparation service boundary
9. M3-T9 Add fixture-based deterministic tests

This keeps the core data model stable before budget logic and orchestration depend on it.

---

## 6. Key Decisions to Preserve

- Milestone 3 consumes `ResolvedRepositoryTarget`, not raw URLs
- subdirectory scope becomes the target root for downstream file paths
- explicit exclusions always win
- `.gitignore` is conservative, not absolute
- size enforcement happens before AI
- the output must be deterministic

---

## 7. QA Checklist for Milestone 3

- root repo snapshot produces deterministic cleaned files
- subdirectory target produces deterministic relative file paths
- lock files and build artifacts are excluded
- `.gitignore` does not hide useful committed source blindly
- language detection is stable
- token estimation is stable
- manifest output is deterministic
- oversize payloads fail clearly before AI

---

## 8. Definition of Done for Milestone 3

Milestone 3 is done when:

- resolved targets can be turned into deterministic cleaned source payloads
- a deterministic metadata manifest is produced
- model-aware size checks run before AI stages
- later pipeline stages can consume one stable preparation output

---

## 9. Recommended Next Slice After This

Once Milestone 3 is complete, the next detailed planning should cover:

- Milestone 4 — Provider abstraction
- Milestone 5 — Canonical JSON generation

At that point, we will have a strong non-AI foundation for the first model calls.
