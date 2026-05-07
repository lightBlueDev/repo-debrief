# Status Summary

## Purpose

This file is the shortest high-level summary of where the project stands. Update it after meaningful planning or implementation sessions.

It should answer:

- where are we overall
- what changed recently
- what happens next

---

## Last Updated

- Date: 2026-05-06

---

## Current Summary

Debrief has a locked v3.1 MVP specification, a milestone-based implementation plan, and a concrete Milestone 0 + 1 task backlog. The old `debrief1` repo was reviewed and is being treated as a prototype to learn from rather than the foundation to continue.

The clean top-level codebase foundation is now in place and the Milestone 1 settings flow is implemented. The repo has been created on GitHub, the app now boots from server-backed session state, and the repo-input screen correctly blocks analysis until AI settings are configured.

Milestone 2 is now underway: the shared repository-target contract is in place, and the GitHub URL parser is implemented with passing fixture-style tests.

The backend target-resolution slice now goes further than that: the auth-aware GitHub client exists, the repository resolver can resolve root and subdirectory targets, and a `/api/repository/resolve` route is in place for the UI to call next.

That UI call is now wired too. The repo input screen can resolve supported GitHub URLs, show loading and inline errors, and display the exact resolved repo/ref/path/commit target that later ingestion will use.

---

## Most Recent Changes

- tightened the product spec into v3.1
- converted the spec into milestone-based implementation planning
- turned Milestone 0 + 1 into a concrete engineering task list
- decided on a clean restart instead of building on the prior prototype
- prepared the top-level repo with a README and `.gitignore` for first push
- scaffolded the new React + Express + shared-types foundation at the repo root
- added a minimal session-backed server shell and Milestone 0 UI shell
- implemented real save/clear settings endpoints and wired the Settings UI to them
- added the Milestone 1 analysis guard on the repo-input screen
- wrote the concrete Milestone 2 engineering task list
- wrote the lighter Milestone 3 outline to guide the next planning slice
- implemented the shared repository-target schemas and types
- implemented and tested the first-pass GitHub URL parser
- implemented and tested the auth-aware GitHub client
- implemented the repository resolution service and route
- wired the repo input screen to the live repository resolution route

---

## Next Recommended Move

Start Milestone 2 by building GitHub URL parsing and exact repository target resolution.
