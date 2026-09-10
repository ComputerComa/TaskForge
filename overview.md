# Project Overview: Homelab Project Planner

## Purpose

Build a small self-hosted web application for planning and executing technical projects, especially homelab infrastructure work. The app should support two complementary workflows:

1. A broad project overview: projects, phases, top-level tasks, status, blockers, and progress.
2. A focused implementation view: task details, ordered steps/subtasks, notes, commands, links, and verification checklists.

The app should feel closer to a personal technical project cockpit than a business project management platform. This is a standalone, personal-oriented tool -- it owns its own planning model and does not depend on or sync with any external project tracker.

## Preferred Stack

- Nuxt 4
- Vue
- TypeScript
- SQLite initially
- Drizzle ORM
- Zod for validation
- Pinia if client-side state becomes non-trivial
- VueUse for useful composables
- SortableJS or a Vue drag/drop wrapper later for reordering phases, tasks, and steps

Avoid MongoDB unless the data model changes substantially. The core data is relational: projects contain phases, phases contain tasks, tasks contain steps, and dependencies point between tasks or steps.

## Core Concept

```text
Project
  -> Phase
    -> Task
      -> Step
```

## Primary User Workflow

1. Create or select a project.
2. Define major phases.
3. Create tasks inside phases.
4. Add ordered implementation steps/subtasks to each task.
5. Define dependencies between tasks.
6. Optionally define dependencies between steps.
7. Review a generated plan/map.
8. Work from a focused "next action" or task execution view.

## Main Views

### Project List

Shows all projects with status, progress, last updated time, and quick links to overview/task views.

### Project Overview

A high-level view of the selected project:

- project metadata
- phases
- task counts
- status summary
- blocked/unblocked tasks
- next recommended task

### Phase Map

Shows the project as phases containing tasks. This is the "what are the major steps in this project?" view.

Features:

- reorder phases
- add/edit/delete phases
- show task dependencies
- show phase progress
- collapse/expand phases

### Board View

Kanban-style view grouped by status:

- Backlog
- Ready
- Work in progress
- Waiting
- Done

### Task Detail / TaskList View

Focused execution screen for one task:

- title
- description
- phase
- status
- assignee/owner
- dependencies
- ordered steps/subtasks
- notes
- links to Trilium or other documentation
- command snippets
- verification checklist

This is the "what are the specific implementations/subtasks in this task?" view.

### Next Actions

Shows tasks and steps that are ready to work on:

- no incomplete dependencies
- not done
- not waiting
- sorted by phase/order/priority

This should help answer: "What can I actually do next?"

## Suggested Data Model

### Project

- id
- identifier
- name
- description
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
- reference
- slug
- title
- description
- status
- assignee
- dueAt
- position

### Step

- id
- taskId
- title
- description
- status
- position
- command
- notes
- link

### TaskDependency

- id
- taskId
- dependsOnTaskId

### StepDependency

- id
- stepId
- dependsOnStepId

## Authentication

Start simple:

- local username/password login
- signed HTTP-only session cookie
- optional reverse-proxy auth support later

Do not build multi-tenant/team auth initially. This is a self-hosted personal/internal tool.

## Implementation Phases

### Phase 1: Nuxt Skeleton

- Create Nuxt app with TypeScript.
- Add SQLite + Drizzle.
- Add basic layout and navigation.
- Add local auth/session handling.
- Add initial database schema and migrations.

### Phase 2: Core CRUD

- Projects
- Phases
- Tasks
- Steps
- Task dependencies
- Basic status changes

### Phase 3: Primary Views

- Project list
- Project overview
- Phase map
- Board view
- Task detail / TaskList view
- Next actions view

### Phase 4: Polish

- Drag/drop ordering.
- Better dependency picker.
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
- visible blockers
- easy next-action discovery
- readable task detail pages

Avoid:

- enterprise project-management ceremony
- excessive dashboards
- unnecessary collaboration features
- heavyweight permission models
- overdesigned landing pages

[Kanboard](https://kanboard.org/) ([source](https://github.com/kanboard/kanboard))
is a useful reference for the Board View and general kanban interaction
patterns -- its column/card layout and restrained visual style are worth
studying. This is a design reference only: TaskForge does not call
Kanboard's API, sync with it, or otherwise integrate with it directly.

## Early Decisions

- Use SQLite first for simple self-hosting.
- This is a standalone app with no external project-tracker dependency.
- Model phases explicitly.
- Model steps separately from tasks.
- Add step dependencies only after task dependencies are solid.

## Open Questions

- Should phases have their own statuses, or should phase status be derived from tasks?
- Should steps support dependencies in v1, or should they stay ordered checklists initially?
- Should Trilium links be plain URLs, structured note IDs, or both?
- Should task references be manually entered, auto-generated, or both?
