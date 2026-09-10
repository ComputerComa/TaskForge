import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db/client'
import { taskDependencies } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const [deleted] = db.delete(taskDependencies).where(eq(taskDependencies.id, id)).returning().all()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Dependency not found' })
  }
  setResponseStatus(event, 204)
  return null
})
