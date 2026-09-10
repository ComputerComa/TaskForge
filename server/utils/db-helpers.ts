import { and, eq } from 'drizzle-orm'
import { useDb } from '../db/client'
import { events, phases, projects, tasks } from '../db/schema'
import type { ProjectStatusSummary } from '~~/shared/types/entities'

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}

/** A `blocker`-type event blocks its scope for as long as it's 'upcoming'
 * -- 'occurred' means the awaited condition happened (block lifted),
 * 'cancelled' means it no longer applies. */
export function isActiveBlocker(event: { type: string; status: string }): boolean {
  return event.type === 'blocker' && event.status === 'upcoming'
}

/** Derives the "Phase 2: on task 3 of 9" progress summary from phase/task
 * completion. Phases and tasks block purely sequentially by position, so
 * the "current" phase is simply the first one (in order) that isn't done
 * -- a phase with tasks is done when every task is done; a phase with no
 * tasks yet falls back to its own manually-set status. */
export function computeProjectStatus(
  phasesInOrder: { name: string; status: string; tasks: { status: string }[] }[],
): ProjectStatusSummary {
  const totalTasks = phasesInOrder.reduce((sum, phase) => sum + phase.tasks.length, 0)
  const doneTasks = phasesInOrder.reduce(
    (sum, phase) => sum + phase.tasks.filter(task => task.status === 'done').length,
    0,
  )

  const isPhaseComplete = (phase: (typeof phasesInOrder)[number]) =>
    phase.tasks.length > 0 ? phase.tasks.every(task => task.status === 'done') : phase.status === 'done'

  const currentIndex = phasesInOrder.findIndex(phase => !isPhaseComplete(phase))
  const allComplete = currentIndex === -1
  const currentPhase = allComplete ? phasesInOrder.at(-1) : phasesInOrder[currentIndex]
  const currentPhaseIndex = allComplete
    ? (phasesInOrder.length > 0 ? phasesInOrder.length : null)
    : currentIndex + 1

  const totalTasksInPhase = currentPhase ? currentPhase.tasks.length : null
  const doneTasksInPhase = currentPhase
    ? currentPhase.tasks.filter(task => task.status === 'done').length
    : 0
  const currentTaskPosition = totalTasksInPhase ? Math.min(doneTasksInPhase + 1, totalTasksInPhase) : null

  return {
    totalPhases: phasesInOrder.length,
    currentPhaseName: currentPhase?.name ?? null,
    currentPhaseIndex,
    currentTaskPosition,
    totalTasksInPhase,
    totalTasks,
    doneTasks,
    progress: totalTasks > 0 ? doneTasks / totalTasks : 0,
    isComplete: phasesInOrder.length > 0 && allComplete,
  }
}

