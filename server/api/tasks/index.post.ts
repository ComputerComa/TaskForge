import { eq } from 'drizzle-orm'
import { createTaskSchema } from '~~/shared/schemas/task.schema'
import { useDb } from '~~/server/db/client'
import { tasks } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createTaskSchema, event)

  const db = useDb()
  const siblings = db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.phaseId, body.phaseId))
    .all()

  const [task] = runUnique(
    () =>
      db
        .insert(tasks)
        .values({ ...body, position: nextPosition(siblings) })
        .returning()
        .all(),
    `A task with reference "${body.reference}" or slug "${body.slug}" already exists in this project`,
  )

  setResponseStatus(event, 201)
  return { ...task, steps: [], dependencies: [] }
})
