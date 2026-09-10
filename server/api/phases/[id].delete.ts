import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db/client'
import { phases } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const [deleted] = db.delete(phases).where(eq(phases.id, id)).returning().all()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Phase not found' })
  }
  setResponseStatus(event, 204)
  return null
})
