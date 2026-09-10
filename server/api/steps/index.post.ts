import { eq } from 'drizzle-orm'
import { createStepSchema } from '~~/shared/schemas/step.schema'
import { useDb } from '~~/server/db/client'
import { steps } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createStepSchema, event)

  const db = useDb()
  const siblings = db
    .select({ position: steps.position })
    .from(steps)
    .where(eq(steps.taskId, body.taskId))
    .all()

  const [step] = db
    .insert(steps)
    .values({ ...body, position: nextPosition(siblings) })
    .returning()
    .all()

  setResponseStatus(event, 201)
  return step
})
