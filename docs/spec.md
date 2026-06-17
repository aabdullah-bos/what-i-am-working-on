# Product Spec

## Product name

What I'm Working On

## Product intent

This product helps a job seeker maintain clarity and execution momentum across several active workstreams at once.

The immediate problem is not capture. The problem is keeping multiple meaningful efforts in view without losing the next move for any of them.

## Primary user

A builder in transition who is:

- exploring ideas and projects,
- managing live interviews and opportunities,
- networking continuously,
- writing in public to clarify positioning,
- and trying to move forward without fragmenting attention.

## Core job to be done

When I have multiple active tracks competing for attention, I want one view that preserves context and the next move for each track so I can act deliberately instead of reacting to whichever item feels loudest.

## Current scope

The current application supports:

- a single dashboard,
- a flat list of editable tracks,
- one next action per track,
- one writing prompt per track,
- manual urgency labeling,
- persistence to GitHub Gist.

## Product principles

1. Context should stay close to action.
2. Each track should resolve to a concrete next move.
3. The interface should reduce cognitive switching cost.
4. Writing is part of thinking and execution.
5. The system should stay lightweight enough to review daily.

## Key domain concepts

### Track

A track is a standing area of work such as interviews, networking, writing, or a product exploration thread.

Current fields:

- `label`
- `tag`
- `color`
- `urgency`
- `focus`
- `context`
- `nextAction`
- `writePrompt`

### Opportunity

This is now partially implemented as a first-class concept.

The current product can display open opportunities and review overdue follow-ups, but it still does not provide a way to add a new opportunity from the UI.

An opportunity is a specific company, role, contract, or conversation with its own:

- stage,
- due dates,
- next action,
- follow-up state,
- notes,
- and decision criteria.

## User scenarios

### Scenario 1: Daily orientation

The user opens the dashboard in the morning and wants to understand what deserves attention today across all active workstreams.

Desired outcome:

- The user can scan the dashboard in under two minutes.
- Each visible item answers, "what is this?" and "what is next?"
- On narrower screens, each track's next action stays visually grouped with that track instead of drifting into a detached right edge.

### Scenario 2: Interview preparation

The user has multiple live opportunities and needs to prepare for one interview without losing the state of the others.

Desired outcome:

- The user can see all open opportunities.
- The user can distinguish `prepare`, `follow up`, `waiting`, and `done`.
- The user can identify the single next action for each opportunity.

### Scenario 3: Weekly review

At the end of the week, the user wants to assess progress and decide what to emphasize next week.

Desired outcome:

- The user can see what moved.
- The user can see what stalled.
- The user can decide what to drop, continue, or intensify.

## BDD scenarios

### Feature: Review active tracks

```gherkin
Feature: Review active tracks
  As a job seeker managing several fronts
  I want to scan my active tracks quickly
  So that I can decide what deserves attention today

  Scenario: Dashboard loads with current tracks
    Given I have saved tracks in my dashboard storage
    When I open the application
    Then I should see all active tracks
    And each track should show its label
    And each track should show its urgency
    And each track should show its next action
    And each track's next action should stay grouped with that track for compact scanning
```

### Feature: Inspect one track in context

```gherkin
Feature: Inspect one track in context
  As a user moving between workstreams
  I want to expand a track
  So that I can recover the context behind the next action

  Scenario: Expand a track
    Given the dashboard is loaded
    When I open a track
    Then I should see its focus
    And I should see its context
    And I should see its next action
    And I should see its writing prompt
```

### Feature: Update the operating picture

```gherkin
Feature: Update the operating picture
  As a user whose priorities change during the week
  I want to edit track details inline
  So that the dashboard stays useful without a heavy workflow

  Scenario: Edit and save a track
    Given I am viewing the dashboard
    When I enter edit mode
    And I update a track's next action
    And I save changes
    Then the dashboard should persist the new content
    And the saved state should still be available when I return
```

### Feature: Continue working when sync fails

```gherkin
Feature: Continue working when sync fails
  As a user relying on a lightweight system
  I want the app to degrade gracefully
  So that I can still review my work even if persistence is unavailable

  Scenario: Gist load fails
    Given the persistence layer is unavailable
    When I open the application
    Then I should see the default dashboard state
    And I should see an error explaining that syncing is unavailable
```

### Feature: Manage multiple opportunities

```gherkin
Feature: Manage multiple opportunities
  As a user with several live interviews
  I want each opportunity represented separately
  So that I can prepare, follow up, and decide without losing context

  Scenario: Review open opportunities
    Given I have multiple live opportunities
    When I open the dashboard
    Then I should see one row per opportunity
    And each row should show company, stage, and next action
    And overdue follow-ups should be visually distinct
```

### Feature: Capture a new opportunity

```gherkin
Feature: Capture a new opportunity
  As a user tracking live interviews and conversations
  I want to add a new opportunity from the dashboard
  So that new threads enter the system before they slip out of view

  Scenario: Add and save an opportunity
    Given I am viewing the dashboard in edit mode
    And the opportunity does not yet exist
    When I add a new opportunity with company, next action, and status
    And I save changes
    Then the new opportunity should appear in the opportunities section
    And the dashboard should persist the new opportunity
    And the saved opportunity should still be available when I return
```

## Functional requirements

- The app must load and display active tracks.
- The app must allow inline editing of track fields.
- The app must persist track changes to GitHub Gist.
- The app must provide a useful fallback state if persistence fails.
- The app must display opportunities as first-class records inside the dashboard.
- The app must allow the user to add a new opportunity from the dashboard.
- The app should support review workflows that surface stale items and upcoming commitments.

## Non-functional requirements

- The app should remain fast to load and simple to understand.
- The app should work well on desktop and mobile.
- The app should keep writing and editing friction low.
- The data model should be extensible without forcing a full backend early.

## Non-goals for the current phase

- Full calendar integration
- Team collaboration
- Complex kanban or project management features
- Rich analytics beyond lightweight review summaries

## Open questions

- What is the minimum useful set of required fields when creating a new opportunity?
- Should the add-opportunity flow live only inside edit mode or be available as a faster always-on action later?
- Should review data be computed from activity timestamps or explicitly entered by the user?
- When the Gist is unavailable, should local browser storage preserve unsaved edits?
