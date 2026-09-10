import { updateEventSchema } from '~~/shared/schemas/event.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateEventSchema, event)

  const db = useDb()
  const existing = await db.event.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  // Validate the resulting scope, not just whichever half of it changed --
  // e.g. changing only scopeId while scopeType stays 'phase' still needs
  // to be checked against the new id.
  const scopeType = body.scopeType ?? existing.scopeType
  const scopeId = body.scopeId ?? existing.scopeId
  await assertValidEventScope(existing.projectId, scopeType, scopeId)

  const updated = await db.event.update({ where: { id }, data: body })
  return updated
})
