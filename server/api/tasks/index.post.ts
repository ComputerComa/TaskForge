import { createTaskSchema } from '~~/shared/schemas/task.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createTaskSchema, event)

  const db = useDb()
  const siblings = await db.task.findMany({ where: { phaseId: body.phaseId }, select: { position: true } })
  const task = await db.task.create({ data: { ...body, position: nextPosition(siblings) } })

  setResponseStatus(event, 201)
  return task
})
