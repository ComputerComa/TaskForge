import { useDb } from '../db/client'
import type { ExportDocument } from '~~/shared/schemas/import-export.schema'

export interface ImportOptions {
  identifier: string
  overwrite: boolean
}

/** Creates (or, with overwrite, replaces) a project from a validated export
 * document inside one transaction -- either every phase/task/event is
 * created and the whole thing succeeds, or nothing is (Prisma rolls the
 * transaction back on any throw). Positions are assigned directly from the
 * document's array order rather than via nextPosition, since there are no
 * existing siblings to append after. Event scopeIds are resolved from the
 * document's ref strings via the maps built while creating phases/tasks. */
export async function createProjectFromImport(document: ExportDocument, options: ImportOptions) {
  const db = useDb()

  return db.$transaction(async tx => {
    if (options.overwrite) {
      // Cascades (see prisma/schema.prisma) take care of the project's
      // phases/tasks/events; nothing to overwrite is not an error.
      await tx.project.delete({ where: { identifier: options.identifier } }).catch(() => null)
    }

    const now = new Date()
    const project = await tx.project.create({
      data: {
        identifier: options.identifier,
        name: document.project.name,
        description: document.project.description,
        status: document.project.status,
        createdAt: now,
        updatedAt: now,
      },
    })

    const phaseIdByRef = new Map<string, number>()
    const taskIdByRef = new Map<string, number>()

    for (const [phaseIndex, phase] of document.phases.entries()) {
      const createdPhase = await tx.phase.create({
        data: {
          projectId: project.id,
          name: phase.name,
          description: phase.description,
          status: phase.status,
          position: phaseIndex,
        },
      })
      phaseIdByRef.set(phase.ref, createdPhase.id)

      for (const [taskIndex, task] of phase.tasks.entries()) {
        const createdTask = await tx.task.create({
          data: {
            projectId: project.id,
            phaseId: createdPhase.id,
            title: task.title,
            description: task.description,
            status: task.status,
            position: taskIndex,
            command: task.command,
            notes: task.notes,
            link: task.link,
            reference: task.reference,
          },
        })
        taskIdByRef.set(task.ref, createdTask.id)
      }
    }

    for (const event of document.events) {
      const scopeId =
        event.scopeType === 'project'
          ? project.id
          : event.scopeType === 'phase'
            ? phaseIdByRef.get(event.scopeRef!)
            : taskIdByRef.get(event.scopeRef!)

      // The document's own schema already rejects unresolvable refs (see
      // exportDocumentSchema's superRefine) -- this is a defensive backstop,
      // not the primary validation.
      if (scopeId === undefined) {
        throw createError({
          statusCode: 400,
          statusMessage: `Event "${event.title}" references an unknown ${event.scopeType} ref`,
        })
      }

      await tx.event.create({
        data: {
          projectId: project.id,
          scopeType: event.scopeType,
          scopeId,
          type: event.type,
          title: event.title,
          description: event.description,
          expectedAt: event.expectedAt ? new Date(event.expectedAt) : null,
          status: event.status,
        },
      })
    }

    return project
  })
}
