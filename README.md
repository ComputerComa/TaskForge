# TaskForge

A standalone, self-hosted homelab project planner. Project -> Phase -> Task
-> Step, with task dependencies. It's a personal-oriented tool with no
dependency on or sync with any external project tracker. See `overview.md`
for the full design and the longer-term roadmap (more views, polish) beyond
this first slice.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set NUXT_SESSION_PASSWORD (32+ chars, e.g. `openssl rand -base64 32`)
# and ADMIN_USERNAME / ADMIN_PASSWORD for the one local account this slice supports.

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

## What's in this slice

Auth (local username/password, session cookie), full CRUD for
projects/phases/tasks/steps, task dependencies with cycle prevention and a
"blocked" indicator, a project list, and a single combined project detail
view (phases -> tasks -> steps as an inline-editable tree). No Board/Phase
Map/Next Actions views or drag-and-drop yet -- see `overview.md`'s
"Implementation Phases" for what comes after.
