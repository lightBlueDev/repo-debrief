# Project Status

## Purpose

This file tracks the broader project state across milestones. Update it when scope, architecture, milestone status, or key decisions change.

Use this file for:

- milestone progress
- major decisions
- project risks
- roadmap state

Do not use this file for minute-to-minute task tracking. That belongs in `current_status.md`.

---

## Last Updated

- Date: 2026-05-06
- Overall status: Milestone 0 and Milestone 1 implemented, Milestone 2 ready to begin

---

## Project Snapshot

- Product: Debrief
- Goal: Analyze a public GitHub repo and generate four role-based codebase views
- Economic model: BYOK only
- MVP audience: broad developer audience, designed to be user friendly without reducing technical usefulness

---

## Key Decisions Locked

- public repositories must work without GitHub OAuth
- GitHub OAuth is optional and used for rate-limit and convenience improvements
- all AI calls must run on the backend
- provider and model configuration is required before analysis
- raw provider keys must never be stored in browser storage
- raw GitHub tokens must never be stored in browser storage
- root repo URLs and subdirectory URLs must both be supported
- exact submitted ref and path must be analyzed when present
- model-aware token budgeting must happen before AI calls
- Engineer view must use a selected raw-file subset, not the whole repo by default

---

## Milestone Status

| Milestone | Status | Notes |
| --- | --- | --- |
| Milestone 0 — Foundation | Implemented | Client/server/shared scaffold, tooling, shared schemas, session shell, and app shell are in place |
| Milestone 1 — Settings and session flow | Implemented | Real settings endpoints, session-backed save/clear flow, app bootstrap, and repo-input guard are in place |
| Milestone 2 — GitHub target resolution | Planned | Starts after M0 + M1 |
| Milestone 3 — Deterministic ingestion | Planned | Depends on M2 |
| Milestone 4 — Provider abstraction | Planned | Depends on M3 |
| Milestone 5 — Canonical JSON | Planned | Depends on M4 |
| Milestone 6 — Views and results UX | Planned | Depends on M5 |
| Milestone 7 — PDF export and polish | Planned | Depends on M6 |
| Milestone 8 — Hardening and release readiness | Planned | Final MVP pass |

---

## Key Artifacts

- Spec: [debrief-v3.1-spec.md](/Users/emapro/Documents/New%20project%202/debrief-v3.1-spec.md)
- Implementation plan: [debrief-v3.1-implementation-plan.md](/Users/emapro/Documents/New%20project%202/debrief-v3.1-implementation-plan.md)
- Milestone 0 + 1 tasks: [debrief-m0-m1-task-list.md](/Users/emapro/Documents/New%20project%202/debrief-m0-m1-task-list.md)
- Milestone 2 tasks: [debrief-m2-task-list.md](/Users/emapro/Documents/New%20project%202/debrief-m2-task-list.md)
- Milestone 3 outline: [debrief-m3-outline.md](/Users/emapro/Documents/New%20project%202/debrief-m3-outline.md)
- Repo setup files: [README.md](/Users/emapro/Documents/New%20project%202/README.md) and [.gitignore](/Users/emapro/Documents/New%20project%202/.gitignore)
- App scaffold: [package.json](/Users/emapro/Documents/New%20project%202/package.json) and [src](/Users/emapro/Documents/New%20project%202/src)
- Settings flow: [src/server/routes/settings.ts](/Users/emapro/Documents/New%20project%202/src/server/routes/settings.ts) and [src/client/routes/SettingsScreen.tsx](/Users/emapro/Documents/New%20project%202/src/client/routes/SettingsScreen.tsx)

---

## Current Risks

- starting implementation in the wrong repo structure would create avoidable rework
- mixing provider logic into UI code would recreate the prototype’s drift
- weak session handling would create security regressions early
- skipping GitHub target resolution details would create downstream pipeline instability
- drifting into AI generation before Milestone 1 and 2 are complete would create rework

---

## Success Definition for MVP

- public repo analysis works without mandatory GitHub auth
- provider/model/BYOK setup is clear and session-backed
- pipeline is backend-owned
- canonical JSON and four views generate reliably within budgets
- results are understandable for less-experienced users and still useful for experienced developers
