import { createPhaseSchema } from '~~/shared/schemas/phase.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createPhaseSchema, event)

  const db = useDb()
  const siblings = await db.phase.findMany({ where: { projectId: body.projectId }, select: { position: true } })
  const phase = await db.phase.create({ data: { ...body, position: nextPosition(siblings) } })

  setResponseStatus(event, 201)
  return phase
})
