# Current Status

## Purpose

This file tracks the current working state of the project. Update it frequently during active implementation.

Use this file for:

- what we are working on right now
- the active milestone or ticket range
- immediate blockers
- next 1 to 3 concrete steps

Do not use this file for long-term project history. That belongs in `project_status.md`.

---

## Last Updated

- Date: 2026-05-06
- Phase: Early implementation
- Active milestone: Milestone 2 prep

---

## Right Now

- v3.1 product spec has been tightened and saved
- milestone-based implementation plan has been written
- Milestone 0 + 1 engineering task list has been written
- Milestone 2 task list has been written
- Milestone 3 outline has been written
- M2-T1 shared repository target types and schemas are implemented
- M2-T2 GitHub URL parser and parser tests are implemented
- M2-T5 auth-aware GitHub client is implemented
- M2-T6 repository resolution API route is implemented
- M2-T7 repo input screen is wired to live repository resolution
- Milestone 3 has started with shared ingestion contracts and a deterministic snapshot fetcher
- clean restart is planned instead of extending `debrief1`
- top-level repo has been prepared for first GitHub push
- old `debrief1` prototype is excluded from the new repo by `.gitignore`
- Milestone 0 scaffold has been implemented at the top level
- top-level app now has client, server, and shared source boundaries
- build, typecheck, and lint are passing on the new scaffold
- Milestone 1 settings endpoints and session-backed UI flow are implemented
- repo input now enforces the “Settings required before analysis” rule

---

## Active Focus

- prepare the clean codebase foundation
- prepare Milestone 2 GitHub target resolution
- keep the current settings/session contract stable for later pipeline work

---

## Immediate Next Steps

1. Add cleaning and exclusion rules on top of the new snapshot fetcher
2. Add file classification and token estimation
3. Start building the deterministic metadata manifest from the fetched snapshot

---

## Open Questions

- whether the GitHub repo should be public or private at initial creation
- whether to split Milestone 2 into separate URL-resolution and snapshot-fetch sub-steps

---

## Blockers

- none right now
