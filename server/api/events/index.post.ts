import { createEventSchema } from '~~/shared/schemas/event.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createEventSchema, event)
  await assertValidEventScope(body.projectId, body.scopeType, body.scopeId)

  const db = useDb()
  const created = await db.event.create({ data: body })

  setResponseStatus(event, 201)
  return created
})
