import { eq } from 'drizzle-orm'
import { updatePhaseSchema } from '~~/shared/schemas/phase.schema'
import { useDb } from '~~/server/db/client'
import { phases } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updatePhaseSchema, event)

  const db = useDb()
  const [phase] = db.update(phases).set(body).where(eq(phases.id, id)).returning().all()
  if (!phase) {
    throw createError({ statusCode: 404, statusMessage: 'Phase not found' })
  }
  return phase
})
