import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const task = await db.task.findUnique({ where: { id } })
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  // Demote events scoped to this task to project scope before deleting it
  // -- otherwise they'd be left pointing at nothing.
  await demoteEventScope(task.projectId, 'task', id)

  await db.task.delete({ where: { id } })
  setResponseStatus(event, 204)
  return null
})
