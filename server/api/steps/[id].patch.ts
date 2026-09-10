import { eq } from 'drizzle-orm'
import { updateStepSchema } from '~~/shared/schemas/step.schema'
import { useDb } from '~~/server/db/client'
import { steps } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateStepSchema, event)

  const db = useDb()
  const [step] = db.update(steps).set(body).where(eq(steps.id, id)).returning().all()
  if (!step) {
    throw createError({ statusCode: 404, statusMessage: 'Step not found' })
  }
  return step
})
