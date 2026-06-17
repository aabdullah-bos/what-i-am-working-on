# Decisions

This file is the running decision log for implementation-level choices.

Use it to capture decisions that materially affect the shape of the work but do not necessarily warrant a full ADR. ADRs remain the right tool for larger architectural decisions with broader consequences.

## How to use this file

- Add a new entry when a decision changes the implementation path, sequencing, or product shape.
- Record the context, the decision, and the rationale while they are still fresh.
- Review this file before starting each new implementation step.

## 2026-06-17

### Opportunities live inside the main dashboard first

Context:

The spec left open whether opportunities should be a dedicated view or part of the main dashboard.

Decision:

Start with opportunities as a section inside the main dashboard instead of a separate page.

Rationale:

- it preserves unified daily orientation,
- it keeps navigation simple,
- and it is the smallest UI step that makes opportunities first-class.

### Use a versioned dashboard document as the durable shape

Context:

The original application saved a bare array of tracks. That shape could not safely absorb opportunities or review state.

Decision:

Adopt a single versioned dashboard document with room for `tracks`, `opportunities`, and `review`.

Rationale:

- it gives the product one durable root object,
- it creates a clean migration path from legacy track arrays,
- and it keeps storage simple while the domain is still changing.

### Separate data, storage, and presentation concerns

Context:

The original dashboard mixed default data, Gist persistence, state management, and rendering inside one component.

Decision:

Split the implementation into:

- a data layer for document shape, normalization, and pure updates,
- a storage layer for Gist load/save behavior,
- and a presentation layer for React rendering and transient UI state.

Rationale:

- it reduces coupling before new opportunity work begins,
- it makes storage behavior testable,
- and it keeps the UI from owning domain and persistence concerns.

### Use product-specific BDD/TDD tests as a foundation

Context:

The repo originally relied on the default CRA smoke test, while the method and milestones were moving toward scenario-driven development.

Decision:

Replace the default smoke test with product-specific scenario tests and use a red, implement, green workflow for future slices.

Rationale:

- it turns the spec into executable behavior,
- it protects ongoing storage and model changes,
- and it makes testing part of the implementation loop instead of a trailing check.

### Move test infrastructure ahead of later feature work

Context:

The initial milestone order placed broader behavioral verification after later product milestones, which conflicted with the desired red/green workflow.

Decision:

Promote BDD/TDD test infrastructure to the first milestone after the layer refactor.

Rationale:

- it aligns the plan with the working method,
- it protects the storage boundary before more growth,
- and it ensures new milestones begin by extending tests rather than inventing them ad hoc.

### Harden the Gist storage boundary before opportunities

Context:

The storage layer initially trusted raw gist content too early and saved whatever document shape it was handed.

Decision:

Normalize and validate loaded content through the storage boundary, detect truncated or invalid gist content explicitly, and normalize documents before save.

Rationale:

- it makes failure modes clearer,
- it reduces the chance of malformed remote data breaking the UI,
- and it keeps the persisted shape consistent before new domain concepts are introduced.

### Define the first truthful opportunity record in the data layer

Context:

Milestone 3 required the product to stop overloading a single interview track and start representing live opportunities as first-class records, but without adding UI complexity yet.

Decision:

Introduce opportunities in the data layer with these fields:

- `id`
- `company`
- `role`
- `stage`
- `status`
- `nextAction`
- `followUpBy`
- `notes`

Use `status` values that map directly to the current operating states in the spec:

- `prepare`
- `follow-up`
- `waiting`
- `done`

Add pure selectors for:

- open opportunities,
- and due follow-ups.

Rationale:

- it matches the smallest truthful unit of job-search work,
- it keeps the first implementation aligned with the spec language,
- and it gives the later UI milestone a stable domain shape without forcing premature workflow complexity.

### Expose opportunities as a read-only dashboard section first

Context:

Milestone 4 required the first UI for opportunities, but the product still needs to stay lightweight and avoid introducing a new navigation model or editing workflow too early.

Decision:

Render open opportunities as a dedicated section inside the main dashboard, below the track list and above the footer.

In this first UI slice:

- show company,
- show role when present,
- show stage,
- show next action,
- and mark overdue follow-ups distinctly.

Do not add opportunity editing or a separate page yet.

Rationale:

- it preserves the dashboard as the single orientation surface,
- it delivers immediate value for interview preparation without expanding workflow complexity,
- and it keeps the first presentation slice aligned with the existing architecture and milestones.

### Define the first review summary around stale items and due follow-ups

Context:

Milestone 5 needed a lightweight review surface, but the product still does not track timestamps for every action or a full review history.

Decision:

Use this initial definition for review pressure:

- an opportunity is stale if it is still open and its `followUpBy` date is in the past,
- a track is stale if its `nextAction` is empty.

Expose the review section as a compact dashboard summary that shows:

- active opportunity count,
- due follow-up count,
- stale item count,
- stale tracks,
- and overdue opportunities that need attention now.

Rationale:

- it is derived from data the product already owns,
- it avoids introducing new persistence fields prematurely,
- and it gives the weekly review milestone a concrete, actionable signal without turning the app into analytics software.

### Keep track next actions grouped with track identity on narrower screens

Context:

The desktop dashboard placed each track's header next action in a far-right column. That worked on wide screens, but it weakened scanability as the viewport narrowed because the action text became visually detached from the track it belonged to.

Decision:

Refactor each track header to use a shared `track-main` summary block that contains both the track label and the header next action.

Use a two-column summary on wider screens, then stack the next action under the track label at narrower widths instead of hiding it or aligning it to the outer dashboard edge.

Rationale:

- it keeps the next action close to the identity of the workstream,
- it preserves a consistent desktop scan pattern,
- and it improves mobile and tablet readability without adding a separate mobile-specific UI path.

### Fix track-row alignment with a fixed controls column

Context:

After grouping the track label and next action, the next-action text still shifted slightly between rows because the urgency badge column was content-sized. Different badge widths changed how much horizontal space remained for the summary block.

Decision:

Use a fixed-width controls column in the track header. Keep the career track label as `Interviews & Opportunities`; the alignment fix should not depend on shortening the label.

Rationale:

- it keeps the next-action starting point visually consistent across rows,
- it removes layout drift caused by badge width differences,
- and it preserves the established track language while solving the actual CSS problem at the layout layer.

### Add opportunities inline inside the dashboard edit flow first

Context:

The product can now render first-class opportunities, but there is still no path to create one from the UI. The current dashboard already has an explicit edit mode and a manual save model backed by one versioned document.

Decision:

Implement the first add-opportunity flow inline inside the existing opportunities section while the dashboard is in edit mode.

In this first creation slice:

- keep the opportunities section visible even when there are no current opportunities,
- add an `Add Opportunity` action in that section,
- create the new record inside the existing dashboard document,
- require `company` and `nextAction`,
- default `status` to `prepare`,
- keep `role`, `stage`, `followUpBy`, and `notes` optional,
- and persist through the existing `Save Changes` flow instead of adding autosave or a separate modal workflow.

Rationale:

- it is the smallest end-to-end slice that closes the current product gap,
- it reuses the existing storage and editing model instead of introducing a second workflow,
- it keeps new opportunity capture close to the dashboard's daily orientation surface,
- and it preserves the product principle that each active item should resolve to a concrete next move.
