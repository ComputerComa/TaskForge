import { eq } from 'drizzle-orm'
import { updateTaskSchema } from '~~/shared/schemas/task.schema'
import { useDb } from '~~/server/db/client'
import { tasks } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateTaskSchema, event)

  const db = useDb()
  const [task] = runUnique(
    () => db.update(tasks).set(body).where(eq(tasks.id, id)).returning().all(),
    'A task with this reference or slug already exists in this project',
  )
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }
  return task
})
