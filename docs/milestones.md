# Milestones

## Purpose

This document defines the implementation pipeline for evolving the product from a flat track dashboard into a simple system that can support opportunities and review workflows without creating architectural sprawl.

The sequence is intentionally front-loaded with foundational and storage work so later feature slices can remain small and safe.

Executable scenario tests are now treated as part of that foundation, not as a final cleanup step.

## Current implementation reality

Today the application collapses three responsibilities into one file:

- the domain model,
- the storage logic,
- and the presentation logic.

This is visible in [src/aquil-dashboard.jsx](/Users/aquilabdullah/devel/projects/what-i-am-working-on/src/aquil-dashboard.jsx:1), where default data, Gist fetch and save behavior, state management, and UI rendering all live together.

That shape is acceptable for the first prototype, but it is the wrong base for adding first-class opportunities.

## Boundary model

The product should be split into three simple layers.

### Data layer

The data layer defines what the application knows and how that data can be transformed.

Responsibilities:

- define the dashboard document shape,
- define `Track` and future `Opportunity` records,
- normalize loaded data,
- apply schema defaults,
- expose pure update helpers,
- expose pure selectors for views such as active tracks, open opportunities, and follow-ups due.

Rules:

- no React,
- no `fetch`,
- no browser APIs,
- no direct knowledge of GitHub Gist.

### Storage layer

The storage layer is responsible for loading and saving the dashboard document.

Responsibilities:

- define a storage interface such as `loadDashboard()` and `saveDashboard(document)`,
- serialize and deserialize the dashboard document,
- translate Gist API behavior into application-level success and failure results,
- guard against invalid or incomplete remote data,
- keep Gist-specific details out of the UI.

Rules:

- no JSX,
- no view logic,
- no domain decisions beyond validation, normalization, and persistence concerns.

### Presentation layer

The presentation layer is responsible for rendering views and collecting user intent.

Responsibilities:

- render the dashboard,
- render future opportunities and review views,
- manage transient UI state such as expanded panels, edit mode, and copy feedback,
- call application actions that use the data and storage layers.

Rules:

- no direct Gist API calls,
- no raw schema migration logic,
- no embedded default document definitions if those defaults belong to the data layer.

## Design principle for simplicity

Keep one durable document and one storage adapter.

For the current phase, the simplest durable shape is a single versioned dashboard document saved to one Gist file. That gives us room to extend the model while avoiding premature backend work.

Recommended document direction:

```json
{
  "version": 1,
  "tracks": [],
  "opportunities": [],
  "review": {}
}
```

This recommendation keeps storage simple while creating a clean place for future concepts.

## Foundational work that must happen first

These items are highest priority because they reduce risk before feature growth.

### 1. Introduce a versioned dashboard document

Why:

- the current app saves a bare array of tracks,
- there is no schema version,
- there is no safe place to add opportunities or review state.

Required outcome:

- define a single top-level dashboard document,
- migrate the current track array into `document.tracks`,
- reserve stable keys for future features.

Spec alignment:

- supports current track behavior,
- prepares the app for `Opportunity`,
- reduces risk for future review workflows.

### 2. Extract a storage adapter for Gist

Why:

- the current UI calls Gist directly,
- storage details are coupled to rendering,
- validation and error handling are too thin for the next phase.

Required outcome:

- move Gist fetch and save logic into a storage module,
- make the UI depend on a simple storage contract,
- centralize serialization, parse failure handling, and fallback behavior.

Spec alignment:

- supports `Update the operating picture`,
- supports `Continue working when sync fails`.

### 3. Establish BDD/TDD test infrastructure

Why:

- the software method now requires executable scenario validation,
- the repo still contains the default CRA smoke test,
- and storage and model refactors should be protected before more feature growth.

Required outcome:

- replace the default test baseline with product-specific test scaffolding,
- make it easy to write behavior-oriented tests for data, storage, and presentation layers,
- adopt a red, implement, green workflow for future milestones.

Spec alignment:

- supports every scenario by turning it into an executable contract,
- reduces regression risk during storage and model work.

### 4. Add data normalization and validation

Why:

- current loaded data is parsed and trusted immediately,
- future schema changes will otherwise break older saved documents,
- invalid remote data should not leak directly into rendering.

Required outcome:

- normalize incomplete or older documents into the current shape,
- validate required fields,
- return safe defaults when remote data is malformed.

Spec alignment:

- supports graceful degradation,
- supports future schema evolution without a backend rewrite.

## Milestone pipeline

### Milestone 0: Refactor into layers without changing behavior

Goal:

Create clean boundaries while preserving the current dashboard behavior.

Work:

