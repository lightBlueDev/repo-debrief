# Debrief — Milestone 0 + 1 Engineering Task List

This document turns Milestone 0 and Milestone 1 of the v3.1 implementation plan into concrete engineering work. It is meant to be used as the immediate build backlog for the clean restart.

Scope covered here:

- Milestone 0 — Project Reset and Technical Foundation
- Milestone 1 — Session, Settings, and Basic User Flow

Out of scope for this task list:

- GitHub URL resolution
- GitHub OAuth
- ingestion and cleaning
- AI provider calls
- canonical JSON generation
- results tabs and PDF export

---

## 1. Objectives

By the end of this task list, we should have:

- a clean app structure aligned with v3.1
- a React frontend and Node backend running together
- shared schemas for session and configuration state
- server-backed Settings flow for provider, model, and BYOK key handling
- a repository input screen that correctly blocks analysis until Settings are complete
- no raw provider keys persisted in browser storage

---

## 2. Working Assumptions

- We are starting fresh rather than extending `debrief1`
- TypeScript is used across frontend and backend
- Session state is server-side
- The browser may store non-secret UI preferences later, but not in this milestone
- Provider SDK integration is not required yet; only provider configuration state is needed

---

## 3. Target App Structure

Recommended top-level structure:

```text
repo-debrief/
  src/
    client/
      app/
      components/
      routes/
      lib/
      styles/
    server/
      app/
      routes/
      services/
      session/
      config/
    shared/
      schemas/
      types/
      constants/
  package.json
  tsconfig.json
```

Guidance:

- `src/client` owns UI only
- `src/server` owns sessions, routes, and future pipeline code
- `src/shared` owns cross-boundary types and schemas

---

## 4. Milestone 0 Tickets

## M0-T1 — Initialize Clean Project Structure

**Goal**

Create the new codebase skeleton with explicit frontend/backend/shared boundaries.

**Tasks**

- create the new repo or app root
- scaffold React frontend
- scaffold Node backend
- define `src/client`, `src/server`, and `src/shared`
- add base scripts for dev, build, typecheck, and lint

**Deliverables**

- app boots in development
- backend can serve API routes
- frontend can render a basic page

**Done when**

- `npm run dev` starts both app layers
- `npm run build` completes
- `npm run typecheck` completes

**Depends on**

- none

---

## M0-T2 — Add Tooling and Project Standards

**Goal**

Set the guardrails before feature work starts.

**Tasks**

- configure TypeScript for client, server, and shared code
- add linting
- add formatting
- add path aliases if they improve clarity
- document required environment variables

**Deliverables**

- lint config
- format config
- typed import boundaries
- `.env.example` or equivalent setup doc

**Done when**

- lint and typecheck run in CI-ready form
- required env vars are documented

**Depends on**

- M0-T1

---

## M0-T3 — Define Shared Schemas and Core Types

**Goal**

Create the shared contracts before building endpoints and UI state.

**Tasks**

- define `ProviderId`
- define `ProviderModelOption`
- define `SessionAiConfigStatus`
- define `SettingsFormInput`
- define `SavedSessionAiConfig`
- define `PublicSessionState`
- define `ApiError`
- define placeholder `RepositoryTargetDraft`

Recommended schema set:

- AI settings input schema
- non-secret session settings schema
- standard API success/error response schema

**Deliverables**

- typed shared models under `src/shared`
- runtime validation schemas if using Zod or similar

**Done when**

- frontend and backend both import the same shared types
- no duplicate local type definitions exist for settings/session payloads

**Depends on**

- M0-T1

---

## M0-T4 — Set Up Server Session Architecture

**Goal**

Create the session layer that will hold provider configuration safely.

**Tasks**

- choose session middleware
- define session shape
- configure secure cookie/session behavior for local and production modes
- store AI provider config in server session memory
- create helper methods for reading and writing session state

**Important rules**

- raw API keys are stored server-side only
- no raw API keys are returned from any route
- session helper must expose “configured or not” state separately from secrets

**Deliverables**

- session module
- session typings
- environment-driven session config

**Done when**

- backend can persist config state across requests in the same session
- session read/write helpers are tested or verified manually

**Depends on**

- M0-T1
- M0-T3

---

## M0-T5 — Build Basic App Shell and Visual Foundation

**Goal**

Establish the Debrief visual shell without building all screens fully.

**Tasks**

- set dark theme foundations
- define brand accent variables
- create top-level app layout
- add routes or view-state structure for:
  - landing
  - settings
  - repo input
- create shared UI primitives:
  - button
  - input
  - card/panel
  - inline error
  - badge

**Deliverables**

- minimal but real Debrief UI shell

**Done when**

- app visually matches the general v3.1 direction
- settings and repo input screens have a stable layout target

**Depends on**

- M0-T1

---

## 5. Milestone 1 Tickets

## M1-T1 — Build Settings Screen UI

**Goal**

Let the user configure provider, model, and key in one clear flow.

**Tasks**

- build provider selector
- build model selector that changes with provider
- build OpenRouter custom model option
- build API key password field with reveal toggle
- add provider-specific helper link for getting a key
- add explanatory copy:
  - provider bills usage directly
  - key is not stored permanently

**Deliverables**

- complete Settings form

**Done when**

- user can fill out and submit settings for all three providers
- OpenRouter custom model field only appears when relevant

**Depends on**

- M0-T3
- M0-T5

---

## M1-T2 — Implement Settings Session Endpoints

**Goal**

Make the Settings screen actually persist safe configuration server-side.