export function fetchProjectSummaries() {
  const db = useDb()
  const allProjects = db.select().from(projects).all()
  const allPhases = db.select().from(phases).orderBy(phases.position).all()
  const allTasks = db.select().from(tasks).all()
  const allEvents = db.select().from(events).all()

  const phasesByProject = groupBy(allPhases, phase => phase.projectId)
  const tasksByPhase = groupBy(allTasks, task => task.phaseId)
  const eventsByProject = groupBy(allEvents, event => event.projectId)

  return allProjects
    .map(project => {
      const projectPhases = phasesByProject.get(project.id) ?? []
      const statusSummary = computeProjectStatus(
        projectPhases.map(phase => ({
          name: phase.name,
          status: phase.status,
          tasks: tasksByPhase.get(phase.id) ?? [],
        })),
      )
      const projectEvents = eventsByProject.get(project.id) ?? []
      const upcomingEvents = projectEvents
        .filter(event => event.status === 'upcoming')
        .sort((a, b) => (a.expectedAt?.getTime() ?? Infinity) - (b.expectedAt?.getTime() ?? Infinity))
        .slice(0, 3)
      const blockers = projectEvents.filter(event => event.scopeType === 'project' && isActiveBlocker(event))

      return { ...project, statusSummary, upcomingEvents, blockers }
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

/** Full phase -> task tree for one project, plus its events, computed
 * status summary, and active blockers (own scope plus inherited from any
 * ancestor scope -- a project-level blocker blocks every phase and task,
 * a phase-level blocker blocks all of that phase's tasks). Used by the
 * Project Detail view. Returns null if the project doesn't exist. */
export function fetchProjectTree(projectId: number) {
  const db = useDb()
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!project) return null

  const projectPhases = db
    .select()
    .from(phases)
    .where(eq(phases.projectId, projectId))
    .orderBy(phases.position)
    .all()

  const projectTasks = db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.position)
    .all()

  const projectEvents = db
    .select()
    .from(events)
    .where(eq(events.projectId, projectId))
    .all()
    .sort((a, b) => (a.expectedAt?.getTime() ?? Infinity) - (b.expectedAt?.getTime() ?? Infinity))

  const tasksByPhase = groupBy(projectTasks, task => task.phaseId)

  const activeBlockers = projectEvents.filter(isActiveBlocker)
  const projectBlockers = activeBlockers.filter(event => event.scopeType === 'project')
  const phaseBlockersById = groupBy(
    activeBlockers.filter(event => event.scopeType === 'phase'),
    event => event.scopeId,
  )
  const taskBlockersById = groupBy(
    activeBlockers.filter(event => event.scopeType === 'task'),
    event => event.scopeId,
  )

  const phaseNodes = projectPhases.map(phase => {
    const phaseBlockers = [...projectBlockers, ...(phaseBlockersById.get(phase.id) ?? [])]
    const phaseTasks = (tasksByPhase.get(phase.id) ?? []).map(task => ({
      ...task,
      blockers: [...phaseBlockers, ...(taskBlockersById.get(task.id) ?? [])],
    }))
    return { ...phase, tasks: phaseTasks, blockers: phaseBlockers }
  })

  const statusSummary = computeProjectStatus(
    phaseNodes.map(phase => ({ name: phase.name, status: phase.status, tasks: phase.tasks })),
  )

  return {
    ...project,
    phases: phaseNodes,
    events: projectEvents,
    statusSummary,
    blockers: projectBlockers,
  }
}

/** Throws a 400/404 H3Error if (scopeType, scopeId) isn't a valid target
 * within `projectId` -- Zod alone can't check this since it needs the DB.
 * Called from the events create/update handlers. */
export function assertValidEventScope(projectId: number, scopeType: string, scopeId: number) {
  const db = useDb()

  if (scopeType === 'project') {
    if (scopeId !== projectId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'scopeId must equal projectId when scopeType is "project"',
      })
    }
    return
  }

  if (scopeType === 'phase') {
    const phase = db
      .select({ id: phases.id })
      .from(phases)
      .where(and(eq(phases.id, scopeId), eq(phases.projectId, projectId)))
      .get()
    if (!phase) {
      throw createError({ statusCode: 404, statusMessage: 'Phase not found in this project' })
    }
    return
  }

  if (scopeType === 'task') {
    const task = db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, scopeId), eq(tasks.projectId, projectId)))
      .get()
    if (!task) {
      throw createError({ statusCode: 404, statusMessage: 'Task not found in this project' })
    }
  }
}

/** Events scoped to a phase or task that's about to be deleted would
 * otherwise be orphaned (their scopeId would point at nothing) -- demote
 * them to project scope instead of losing them. Called before deleting a
 * phase (which cascades its tasks) or a task. */
export function demoteEventScope(projectId: number, scopeType: 'phase' | 'task', scopeId: number) {
  const db = useDb()
  db.update(events)
    .set({ scopeType: 'project', scopeId: projectId })
    .where(and(eq(events.scopeType, scopeType), eq(events.scopeId, scopeId)))
    .run()
}

export function nextPosition(rows: { position: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.position), -1) + 1
}

/** Runs a write that may violate a unique index, converting SQLite's raw
 * constraint error into a 409 rather than letting it surface as a 500. */
export function runUnique<T>(write: () => T, conflictMessage: string): T {
  try {
    return write()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: conflictMessage })
    }
    throw error
  }
}
