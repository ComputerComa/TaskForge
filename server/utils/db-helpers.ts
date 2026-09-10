import { eq, inArray, sql } from 'drizzle-orm'
import { useDb } from '../db/client'
import { phases, projects, steps, taskDependencies, tasks } from '../db/schema'

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

export function fetchProjectSummaries() {
  const db = useDb()
  const allProjects = db.select().from(projects).all()
  const counts = db
    .select({ projectId: tasks.projectId, count: sql<number>`count(*)` })
    .from(tasks)
    .groupBy(tasks.projectId)
    .all()
  const countByProject = new Map(counts.map(row => [row.projectId, row.count]))

  return allProjects
    .map(project => ({ ...project, taskCount: countByProject.get(project.id) ?? 0 }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

/** Full phase -> task -> step tree for one project, plus each task's
 * outgoing dependency edges (what it depends on). Used by the Project
 * Detail view and by dependency-cycle checks. Returns null if the project
 * doesn't exist. */
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

  const taskIds = projectTasks.map(task => task.id)

  const projectSteps = taskIds.length
    ? db.select().from(steps).where(inArray(steps.taskId, taskIds)).orderBy(steps.position).all()
    : []

  const dependencies = taskIds.length
    ? db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds)).all()
    : []

  const stepsByTask = groupBy(projectSteps, step => step.taskId)
  const dependenciesByTask = groupBy(dependencies, dep => dep.taskId)
  const tasksByPhase = groupBy(projectTasks, task => task.phaseId)

  const phaseNodes = projectPhases.map(phase => ({
    ...phase,
    tasks: (tasksByPhase.get(phase.id) ?? []).map(task => ({
      ...task,
      steps: stepsByTask.get(task.id) ?? [],
      dependencies: (dependenciesByTask.get(task.id) ?? []).map(dep => ({
        id: dep.id,
        dependsOnTaskId: dep.dependsOnTaskId,
      })),
    })),
  }))

  return { ...project, phases: phaseNodes }
}

/** Throws a 422 H3Error if adding `candidate` would introduce a dependency
 * cycle. Any new cycle must pass through the candidate edge (the graph is
 * assumed acyclic before this call, since every prior insert went through
 * this same check), so a DFS from candidate.taskId alone is sufficient --
 * same visiting/visited/trail shape as Kahboard-Seeder's YAML validator. */
export function assertNoDependencyCycle(
  projectId: number,
  candidate: { taskId: number; dependsOnTaskId: number },
) {
  const db = useDb()
  const projectTasks = db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .all()
  const taskIds = projectTasks.map(task => task.id)

  const existingEdges = taskIds.length
    ? db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds)).all()
    : []

  const edgesByTask = new Map<number, number[]>()
  for (const edge of existingEdges) {
    const bucket = edgesByTask.get(edge.taskId)
    if (bucket) bucket.push(edge.dependsOnTaskId)
    else edgesByTask.set(edge.taskId, [edge.dependsOnTaskId])
  }
  const candidateBucket = edgesByTask.get(candidate.taskId)
  if (candidateBucket) candidateBucket.push(candidate.dependsOnTaskId)
  else edgesByTask.set(candidate.taskId, [candidate.dependsOnTaskId])

  const visiting = new Set<number>()
  const visited = new Set<number>()

  const visit = (taskId: number, trail: number[]): number[] | null => {
    if (visited.has(taskId)) return null
    if (visiting.has(taskId)) {
      const cycleStart = trail.indexOf(taskId)
      return [...trail.slice(cycleStart), taskId]
    }
    visiting.add(taskId)
    for (const dependency of edgesByTask.get(taskId) ?? []) {
      const cycle = visit(dependency, [...trail, taskId])
      if (cycle) return cycle
    }
    visiting.delete(taskId)
    visited.add(taskId)
    return null
  }

  const cycle = visit(candidate.taskId, [])
  if (cycle) {
    throw createError({
      statusCode: 422,
      statusMessage: `Dependency cycle detected: ${cycle.join(' -> ')}`,
    })
  }
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
