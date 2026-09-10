# Project Overview: Homelab Project Planner

## Purpose

A personal, standalone project tracker for planning and executing homelab and other personal technical projects. It should match how the author actually thinks about a project: a project has an overall goal, breaks down into a short ordered sequence of phases, each phase is a guided checklist of tasks done roughly in order, and the whole thing is quietly waiting on a handful of external events (deliveries, maintenance windows, etc.) worth tracking separately from the checklist. A dashboard of project cards should give an at-a-glance "visual map" of everything active: current phase, current task, overall progress, and what's coming up next.

This is not a general-purpose PM tool: no teams, no assignees, no dependency graphs. Just a personal cockpit. This is a standalone, personal-oriented tool -- it owns its own planning model and does not depend on or sync with any external project tracker.

## Preferred Stack

- Nuxt 4
- Vue
- TypeScript
- SQLite initially
- Drizzle ORM
- Zod for validation
- Pinia if client-side state becomes non-trivial
- VueUse for useful composables
- SortableJS or a Vue drag/drop wrapper later for reordering phases and tasks

Avoid MongoDB unless the data model changes substantially. The core data is relational: projects contain phases, phases contain tasks, and projects independently contain events.

## Core Concept

```text
Project
  -> Phase (sequential)
    -> Task (sequential checklist item)

Project
  -> Event (dated external milestone, tracked separately from the checklist)
```

Phases and tasks block purely by order: a phase is "current" once every phase before it (in position order) is done, and within it the "current" task is the first one not yet done. There is no free-form dependency graph and no cycle detection to manage -- if something needs to happen out of order, just reorder it.

## Primary User Workflow

1. Create a project: name + overall goal/description.
2. Break it into phases (e.g. "New NAS setup", "Migrate data", "Retire old NAS") -- these run in order.
3. Within each phase, add an ordered task checklist (e.g. "Verify hardware" -> "Update firmware" -> "Install SSDs" -> ...).
4. Optionally log events the project is waiting on (e.g. "SSDs expected to arrive ~Oct 3").
5. Check tasks off as you go; the project's computed status ("Phase 2: on task 3 of 6") and progress bar update automatically.
6. Glance at the dashboard to see every active project's current status, progress, and upcoming events at once.

## Main Views

### Dashboard

Cards for every project, each showing:

- name, overall status (active / on_hold / done / archived), and a one-line description
- computed status: current phase name and "on task X of Y" within it
- a progress bar (tasks done / total tasks)
- the next few upcoming events

This is the primary "how are things going" view -- a visual map, not a plain list.

New projects are created through a guided modal wizard, not a single form:
project basics (name/identifier/goal) -> phases, in order -> that phase's
task checklist, one phase at a time -> optional events -> a review step
that creates everything at once and lands on the new project's detail
page. Phases and tasks can still be added, edited, or reordered
individually later from the Project Detail view.

### Project Detail

One page per project combining:

- an editable header: name, description (the overall goal), status
- the same computed status summary shown on the dashboard card
- phases, in order, each an editable ordered task checklist with inline status/notes/command/link editing and up/down reordering
- an events section: add/edit/remove dated milestones with a note and a status (upcoming / occurred / cancelled)

## Suggested Data Model

### Project

- id
- identifier
- name
- description (the overall goal)
- status
- createdAt
- updatedAt

### Phase

- id
- projectId
- name
- description
- position
- status

### Task

- id
- projectId
- phaseId
- title
- description
- status (pending | done)
- position
- command
- notes
- link

### Event

- id
- projectId
- title
- expectedAt
- note
- status (upcoming | occurred | cancelled)
- createdAt

Current phase/task position and progress percentage are computed on read from phase and task completion, not stored.

## Authentication

Start simple:

- local username/password login
- signed HTTP-only session cookie
- optional reverse-proxy auth support later

Do not build multi-tenant/team auth initially. This is a self-hosted personal/internal tool.

## Implementation Phases

### Phase 1: Core (done)

- Nuxt app, SQLite + Drizzle, local auth/session.
- Project/Phase/Task CRUD with sequential ordering.
- Events CRUD.
- Computed status/progress summary.
- Dashboard and Project Detail views.
- Guided modal wizard for creating a new project.

### Phase 2: Polish

- Drag/drop ordering.
- Search/filtering.
- Trilium links.
- Project templates.
- Backup/export bundle.

## Design Notes

The UI should be restrained, dense, and practical. It should feel like a technical planning tool, not a marketing app.

Prioritize:

- fast data entry
- low friction editing
- clear hierarchy
- an at-a-glance sense of where each project currently stands
- easy tracking of what a project is externally waiting on

Avoid:

- enterprise project-management ceremony
- excessive dashboards
- unnecessary collaboration features
- heavyweight permission models
- overdesigned landing pages

[Kanboard](https://kanboard.org/) ([source](https://github.com/kanboard/kanboard))
is a useful design reference for card/board layout and restrained visual
style -- worth revisiting if a kanban-style view is ever added. This is a
design reference only: TaskForge does not call Kanboard's API, sync with
it, or otherwise integrate with it directly.

## Early Decisions

- Use SQLite first for simple self-hosting.
- This is a standalone app with no external project-tracker dependency.
- Project -> Phase -> Task only (3 levels) -- phases and tasks block purely by sequential order, not a dependency graph.
- Track things a project is externally waiting on (deliveries, maintenance windows) as Events, separate from the task checklist.
- Compute current phase/task/progress from data on read rather than storing it.

## Open Questions

- Should Trilium links be plain URLs, structured note IDs, or both?
- Should an explicitly "on hold" phase or task be representable, or does sequential order plus status cover it?
- Should events support a date range (window) instead of a single expected date, for cases like "arriving sometime Oct 1-5"?
