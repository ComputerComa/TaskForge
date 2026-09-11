import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const phase = await db.phase.findUnique({ where: { id } })
  if (!phase) {
    throw createError({ statusCode: 404, statusMessage: 'Phase not found' })
  }

  // Demote events scoped to this phase, or to any task under it, to
  // project scope before the cascade delete removes the phase and its
  // tasks -- otherwise those events would be left pointing at nothing.
  const phaseTasks = await db.task.findMany({ where: { phaseId: id }, select: { id: true } })
  await demoteEventScope(phase.projectId, 'phase', id)
  for (const task of phaseTasks) {
    await demoteEventScope(phase.projectId, 'task', task.id)
  }

  await db.phase.delete({ where: { id } })
  setResponseStatus(event, 204)
  return null
})
