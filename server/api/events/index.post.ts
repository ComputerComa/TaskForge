import { createEventSchema } from '~~/shared/schemas/event.schema'
import { useDb } from '~~/server/db/client'
import { events } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createEventSchema, event)

  const db = useDb()
  const [created] = db.insert(events).values(body).returning().all()

  setResponseStatus(event, 201)
  return created
})