- extract default document and domain helpers into a data module,
- extract Gist load and save into a storage module,
- keep the current dashboard UI working against the new interfaces,
- avoid visible product changes in this milestone.

Spec coverage:

- `Review active tracks`
- `Inspect one track in context`
- `Update the operating picture`
- `Continue working when sync fails`

Exit criteria:

- the app behaves the same from the user perspective,
- Gist logic no longer lives inside the main dashboard component,
- the dashboard reads and writes a versioned document.

### Milestone 1: Establish BDD/TDD test infrastructure

Goal:

Make executable scenario validation part of the normal development path.

Work:

- replace the default CRA test with product-specific behavior tests,
- add the first tests around dashboard load, track editing, and fallback behavior,
- add tests around data normalization and document migration,
- document the red, implement, green workflow in active use.

Spec coverage:

- `Review active tracks`
- `Inspect one track in context`
- `Update the operating picture`
- `Continue working when sync fails`

Exit criteria:

- the repo no longer relies on the default CRA smoke test,
- at least the current dashboard and storage-critical behaviors are covered by executable tests,
- future milestones can begin by extending tests instead of writing them from scratch.

### Milestone 2: Harden storage behavior

Goal:

Make the Gist-backed system safer before expanding the model.

Work:

- validate remote document shape before use,
- normalize older or partial documents,
- improve save and load error paths,
- define how fallback defaults are produced,
- prepare a migration path from legacy track-array data to the versioned document.

Spec coverage:

- `Update the operating picture`
- `Continue working when sync fails`

Exit criteria:

- malformed or legacy remote data does not crash the app,
- the app can still load a safe dashboard state when persistence fails,
- storage behavior is isolated and testable.

### Milestone 3: Introduce first-class opportunities in the data model

Goal:

Add the minimum truthful concept required for managing multiple interviews separately.

Work:

- define the `Opportunity` record,
- add an `opportunities` collection to the dashboard document,
- create selectors for open opportunities and follow-ups due,
- decide the minimum useful fields for `Opportunity`.

Recommended minimum fields:

- `id`
- `company`
- `role`
- `stage`
- `status`
- `nextAction`
- `followUpBy`
- `notes`

Spec coverage:

- `Manage multiple opportunities`

Exit criteria:

- the application can represent multiple interview threads without overloading one track,
- the model remains simple and versioned.

### Milestone 4: Build the first opportunities view

Goal:

Expose the new opportunity model through a lightweight view.

Work:

- add an opportunities section or view,
- display one row per opportunity,
- show company, stage, and next action,
- visually distinguish overdue follow-ups.

Spec coverage:

- `Manage multiple opportunities`
- reinforces `Daily orientation`

Exit criteria:

- the user can scan open opportunities separately from broad tracks,
- the view supports real interview preparation decisions.

### Milestone 5: Add review-oriented selectors and summaries

Goal:

Support weekly review without turning the product into a complex analytics tool.

Work:

- add pure selectors for stale items, follow-ups due, and active opportunity counts,
- add the smallest useful review summary to the UI,
- keep review logic derived from the document wherever possible.

Spec coverage:

- `Weekly review`

Exit criteria:

- the user can identify what moved, what stalled, and what needs attention next.

### Milestone 6: Extend scenario coverage as features grow

Goal:

Keep expanding executable scenario coverage as new feature slices land.

Work:

- add tests for opportunity selectors and opportunity views,
- add tests for review-oriented summaries,
- keep each new slice inside the red, implement, green loop.

Spec coverage:

- all implemented scenarios,
- with special focus on newly introduced opportunity and review behavior.

Exit criteria:

- each new product slice arrives with passing scenario tests,
- the test suite grows with the product instead of lagging behind it.

## Recommended implementation order

1. Milestone 0
2. Milestone 1
3. Milestone 2
4. Milestone 3
5. Milestone 4
6. Milestone 5
7. Milestone 6

This order keeps storage and domain structure ahead of new UI growth, while moving test infrastructure up early enough to protect the rest of the work.

## Decisions made here

- Keep GitHub Gist as the storage mechanism for the current phase.
- Do not introduce browser-only local storage.
- Do not add a backend yet.
- Do introduce a versioned dashboard document before adding new product concepts.
- Do keep the presentation layer thin and dependent on data and storage modules.

## One ambiguity to resolve soon

The spec still leaves one important product choice open:

- should opportunities live inside the main dashboard page,
- or in a dedicated opportunities view?

Recommendation:

Start with opportunities as a dedicated section inside the main dashboard rather than a fully separate page.

Rationale:

- it preserves the product's core value of unified orientation,
- it keeps navigation simple,
- and it is the smallest UI step that makes multiple opportunities first-class.
