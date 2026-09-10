import { eq } from 'drizzle-orm'
import { updateEventSchema } from '~~/shared/schemas/event.schema'
import { useDb } from '~~/server/db/client'
import { events } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateEventSchema, event)

  const db = useDb()
  const existing = db.select().from(events).where(eq(events.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  // Validate the resulting scope, not just whichever half of it changed --
  // e.g. changing only scopeId while scopeType stays 'phase' still needs
  // to be checked against the new id.
  const scopeType = body.scopeType ?? existing.scopeType
  const scopeId = body.scopeId ?? existing.scopeId
  assertValidEventScope(existing.projectId, scopeType, scopeId)

  const [updated] = db.update(events).set(body).where(eq(events.id, id)).returning().all()
  return updated
})
