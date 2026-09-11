import { updatePhaseSchema } from '~~/shared/schemas/phase.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updatePhaseSchema, event)

  const db = useDb()
  const existing = await db.phase.findUnique({ where: { id }, include: { tasks: { select: { id: true } } } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Phase not found' })
  }

  // Completion is fully derived from task status once a phase has tasks
  // (see computePhaseDisplayStatuses) -- the UI never offers "done" for
  // such phases, but reject a client trying it anyway rather than
  // silently persisting a value nothing will actually honor. 'active' is
  // still allowed for a task-bearing phase: it's what the client sends to
  // un-archive one, and it's otherwise a harmless no-op since displayStatus
  // ignores raw status for task-bearing phases except for 'archived'.
  if (body.status === 'done' && existing.tasks.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "A phase with tasks can't be marked done manually -- complete its tasks instead",
    })
  }

  const phase = await db.phase.update({ where: { id }, data: body })
  return phase
})
