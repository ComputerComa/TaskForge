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
# and ADMIN_USERNAME for the one local account this app supports.

npm run db:migrate
npm run db:seed   # creates the admin user with a generated password

npm run dev
```

There is no signup flow. `db:seed` is the only way an account gets created,
and it no-ops if a user already exists.

## Scripts

- `npm run dev` / `build` / `preview` -- standard Nuxt commands.
- `npm run db:generate` -- generate Prisma Client from the supplied `prisma/schema.prisma`.
- `npm run db:migrate` -- apply pending Prisma migrations.
- `npm run db:seed` -- create the admin user from `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
- `npm run typecheck` -- `nuxt typecheck` across the whole app.

## MCP (Claude / ChatGPT access)

TaskForge exposes an MCP endpoint at `/mcp` so an assistant can read and
manage your projects directly -- list/get/export projects, create and
update phases/tasks/events, mark tasks done, resolve blockers, and more
(see `server/utils/mcp-server.ts` for the full tool list).

It's authenticated with a bearer token, separate from your login session:

1. Log in to TaskForge and open **Settings** (gear icon, top right).
2. Under "MCP access tokens", click **New token**, name it (e.g. "Claude"),
   and copy the token shown -- it's shown exactly once.
3. Add TaskForge as a custom connector, pointing it at
   `https://<your-taskforge-host>/mcp`:
   - **Claude.ai**: Settings -> Connectors -> Add custom connector. Use the
     static header option (`Authorization: Bearer <token>`) rather than OAuth.
   - **ChatGPT**: Settings -> Apps -> Advanced -> Developer mode -> Connectors
     -> Create, with "Token" auth and the same header.

There's no OAuth authorization server behind this -- just a static,
revocable credential per client, checked on every request to `/mcp`. Revoke
a token any time from the Settings page; it takes effect immediately.
Since the token is a plain bearer credential, only expose `/mcp` over HTTPS.

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
