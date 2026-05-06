# Debrief — Milestone 2 Engineering Task List

This document turns Milestone 2 of the v3.1 implementation plan into concrete engineering work.

Scope covered here:

- GitHub repository URL parsing
- exact repository target resolution
- optional authenticated vs unauthenticated GitHub access paths
- stable repository target object for downstream pipeline stages

Out of scope for this task list:

- deterministic ingestion and cleaning
- metadata manifest construction
- token budgeting
- AI provider calls
- canonical JSON generation

---

## 1. Objectives

By the end of Milestone 2, we should have:

- support for root GitHub repo URLs
- support for GitHub subdirectory URLs with `tree/{ref}/{path}`
- exact target resolution into a canonical repository target object
- default branch resolution when no ref is provided
- commit SHA capture for the analyzed target
- optional GitHub-authenticated access path without making auth mandatory
- a server API contract the later ingestion pipeline can consume directly

---

## 2. Core Output of Milestone 2

Milestone 2 exists to produce one reliable artifact:

```ts
type ResolvedRepositoryTarget = {
  provider: "github";
  owner: string;
  repo: string;
  repoUrl: string;
  submittedUrl: string;
  ref: string;
  subpath: string | null;
  commitSha: string;
  defaultBranch: string;
  visibility: "public";
};
```

This object becomes the foundation for:

- snapshot fetching
- deterministic cleaning scope
- cache keys later
- display state in the UI
- retry consistency

If this object is sloppy, the rest of the pipeline will be sloppy too.

---

## 3. Working Assumptions

- MVP supports public GitHub repositories only
- GitHub OAuth remains optional
- the browser still does not see raw GitHub tokens
- target resolution runs on the backend
- URL parsing and target resolution are separate concerns

---

## 4. Milestone 2 Tickets

## M2-T1 — Define Shared Repository Target Types and Schemas

**Goal**

Lock the shared contract before implementing parsing or resolution logic.

**Tasks**

- define `RepositoryUrlInput`
- define `ParsedGitHubUrl`
- define `ResolvedRepositoryTarget`
- define standard success/error response shapes for target resolution
- add runtime validation schemas for these payloads

**Deliverables**

- shared types under `src/shared`
- shared schemas for parse and resolve responses

**Done when**

- frontend and backend use the same repository target types
- no route invents its own target shape

**Depends on**

- current Milestone 0 + 1 shared-type structure

---

## M2-T2 — Implement GitHub URL Parser

**Goal**

Parse supported GitHub URLs into a structured intermediate form.

**Supported inputs**

- `https://github.com/{owner}/{repo}`
- `https://github.com/{owner}/{repo}/`
- `https://github.com/{owner}/{repo}.git`
- `https://github.com/{owner}/{repo}/tree/{ref}/{path}`

**Tasks**

- normalize host and pathname
- strip optional `.git`
- tolerate trailing slashes
- extract owner and repo
- detect root-repo vs subdirectory URL
- extract `ref`
- extract `path` portion for subdirectory URLs
- reject unsupported GitHub URL shapes with a clean error

**Deliverables**

- parser utility
- parser tests or fixture coverage

**Done when**

- supported URLs parse cleanly
- unsupported shapes fail with specific messages

**Important edge cases**

- percent-encoded path segments
- refs that may contain slashes
- malformed `tree` URLs
- repository names with dots or hyphens

**Depends on**

- M2-T1

---

## M2-T3 — Resolve Root Repo Targets

**Goal**

Turn a parsed root repo URL into a resolved target.

**Tasks**

- fetch repo metadata from GitHub
- verify public accessibility
- read default branch
- resolve the default branch HEAD commit SHA
- construct canonical `ResolvedRepositoryTarget`

**Deliverables**

- root target resolver

**Done when**

- a root repo URL resolves to owner, repo, default branch, and commit SHA
- the resolved object is deterministic and UI-safe

**Depends on**

- M2-T2

---

## M2-T4 — Resolve Subdirectory Targets

**Goal**

Turn a parsed subdirectory URL into a resolved target with exact ref and path.

**Tasks**

- resolve the submitted ref against GitHub
- verify the subpath exists at that ref
- determine the commit SHA associated with the resolved ref
- preserve the exact subpath scope
- construct canonical `ResolvedRepositoryTarget`

**Deliverables**

- subdirectory target resolver

**Done when**

- a valid `tree/{ref}/{path}` URL resolves successfully
- invalid refs or missing paths fail with clear user-facing errors

