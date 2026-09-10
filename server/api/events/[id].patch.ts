import { eq } from 'drizzle-orm'
import { updateEventSchema } from '~~/shared/schemas/event.schema'
import { useDb } from '~~/server/db/client'
import { events } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateEventSchema, event)

  const db = useDb()
  const [updated] = db.update(events).set(body).where(eq(events.id, id)).returning().all()
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  return updated
})
