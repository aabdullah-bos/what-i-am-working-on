# What I'm Working On

`What I'm Working On` is a small personal dashboard for managing active workstreams while searching for a job.

The current product is designed to answer one question quickly:

`What matters right now, and what is the next concrete action for each area of work?`

Today the app organizes work into a set of editable tracks such as interviews, networking, writing, and product exploration. Each track carries a focus statement, context, one next action, a writing prompt, and an urgency label. The dashboard reads and writes that state to a GitHub Gist so it can act as a lightweight, always-available control panel.

## What the app does today

- Shows a list of active tracks on a single dashboard.
- Expands each track to reveal focus, context, next action, and writing prompt.
- Supports inline editing for track content.
- Persists changes to a GitHub Gist.
- Falls back to local defaults if the Gist is unavailable.

## Why this exists

Most task tools are good at storing items and bad at preserving strategic context.

This app takes the opposite approach. It is intentionally small and opinionated:

- Each track should have a clear purpose.
- Each track should expose one next action.
- Writing is part of execution, not a separate activity.
- The dashboard should help maintain momentum across multiple fronts without becoming a complex project manager.

## Current product shape

The application currently uses a flat `track` model. Each track contains:

- `label`
- `tag`
- `color`
- `urgency`
- `focus`
- `context`
- `nextAction`
- `writePrompt`

That model works well for broad areas of work, but it starts to strain when one track contains several live opportunities or interviews. The next phase of product work should likely introduce a deeper model for opportunities, follow-ups, and review workflows.

## Tech stack

- React
- Create React App
- GitHub Gist as lightweight persistence

The main product logic lives in [src/aquil-dashboard.jsx](/Users/aquilabdullah/devel/projects/what-i-am-working-on/src/aquil-dashboard.jsx:1).

## Local development

1. Install dependencies:

```sh
npm install
```

2. Create a `.env` file with:

```env
REACT_APP_GIST_ID=your_gist_id
REACT_APP_GITHUB_TOKEN=your_github_token
```

3. Start the app:

```sh
npm start
```

4. Build for production:

```sh
npm run build
```

## Product documents

- Spec: [docs/spec.md](docs/spec.md)
- Software method: [docs/software-method.md](docs/software-method.md)
- Decision log: [docs/decisions.md](docs/decisions.md)
- ADR 001, persistence for current phase: [docs/adr-001-gist-persistence.md](docs/adr-001-gist-persistence.md)
- Milestones and implementation pipeline: [docs/milestones.md](docs/milestones.md)

## Near-term product direction

The highest-value improvements are:

- Represent interview opportunities as first-class objects instead of one overloaded track.
- Add follow-up and review mechanics, not just urgency labels.
- Turn the dashboard into a weekly operating system for job search execution.
