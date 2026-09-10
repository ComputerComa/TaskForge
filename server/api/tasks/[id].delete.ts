import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db/client'
import { tasks } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get()
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  // Demote events scoped to this task to project scope before deleting it
  // -- otherwise they'd be left pointing at nothing.
  demoteEventScope(task.projectId, 'task', id)

  db.delete(tasks).where(eq(tasks.id, id)).run()
  setResponseStatus(event, 204)
  return null
})
