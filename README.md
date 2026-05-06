# Debrief

Understand the code you built.

This repository contains the planning and implementation work for Debrief, a web app that analyzes a GitHub repository and generates four role-based views of the codebase.

## Current State

The project has entered Milestone 0 scaffolding. The current repo contains:

- the tightened v3.1 product specification
- the milestone-based implementation plan
- the Milestone 0 + 1 engineering task list
- lightweight project status tracking docs
- the initial client/server/shared codebase foundation

## Key Docs

- `debrief-v3.1-spec.md`
- `debrief-v3.1-implementation-plan.md`
- `debrief-m0-m1-task-list.md`
- `project-status/`

## MVP Direction

- BYOK only
- optional GitHub auth for public repos
- backend-owned AI pipeline
- support for repo and subdirectory GitHub URLs
- progressive four-tab results experience

## Run Locally

1. Install dependencies:
   `npm install`
2. Copy environment defaults if needed:
   `cp .env.example .env`
3. Start the app:
   `npm run dev`
