# Debrief — Milestone 3 Outline

This is a lighter planning outline for Milestone 3. It is intentionally less detailed than the Milestone 2 task list because Milestone 3 depends on the exact repository target contract produced by Milestone 2.

---

## 1. Goal

Build the deterministic, non-AI pipeline that turns a resolved repository target into:

- a cleaned source payload
- deterministic file metadata
- a metadata manifest
- model-aware size and budget decisions

---

## 2. Inputs

Milestone 3 should take a `ResolvedRepositoryTarget` from Milestone 2, not a raw URL.

This matters because:

- scope is already settled
- commit SHA is already known
- root vs subdirectory behavior is already resolved
- retries stay consistent

---

## 3. Main Work Areas

### A. Snapshot Fetching

- fetch the repository snapshot for the resolved target
- preserve the resolved commit SHA
- scope content to the resolved subpath when present

### B. Cleaning Rules

- apply explicit exclusions
- apply conservative `.gitignore` handling
- keep source/config/docs that are materially useful

### C. File Classification

- detect language
- record size and path
- estimate token count per file

### D. Metadata Manifest

- repo identity
- ref
- subpath
- commit SHA
- file count
- language summary
- config files
- test files
- manifests
- entrypoint candidates
- folder tree

### E. Budget Enforcement

- estimate total cleaned payload size
- enforce Stage 3 budget before AI
- prepare the later Engineer-view subset strategy

---

## 4. Likely Milestone 3 Tickets

- M3-T1 Snapshot fetcher from resolved target
- M3-T2 Cleaning rules and exclusion engine
- M3-T3 Conservative `.gitignore` handling
- M3-T4 File classification and token estimation
- M3-T5 Deterministic metadata manifest builder
- M3-T6 Size and budget enforcement route/service
- M3-T7 Repo input / loading UI handoff into ingestion state
- M3-T8 Fixture-based validation for deterministic output

---

## 5. Main Risks

- over-trusting `.gitignore` and excluding useful committed files
- using raw byte size instead of useful token estimates
- mixing target resolution concerns back into ingestion
- fetching too broadly when a subdirectory target was resolved

---

## 6. Definition of Success

Milestone 3 will be in a good place when:

- the same resolved target always produces the same cleaned output
- subdirectory scope is respected
- the metadata manifest is stable and useful
- oversized repos fail before any AI stage

---

## 7. Next Move After Milestone 3

Once Milestone 3 is complete, the next detailed task list should be:

- Milestone 4 and 5 planning for provider abstraction plus canonical JSON generation
