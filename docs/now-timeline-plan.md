# Plan: "Now" + "Timeline" project detail redesign

## Context

The project detail page currently answers "what's going on with this project"
with three overlapping, inconsistent event/blocker UIs stacked on one page:

1. `EventRail` — a horizontal chip rail of **every** event (blocker or not),
   sorted upcoming-first.
2. Scattered `BlockedBadge`s — on the project header, every phase, and every
   task — all driven by an unconditional inheritance rule in
   `fetchProjectTree` (`server/utils/db-helpers.ts:126-176`): a project-scope
   active blocker (`type==='blocker' && status==='upcoming'`) is copied onto
   *every* phase's `blockers` array, and every phase's blockers (its own +
   the project's) are copied onto *every* task in it. A blocker parked on
   phase 4 makes phase 1 (the one actually being worked on) look no more or
   less blocked than phase 4 itself, and a project-level blocker paints the
   whole tree red regardless of what's actionable right now.
3. `EventList`/`EventItem` — a full inline-editable list of every event
   (6 independently-committing fields each) at the bottom of the page.

The dashboard (`fetchProjectSummaries`) computes a *different*, shallower
blocker rule (project-scope only, no inheritance) than the detail page, so
a project card and its own detail page can disagree about whether the
project "looks blocked."

None of this actually answers "what can I do right now?" or "what's the
upcoming timeline?" — it just surfaces every event with equal weight. This
plan adds a **"Now"** panel that answers the first question using a single,
narrow, purpose-built rule, and moves all other events into a **"Timeline"**
side drawer that answers the second question, without touching how events
are created/edited/stored, without changing Prisma's `Event` schema, and
without regressing the single-active-phase model or the recent phase/task
collapse-by-default UX built earlier in this project.

## Key design decisions

- **No Prisma/Zod schema changes.** `Event.type`/`status`/`scopeType` are
  plain `String` columns (not DB enums), and `'blocker'` already means
  "waiting on" — the bug is in *inheritance scope*, not vocabulary. Renaming
  `'blocker'` -> `'waiting_on'` would touch the Zod enum, stored string
  values (a real data migration), `eventTypeMeta`, `EventItem.vue`'s select,
  and `shared/schemas/import-export.schema.ts`/export-import round-tripping
  for zero behavioral gain. Keep all 6 `eventTypes` as-is.
- **New concept: "current blocker"** — an active blocker
  (`isActiveBlocker`, already in `db-helpers.ts:19-21`) counts toward "Now"
  only if its scope is on the current actionable path: `scopeType==='project'`
  (always applies), or `scopeType==='phase' && scopeId===<the current/active
  phase's id>`, or `scopeType==='task' && scopeId===<that phase's next
  not-done task's id>`. A blocker on a future phase is still a real event
  (still visible/editable in the Timeline, still shown as a phase-level
  `BlockedBadge` when you expand that phase in Work), it just doesn't drive
  "Now" until that phase actually becomes current.
- **Additive, not a rewrite of `blockers` semantics.** `PhaseNode.blockers`/
  `TaskNode.blockers`/`ProjectTree.blockers` keep meaning exactly what they
  mean today (used by `BlockedBadge` in the "Work" section and by
  `useProjectDetailUi.ts`'s `hideBlocked`/`actionableOnly` filters) — a new
  `now: NowState` field is added to `ProjectTree` alongside them, computed
  the same read-time/never-persisted way `displayStatus` already is. This
  keeps the diff small and avoids touching `useProjectDetailUi.ts`,
  `FilterBar.vue`, `ProjectCard.vue`, or `fetchProjectSummaries` at all.
- **Timeline = side drawer** (`USlideover`, Nuxt UI v4, confirmed installed
  and unused elsewhere), opened via a "Timeline" button next to Export.
  `EventList`/`EventItem` move into it unchanged; `EventRail` is retired
  (its one useful behavior, "click an event, jump to & flash its phase/task
  in Work," is ported into the drawer's rows using the exact same
  `uiApi.expandPhase` + `document.getElementById` + `scrollIntoView` +
  `flash-highlight` pattern). Note: `.flash-highlight`/`@keyframes
  flash-highlight` are already **global** styles in
  `app/layouts/default.vue:79-87`, not scoped to `EventRail.vue` — no CSS
  needs to move or be duplicated.

## Implementation

### 1. `server/utils/db-helpers.ts`

Add, next to `isActiveBlocker`:

```ts
/** An active blocker only matters for "Now" if it's on the path actually
 * being worked -- project-wide, or the current phase, or that phase's next
 * task. A blocker parked on a future phase is real (still shown in the
 * Work section's phase/task badges and in the Timeline) but shouldn't make
 * the project look blocked before that phase is ever reached. */
export function isCurrentBlocker(
  event: { type: string; status: string; scopeType: string; scopeId: number },
  current: { phaseId: number | null; taskId: number | null },
): boolean {
  if (!isActiveBlocker(event)) return false
  if (event.scopeType === 'project') return true
  if (event.scopeType === 'phase') return event.scopeId === current.phaseId
  if (event.scopeType === 'task') return event.scopeId === current.taskId
  return false
}

/** What belongs in the "Now" panel: the single active blocker on the
 * current actionable path if one exists, else the current phase's next
 * not-done task, else idle (no current phase, or current phase has no
 * tasks yet). Reuses the same "first phase that isn't complete" notion
 * computePhaseDisplayStatuses already established via `displayStatus`, so
 * this can never disagree with the phase tree's own badges. Tie-break for
 * multiple simultaneous current blockers: project-scope, then
 * current-phase-scope, then current-task-scope (broadest first) -- "Now"
 * is deliberately a single answer, not a list. */
export function computeNowState(
  phasesInOrder: {
    id: number
    name: string
    displayStatus: PhaseDisplayStatus
    tasks: { id: number; title: string; status: string }[]
  }[],
  activeBlockers: EventSummary[],
): NowState {
  const currentPhase = phasesInOrder.find(phase => phase.displayStatus === 'active')
  const projectBlocker = activeBlockers.find(event => event.scopeType === 'project')

  if (!currentPhase) {
    return projectBlocker
      ? { kind: 'blocked', blocker: projectBlocker, phaseId: null, phaseName: null, taskId: null, taskTitle: null }
      : { kind: 'idle', blocker: null, phaseId: null, phaseName: null, taskId: null, taskTitle: null }
  }

  const nextTask = currentPhase.tasks.find(task => task.status !== 'done') ?? null
  const currentBlocker =
    projectBlocker
    ?? activeBlockers.find(event => event.scopeType === 'phase' && event.scopeId === currentPhase.id)
    ?? (nextTask ? activeBlockers.find(event => event.scopeType === 'task' && event.scopeId === nextTask.id) : undefined)

  if (currentBlocker) {
    return { kind: 'blocked', blocker: currentBlocker, phaseId: currentPhase.id, phaseName: currentPhase.name, taskId: nextTask?.id ?? null, taskTitle: nextTask?.title ?? null }
  }
  if (nextTask) {
    return { kind: 'actionable', blocker: null, phaseId: currentPhase.id, phaseName: currentPhase.name, taskId: nextTask.id, taskTitle: nextTask.title }
  }
  return { kind: 'idle', blocker: null, phaseId: currentPhase.id, phaseName: currentPhase.name, taskId: null, taskTitle: null }
}
```

Wire it into `fetchProjectTree`, right after `phaseNodesWithDisplayStatus` is
built (which already has everything `computeNowState` needs — ids, names,
`displayStatus`, tasks): add `now: computeNowState(phaseNodesWithDisplayStatus, activeBlockers)`
to the returned object. `activeBlockers` is already computed earlier in the
same function (line 140) — no new DB query.

No changes to `fetchProjectSummaries`, `computeProjectStatus`,
`computePhaseDisplayStatuses`, `isPhaseComplete`, `assertValidEventScope`, or
`demoteEventScope`.

### 2. `shared/types/entities.ts`

Add, near `ProjectStatusSummary`:

```ts
/** Computed (not stored) -- see db-helpers.ts -> computeNowState. Drives
 * the project detail page's "Now" panel: either the single most relevant
 * active blocker on the current actionable path, or the next task to work
 * on, or idle (no current phase / current phase has no tasks / all done). */
export type NowKind = 'actionable' | 'blocked' | 'idle'
export interface NowState {
  kind: NowKind
  blocker: EventSummary | null
  phaseId: number | null
  phaseName: string | null
  taskId: number | null
  taskTitle: string | null
}
```

Add `now: NowState` to `ProjectTree`. **Not** added to `ProjectSummary` (the
dashboard) — this request is scoped to the project detail page.

### 3. `app/components/projects/NowPanel.vue` (new)

Props: `{ tree: ProjectTree }`. Renders `tree.now`:

- **`actionable`**: a `UAlert`/`UCard` (neutral/primary, soft variant),
  icon `i-lucide-circle-play`, heading `Now: {{ now.taskTitle }}`, subtext
  reusing existing `tree.statusSummary` fields (`Phase {{ currentPhaseIndex }}
  of {{ totalPhases }} -- {{ currentPhaseName }}`) rather than duplicating
  phase-position math. Since the active phase already auto-shows only this
  task by default (existing collapse-to-current-task behavior), no jump
  button is needed here — it's already the one visible task once you scroll
  to Work.
- **`blocked`**: `UAlert` `color="error"` `variant="soft"`, icon
  `i-lucide-octagon-alert`, heading `Waiting on: {{ blocker.title }}`,
  subtext via existing `eventScopeLabel(blocker, tree)` +
  formatted `expectedAt` if set (reuse `EventRail`'s `formatDate` pattern,
  `toLocaleDateString('en-US', {...})` per this repo's established
  SSR-hydration-safe locale-pinning convention). If `blocker.scopeType` is
  `'phase'` or `'task'`, include a small "Jump to it" link reusing the same
  `uiApi.expandPhase(eventPhaseId(blocker, tree))` + `nextTick` +
  `document.getElementById(eventDomId(blocker))` + `scrollIntoView` +
  `flash-highlight` pattern as `EventRail.locate` (ported, see §4). For
  `scopeType==='project'`, no jump target exists — omit the link.
- **`idle`**: one of three muted messages depending on `tree.now.phaseId`/
  `tree.statusSummary.isComplete`: "All phases complete" (isComplete),
  "This phase has no tasks yet" (`phaseId` set but no `taskId`), or
  "No phases yet" (`phaseId` null and not complete).

Placed in `app/pages/projects/[id].vue` right after `#project-header`,
before the `.toolbar` row (where `EventRail` used to sit).

### 4. `app/components/projects/TimelineDrawer.vue` (new)

- `USlideover`, `defineModel<boolean>('open')` — same self-contained pattern
  as `AddEventModal.vue`/`AddTaskModal.vue`/`ImportProjectModal.vue`.
- Props: `{ tree: ProjectTree }`.
- Header: "Timeline" + a `+ Event` `UButton` opening a local
  `addEventOpen` ref -> `<AddEventModal v-model:open="addEventOpen" :tree="tree" />`
  (reused as-is, no changes to that component).
- Body: `<EventList :tree="tree" />`, unchanged — `EventList.vue`/
  `EventItem.vue` need no edits, just a new parent container.
- Port `EventRail.locate(event)` (app/components/projects/EventRail.vue:25-39)
  into this file (or a small shared helper) so clicking an event elsewhere
  in the Timeline still jumps to and flashes the right phase/task. Same
  `uiApi`/`eventPhaseId`/`eventDomId` imports as today.

### 5. `app/pages/projects/[id].vue`

- Add `const timelineOpen = ref(false)`.
- Add a `UButton label="Timeline" icon="i-lucide-list-checks"` next to the
  existing Export button, `@click="timelineOpen = true"`.
- Remove `<BlockedBadge :blockers="tree.blockers" />` from `#project-header`
  ("Now" owns communicating "you're blocked" at the top of the page now; a
  second badge above it would reintroduce the redundancy this change is
  removing).
- Replace `<EventRail :events="tree.events" :tree="tree" />` with
  `<NowPanel :tree="tree" />`.
- Remove `<EventList :tree="tree" />` from the main flow; add
  `<TimelineDrawer :tree="tree" v-model:open="timelineOpen" />` (placement
  in the template doesn't matter for a slideover — put it near the end).
- Optional, cheap: add a plain `<h2>Work</h2>` heading above `<PhaseTree>`
  for scannability, matching the user's own "Now"/"Work"/"Timeline" naming.

### 6. Cleanup

- `app/components/projects/EventRail.vue` becomes unused once step 5 lands
  and step 4's `locate()` port is verified working — delete it (dead code
  is exactly the kind of complexity this change is meant to reduce).
- **No changes** to: `app/components/projects/BlockedBadge.vue`,
  `PhaseNode.vue`, `TaskNode.vue`, `ProjectCard.vue`, `EventList.vue`,
  `EventItem.vue`, `AddEventModal.vue`, `app/utils/eventScope.ts`,
  `app/composables/useProjectDetailUi.ts`, `FilterBar.vue`,
  `server/api/events/*`, `shared/schemas/event.schema.ts`,
  `shared/schemas/import-export.schema.ts`, `server/utils/project-export.ts`,
  `server/utils/project-import.ts`. `now`/`NowState` are purely
  server-computed and never persisted or exported, exactly like
  `displayStatus` already is — confirm during implementation that nothing
  accidentally adds `now` to the export schema (it would be meaningless on
  import, since it's re-derived on every `fetchProjectTree` call).

Phase/task-level `BlockedBadge`s in the Work section deliberately **keep**
today's broader "any blocker anywhere in this phase's/task's inherited
chain" rule — this is intentional (a known future blocker is still useful
information when you expand that phase in the detailed Work view) and
should be called out as such, not mistaken for unfinished work.

## Prisma / schema changes

**None required.** `Event.type`/`status`/`scopeType` are plain `String`
columns — `isCurrentBlocker` is a query-side filter, not a schema concept.

**Separately flagged, not part of this change**: `Event.phaseId`/`taskId`
(prisma/schema.prisma:78-81) and the `Phase.events`/`Task.events`
back-relations are confirmed-unused vestigial FK columns (no app code reads
or writes them). Removing them would be a clean, low-risk follow-up
migration (`npx prisma migrate dev --name drop_unused_event_fk_columns`,
2nd/3rd migration in a young schema with no seeded Project/Phase/Task/Event
data) — but it's an unrelated cleanup and is explicitly left out of this
plan's diff to keep this change small and reviewable on its own.

## Critical files
- `server/utils/db-helpers.ts` — `isCurrentBlocker`, `computeNowState`,
  wire into `fetchProjectTree`
- `shared/types/entities.ts` — `NowState`/`NowKind`, `ProjectTree.now`
- `app/components/projects/NowPanel.vue` — new
- `app/components/projects/TimelineDrawer.vue` — new (ports
  `EventRail.locate`)
- `app/pages/projects/[id].vue` — swap `EventRail`/`EventList` for
  `NowPanel`/`TimelineDrawer` + Timeline button
- Delete: `app/components/projects/EventRail.vue`
- Reused as-is: `app/components/projects/EventList.vue`, `EventItem.vue`,
  `AddEventModal.vue`, `BlockedBadge.vue`, `app/utils/eventScope.ts`
  (`eventScopeLabel`, `eventPhaseId`, `eventDomId`), `useProjectDetailUi.ts`
  (`expandPhase`), the global `.flash-highlight` style in
  `app/layouts/default.vue`

## Verification
`npm run typecheck`, then live in the dev server (no automated test suite
exists in this repo):
1. Project with no blockers at all -> "Now" shows the next actionable task,
   subtext matches `StatusSummary`'s own "Phase X of Y" wording.
2. Add a project-scope blocker -> "Now" flips to "Waiting on: …"; every
   phase/task badge in Work still shows it too (inherited, unchanged).
3. Add a blocker scoped to a **future** phase only (not the current one) ->
   "Now" still shows the actionable next task (this is the key regression
   test — confirms the "future timeline items shouldn't look blocking"
   requirement); that future phase's own `BlockedBadge` in Work still shows
   it once expanded.
4. Add a blocker scoped to the current phase's next task -> "Now" shows
   blocked, with a working "Jump to it" link that expands/scrolls/flashes
   the right task.
5. Open the Timeline drawer -> confirm every event (blocker or not) is
   listed and fully editable exactly as `EventList`/`EventItem` behave
   today; clicking a non-blocker event's row jumps to & flashes its
   phase/task; add a new event via the drawer's `+ Event` button.
6. Mark every task in every phase done -> "Now" shows "All phases complete."
7. Export the project, re-import as a copy -> confirm the copy's events and
   "Now" state (recomputed fresh) look correct; confirm the export JSON
   contains no `now` field.
8. Regression-check the existing phase/task collapse-by-default behavior
   (current phase auto-expanded to its next task, others collapsed) on both
   mock projects (Homelab, Website Relaunch QA) — untouched by this change,
   should still work exactly as before.

No automated test suite exists in this repo (confirmed multiple times this
session) — the manual pass above is the verification bar for this change.
