import { updatePhaseSchema } from '~~/shared/schemas/phase.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updatePhaseSchema, event)

  const db = useDb()
  const phase = await db.phase.update({ where: { id }, data: body }).catch(() => null)
  if (!phase) {
    throw createError({ statusCode: 404, statusMessage: 'Phase not found' })
  }
  return phase
})
