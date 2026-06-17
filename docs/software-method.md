# Software Method

## Method name

Scenario-first execution software method

## Why this method fits this product

This product exists to reduce ambiguity and increase execution quality. The same standard should apply to how it is built.

The method below is designed for software that starts from real operating pain, stays close to user behavior, and favors small vertical slices over abstract architecture work.

## The method

### 1. Start with the operating tension

Describe the real situation in plain language before naming features.

Example:

`I now have multiple live interviews and the current single-track view does not preserve enough context to manage them well.`

If the tension is vague, the product work will drift.

### 2. Name the user decision that must get easier

Every feature should improve a concrete decision.

Examples:

- What should I work on today?
- Which opportunity needs follow-up first?
- What should I prepare before tomorrow's interview?
- What did I actually move this week?

If a feature does not improve a decision, it is probably interface noise.

### 3. Write behavior before structure

Define the feature with scenarios before changing the data model or UI.

Use BDD-style language:

- Given the user state
- When the user takes an action
- Then the product must make the outcome clear

This prevents building data structures that do not map to lived behavior.

### 4. Choose the smallest truthful domain model

Introduce only the concepts required to make the scenario true.

For this app:

- `Track` is a valid concept.
- `Opportunity` becomes necessary when one interview track contains multiple live threads.

Do not overload one object when the user is clearly managing two different kinds of things.

### 5. Build vertical slices, not disconnected layers

Implement one end-to-end slice at a time:

- domain shape,
- UI representation,
- persistence,
- empty and error states,
- behavioral verification.

A slice is done when the user can actually use it, not when the internal model looks clean.

### 6. Keep the next action visible

Every feature should make next actions easier to see, choose, or complete.

This is both a product principle and an engineering filter. If a change increases data without increasing action clarity, it likely needs to be simplified.

### 7. Make review part of the product and the process

The product should support review rhythms, and the engineering process should do the same.

After each meaningful change:

- confirm what problem got clearer,
- confirm what new complexity was introduced,
- decide what the next missing behavior is.

### 8. Document decisions while they are fresh

Update the README, spec, and method when product assumptions change. The repo should explain:

- what the app is,
- who it is for,
- what problem it solves,
- what the next design pressure is.

## Working loop

Use this loop for each feature:

1. Capture the tension in one sentence.
2. Write one or more BDD scenarios.
3. Identify the minimum domain change.
4. Implement the smallest usable vertical slice.
5. Verify the behavior manually and, where practical, with tests.
6. Record what changed in the docs.

## Definition of done

A change is done when:

- the user scenario is materially easier,
- the interface reflects the correct domain concepts,
- success and failure states are both understandable,
- the data model is still simpler than the problem it solves,
- and the docs explain the new behavior.

## Filters for deciding what to build

Build something if it:

- reduces ambiguity,
- shortens recovery time when context is lost,
- makes follow-up less likely to slip,
- or increases the quality of decisions made from the dashboard.

Do not build something just because it is common in productivity software.

## Practical heuristics

- Prefer explicit states over mental bookkeeping.
- Prefer one decisive field over three weak proxy fields.
- Prefer review views over more tags.
- Prefer domain clarity over UI cleverness.
- Prefer small persistent systems over premature backend complexity.

## Applying the method to this repo now

The next strong candidate feature is a first-class opportunities model.

Why:

- the current flat track model is being asked to hold too many independent interview threads,
- the user scenario is already clear,
- the new concept maps directly to a real-world unit of work,
- and the product value comes from better decision support, not more generic task storage.