**Required endpoints**

- `GET /api/session`
- `POST /api/settings/ai`
- `POST /api/settings/ai/clear`

**Expected behavior**

`GET /api/session`

- returns non-secret session state only
- example fields:
  - configured provider
  - configured model
  - whether API key is present
  - whether GitHub is connected

`POST /api/settings/ai`

- validates provider, model, and API key
- stores raw key only in session
- returns non-secret success state

`POST /api/settings/ai/clear`

- removes the AI config from the session
- returns cleared non-secret state

**Deliverables**

- session routes
- validation layer
- consistent API response shapes

**Done when**

- frontend can refresh and recover non-secret settings state from the server
- raw key never appears in the response body

**Depends on**

- M0-T3
- M0-T4

---

## M1-T3 — Wire Settings Screen to Real Session State

**Goal**

Connect the Settings UI to backend state instead of local-only form state.

**Tasks**

- load current public session state on app start
- show configured provider/model state
- show “API key configured” state without revealing the key
- submit form to backend
- handle save success and validation errors inline
- support clearing and re-entering settings

**Deliverables**

- functional settings flow

**Done when**

- settings state survives page refresh in the active session
- no secret is stored in `localStorage`, `sessionStorage`, or query params

**Depends on**

- M1-T1
- M1-T2

---

## M1-T4 — Build Landing and Repository Input Flow

**Goal**

Create the pre-analysis experience that leads naturally into the future pipeline.

**Tasks**

- build landing page with:
  - product name
  - tagline
  - start CTA
  - optional connect GitHub CTA placeholder
- build repository input screen with:
  - repo URL input
  - active provider/model badge
  - link to Settings
  - inline helper copy
- support screen-to-screen navigation

**Deliverables**

- landing flow
- repository input screen

**Done when**

- user can move from landing to settings to repo input cleanly
- provider/model badge reflects current session config

**Depends on**

- M0-T5
- M1-T3

---

## M1-T5 — Add “Settings Required Before Analysis” Guard

**Goal**

Block analysis correctly until provider/model/key are configured.

**Tasks**

- add client-side guard before submit
- add server-side guard endpoint or validation helper for future analysis routes
- show inline message directing the user to Settings
- prevent half-configured states from slipping through

**Deliverables**

- analysis gate behavior

**Done when**

- repo input submit is blocked if no valid AI config is present
- guidance message is clear and not accusatory

**Depends on**

- M1-T3
- M1-T4

---

## M1-T6 — Add Session-Aware App Bootstrap

**Goal**

Ensure the app initializes from server truth instead of assuming browser state.

**Tasks**

- create app bootstrap fetch for public session state
- define loading state while session is being checked
- ensure route/view selection uses server-backed session data
- prepare state shape for later GitHub connection status

**Deliverables**

- predictable app startup behavior

**Done when**

- refreshing the page restores non-secret config state correctly
- app does not depend on browser storage to know if setup is complete

**Depends on**

- M1-T2
- M1-T3

---

## 6. Suggested Implementation Order

Build in this order:

1. M0-T1 Initialize clean project structure
2. M0-T2 Add tooling and project standards
3. M0-T3 Define shared schemas and core types
4. M0-T4 Set up server session architecture
5. M0-T5 Build basic app shell and visual foundation
6. M1-T2 Implement settings session endpoints
7. M1-T1 Build Settings screen UI
8. M1-T3 Wire Settings screen to real session state
9. M1-T6 Add session-aware app bootstrap
10. M1-T4 Build landing and repository input flow
11. M1-T5 Add “Settings required” guard

This order keeps the app honest by making the backend contract exist before the UI depends on it.

---

## 7. Engineering Notes

### Settings state model

Use two shapes:

- secret-bearing server session shape
- non-secret public session shape

Example public session shape:

```ts
type PublicSessionState = {
  ai: {
    provider: "anthropic" | "gemini" | "openrouter" | null;
    model: string | null;
    apiKeyConfigured: boolean;
  };
  github: {
    connected: boolean;
    username: string | null;
    avatarUrl: string | null;
  };
};
```

### Provider model options

The first milestone does not need live provider metadata. A server-side static curated registry is enough for now, as long as it is defined in the backend and exposed safely to the UI.

### Validation

Validate on both client and server:

- provider must be one of supported values
- model must be present
- API key must be non-empty
- custom OpenRouter model must be non-empty when selected

### Browser storage rule

Do not use:

- `localStorage` for API keys
- `sessionStorage` for API keys
- URL params for API keys

Avoid browser storage entirely for milestone 0 and 1 session truth.

---

## 8. QA Checklist for Milestone 0 + 1

- app boots locally
- no frontend model SDK imports exist
- settings can be saved
- settings survive refresh in the same session
- clearing settings works
- API key is never echoed back to the client
- no raw key appears in browser devtools storage
- repo input screen reflects current provider/model state
- analysis action is blocked until settings are complete
- all errors are inline and understandable

---

## 9. Definition of Done for This Slice

Milestone 0 + 1 are done when:

- the new codebase architecture is in place
- session-backed AI settings work end-to-end
- the frontend only sees non-secret session state
- the user can navigate from landing to settings to repo input
- the app correctly blocks analysis until AI setup is complete
- no raw provider API key is stored in the browser

---

## 10. Recommended Next Slice After This

Once this task list is complete, the next work should be:

- Milestone 2 — Optional GitHub OAuth and Repository Target Resolution

Do not begin AI generation work before repository target resolution is complete.
