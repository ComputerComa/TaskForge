import { eq } from 'drizzle-orm'
import { createPhaseSchema } from '~~/shared/schemas/phase.schema'
import { useDb } from '~~/server/db/client'
import { phases } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createPhaseSchema, event)

  const db = useDb()
  const siblings = db
    .select({ position: phases.position })
    .from(phases)
    .where(eq(phases.projectId, body.projectId))
    .all()

  const [phase] = db
    .insert(phases)
    .values({ ...body, position: nextPosition(siblings) })
    .returning()
    .all()

  setResponseStatus(event, 201)
  return phase
})
