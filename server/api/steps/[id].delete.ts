import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db/client'
import { steps } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const [deleted] = db.delete(steps).where(eq(steps.id, id)).returning().all()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Step not found' })
  }
  setResponseStatus(event, 204)
  return null
})
