import { updateTaskSchema } from '~~/shared/schemas/task.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateTaskSchema, event)

  const db = useDb()
  const task = await db.task.update({ where: { id }, data: body }).catch(() => null)
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }
  return task
})