**Important note**

This is usually the trickiest Milestone 2 ticket because GitHub refs and paths can both contain slashes, so parsing and API resolution have to be coordinated carefully.

**Depends on**

- M2-T2

---

## M2-T5 — Add Optional Auth-Aware GitHub Client

**Goal**

Use GitHub OAuth when present, but keep public repo access working without it.

**Tasks**

- create a GitHub API client helper
- read GitHub auth state from session
- attach auth header when a token is present
- fall back to unauthenticated requests otherwise
- normalize GitHub error handling for:
  - not found
  - rate limited
  - bad ref
  - inaccessible path

**Deliverables**

- GitHub client helper
- normalized GitHub error mapping

**Done when**

- the same resolver works with or without auth
- raw GitHub tokens never leave the server

**Depends on**

- M0 + M1 session architecture

---

## M2-T6 — Expose Target Resolution API

**Goal**

Create a backend route the frontend can call before ingestion exists.

**Recommended endpoint**

- `POST /api/repository/resolve`

**Input**

- submitted GitHub URL

**Output**

- resolved repository target object

**Tasks**

- validate the incoming URL payload
- parse and resolve the target
- return canonical resolved target state
- return normalized inline-friendly errors

**Deliverables**

- route implementation
- payload validation

**Done when**

- frontend can resolve a repo target without touching ingestion yet

**Depends on**

- M2-T3
- M2-T4
- M2-T5

---

## M2-T7 — Wire Repo Input Screen to Resolution Flow

**Goal**

Make the repo input screen feel real before ingestion exists.

**Tasks**

- connect repo input form to `/api/repository/resolve`
- show loading state during resolution
- show resolved target summary:
  - repo name
  - ref
  - subpath if present
  - commit SHA
- keep the existing AI-settings guard in place
- show clear resolution failures inline

**Deliverables**

- repo input UI with live resolution behavior

**Done when**

- valid supported URLs resolve visibly in the UI
- invalid URLs fail with understandable guidance

**Depends on**

- M2-T6

---

## M2-T8 — Add Milestone 2 Test Fixtures and Coverage

**Goal**

Protect the parser/resolver logic from regressions before Milestone 3 depends on it.

**Suggested fixtures**

- root repo URL
- root repo URL with trailing slash
- root repo URL with `.git`
- subdirectory URL with a normal branch name
- subdirectory URL with deeper path
- malformed GitHub URL
- unsupported GitHub URL shape
- missing repo
- missing subpath

**Deliverables**

- parser tests and/or fixture-based validation
- resolver tests where practical

**Done when**

- the most important URL cases are covered by repeatable checks

**Depends on**

- M2-T2 through M2-T6

---

## 5. Suggested Implementation Order

Build in this order:

1. M2-T1 Define shared repository target types and schemas
2. M2-T2 Implement GitHub URL parser
3. M2-T5 Add optional auth-aware GitHub client
4. M2-T3 Resolve root repo targets
5. M2-T4 Resolve subdirectory targets
6. M2-T6 Expose target resolution API
7. M2-T7 Wire repo input screen to resolution flow
8. M2-T8 Add Milestone 2 test fixtures and coverage

This keeps backend truth ahead of the UI and avoids binding the UI to a moving target contract.

---

## 6. Key Engineering Decisions to Preserve

- parsing is not the same as resolution
- the canonical repository target object is the only downstream source of truth
- GitHub auth is optional, not required
- GitHub token handling stays server-only
- errors should describe what the user can do next

---

## 7. QA Checklist for Milestone 2

- root repo URL resolves
- root repo URL with trailing slash resolves
- root repo URL with `.git` resolves
- subdirectory URL resolves with exact ref and path preserved
- unsupported URL shape fails clearly
- missing repo fails clearly
- missing path fails clearly
- unauthenticated public access works
- authenticated path still works when GitHub is connected
- no GitHub token is exposed to the browser

---

## 8. Definition of Done for Milestone 2

Milestone 2 is done when:

- supported GitHub URLs parse and resolve correctly
- the app has a canonical resolved repository target object
- ref, path, and commit SHA are preserved consistently
- repo input can resolve a target before ingestion exists
- optional GitHub auth improves access but is not required

---

## 9. Recommended Next Slice After This

Once Milestone 2 is complete, move to:

- Milestone 3 — Deterministic ingestion, cleaning, and metadata manifest

Milestone 3 should consume `ResolvedRepositoryTarget` directly rather than re-parsing URLs.
