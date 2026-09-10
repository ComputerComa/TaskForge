import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db/client'
import { tasks } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const [deleted] = db.delete(tasks).where(eq(tasks.id, id)).returning().all()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }
  setResponseStatus(event, 204)
  return null
})
