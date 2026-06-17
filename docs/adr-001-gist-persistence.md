# ADR 001: Keep GitHub Gist for persistence in the current phase

## Status

Accepted

## Date

2026-06-17

## Context

The application currently stores dashboard state as a JSON file in a GitHub Gist and reads and writes that file directly from the client.

The product is evolving from a simple track dashboard toward a system that can support multiple active interview opportunities, follow-ups, and review workflows. Before making those product changes, we need a clear decision about whether the current persistence approach is still acceptable for the next phase.

We considered whether to:

- keep GitHub Gist for now,
- move to browser-only local storage,
- or move immediately to a dedicated backend or BaaS.

## Decision

We will keep GitHub Gist as the persistence layer for the current phase of the product.

This is a temporary decision, not a long-term platform commitment.

## Rationale

GitHub Gist is sufficient for the current stage because:

- the app is single-user,
- the data volume is still small,
- the current interaction model is based on deliberate manual saves,
- and cross-device availability matters.

We are explicitly rejecting browser-only local storage for this phase because:

- it is too volatile,
- it can be cleared at any time by the browser or the user,
- it is tied to one browser environment,
- and it does not support seamless use across multiple devices.

## Consequences

### Positive

- Persistence remains simple and already integrated.
- Data remains accessible across devices.
- We avoid premature backend work while the domain model is still changing.
- We can continue building product behavior without blocking on infrastructure.

### Negative

- The app still rewrites the full JSON payload on save.
- Concurrent edits can produce last-write-wins behavior.
- The current client-side token approach is not an acceptable long-term security model.
- Larger future data shapes may outgrow the comfort zone of a single Gist-backed JSON file.

## Guardrails

This decision remains acceptable only while the following are true:

- usage is effectively single-user,
- writes remain relatively infrequent,
- the stored payload remains small,
- and the product does not require conflict-aware collaboration or high write reliability.

## Triggers to revisit

We should revisit this decision when one or more of the following become true:

- opportunities become first-class records with significantly more metadata,
- autosave or higher-frequency writes are introduced,
- multi-tab or multi-session editing becomes common,
- sync failures become user-visible in normal use,
- or the security model needs to support a deployed application responsibly.

## Rejected alternative

### Browser-only local storage

Rejected for now because it trades simplicity for fragility. It may be acceptable for a disposable offline prototype, but it is not a good fit for a cross-device personal operating system for job search execution.

## Follow-up

When the current persistence model begins to constrain product behavior, create a follow-on ADR comparing:

- a small authenticated backend,
- a BaaS-backed data store,
- or another durable cross-device persistence model.
