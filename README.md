# TaskForge

A standalone, self-hosted personal project tracker. Project -> Phase ->
Task, with phases and tasks blocking purely by sequential order (no
dependency graph), plus a separate Events list for dated external
milestones (deliveries, maintenance windows). A dashboard of project cards
shows each project's computed status ("Phase 2: on task 3 of 6"), progress,
and upcoming events at a glance. It's a personal-oriented tool with no
dependency on or sync with any external project tracker. See `overview.md`
for the full design and roadmap.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set NUXT_SESSION_PASSWORD (32+ chars, e.g. `openssl rand -base64 32`)
# and ADMIN_USERNAME / ADMIN_PASSWORD for the one local account this app supports.

npm run db:migrate
npm run db:seed   # creates the admin user from .env -- idempotent, safe to re-run

npm run dev
```

There is no signup flow. `db:seed` is the only way an account gets created,
and it no-ops if a user already exists.

## Scripts

- `npm run dev` / `build` / `preview` -- standard Nuxt commands.
- `npm run db:generate` -- regenerate Drizzle migration SQL after editing `server/db/schema.ts`.
- `npm run db:migrate` -- apply pending migrations to the SQLite database at `NUXT_DATABASE_PATH`.
- `npm run db:seed` -- create the admin user from `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
- `npm run typecheck` -- `nuxt typecheck` across the whole app.

## What's built

Auth (local username/password, session cookie), full CRUD for
projects/phases/tasks/events, a computed status/progress summary derived
from task completion, a dashboard of project cards, a guided modal wizard
for creating new projects, and a project detail page: collapsible phases,
an ordered task checklist with details collapsed by default, filter
toggles (hide blocked / actionable only / show completed), an event rail
near the top for scanning and jumping to what an event affects, and an
events section supporting six event types (milestone, blocker, delivery,
decision, maintenance window, note) scoped to a project, phase, or task --
a `blocker`-type event blocks its scope (and cascades down to phases/tasks
under it) until it's marked occurred or cancelled. No drag-and-drop or
search/filtering yet -- see `todo.md`'s "Implementation Phases" and
"Open Questions" for what's still open.
