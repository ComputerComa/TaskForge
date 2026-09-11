import { useDb } from '../db/client'
import { exportFormatVersion } from '~~/shared/schemas/import-export.schema'
import type { ExportDocument, ExportEvent } from '~~/shared/schemas/import-export.schema'

/** Builds a portable, versioned export of a project's full phase/task/event
 * tree. Reuses the same query shape as fetchProjectTree, but strips
 * database ids, timestamps, and computed fields (statusSummary/blockers),
 * and swaps each event's raw scopeId for the ref of the phase/task it
 * points at (see shared/schemas/import-export.schema.ts). Returns null if
 * the project doesn't exist. */
export async function buildExportDocument(projectId: number): Promise<ExportDocument | null> {
  const db = useDb()
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project) return null

  const projectPhases = await db.phase.findMany({ where: { projectId }, orderBy: { position: 'asc' } })
  const projectTasks = await db.task.findMany({ where: { projectId }, orderBy: { position: 'asc' } })
  const projectEvents = await db.event.findMany({ where: { projectId } })

  const phaseRefById = new Map(projectPhases.map((phase, index) => [phase.id, `phase-${index}`]))

  const tasksByPhase = new Map<number, typeof projectTasks>()
  for (const task of projectTasks) {
    const bucket = tasksByPhase.get(task.phaseId) ?? []
    bucket.push(task)
    tasksByPhase.set(task.phaseId, bucket)
  }

  const taskRefById = new Map<number, string>()
  for (const [phaseId, tasks] of tasksByPhase) {
    const phaseRef = phaseRefById.get(phaseId)!
    tasks.forEach((task, index) => taskRefById.set(task.id, `${phaseRef}-task-${index}`))
  }

  const phases = projectPhases.map(phase => ({
    ref: phaseRefById.get(phase.id)!,
    name: phase.name,
    description: phase.description,
    status: phase.status as ExportDocument['phases'][number]['status'],
    tasks: (tasksByPhase.get(phase.id) ?? []).map(task => ({
      ref: taskRefById.get(task.id)!,
      title: task.title,
      description: task.description,
      status: task.status as ExportDocument['phases'][number]['tasks'][number]['status'],
      command: task.command,
      notes: task.notes,
      link: task.link,
      reference: task.reference,
    })),
  }))

  // Events are created through assertValidEventScope, so a dangling
  // scopeId shouldn't happen in practice -- but if one ever did, demote it
  // to project scope on export rather than producing an unresolvable ref,
  // mirroring how demoteEventScope handles the same situation on delete.
  const events: ExportEvent[] = projectEvents.map(event => {
    let scopeType = event.scopeType as ExportEvent['scopeType']
    let scopeRef: string | null = null

    if (scopeType === 'phase') {
      scopeRef = phaseRefById.get(event.scopeId) ?? null
    } else if (scopeType === 'task') {
      scopeRef = taskRefById.get(event.scopeId) ?? null
    }

    if (scopeType !== 'project' && scopeRef === null) {
      scopeType = 'project'
    }

    return {
      scopeType,
      scopeRef,
      type: event.type as ExportEvent['type'],
      title: event.title,
      description: event.description,
      expectedAt: event.expectedAt ? event.expectedAt.toISOString() : null,
      status: event.status as ExportEvent['status'],
    }
  })

  return {
    formatVersion: exportFormatVersion,
    project: {
      identifier: project.identifier,
      name: project.name,
      description: project.description,
      status: project.status as ExportDocument['project']['status'],
    },
    phases,
    events,
  }
}
