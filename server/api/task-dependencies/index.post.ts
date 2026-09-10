import { and, eq } from 'drizzle-orm'
import { addTaskDependencySchema } from '~~/shared/schemas/task-dependency.schema'
import { useDb } from '~~/server/db/client'
import { taskDependencies, tasks } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(addTaskDependencySchema, event)

  const db = useDb()
  const task = db.select().from(tasks).where(eq(tasks.id, body.taskId)).get()
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }
  const dependsOn = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, body.dependsOnTaskId), eq(tasks.projectId, task.projectId)))
    .get()
  if (!dependsOn) {
    throw createError({ statusCode: 404, statusMessage: 'Dependency task not found in this project' })
  }

  assertNoDependencyCycle(task.projectId, body)

  const [dependency] = runUnique(
    () => db.insert(taskDependencies).values(body).returning().all(),
    'This dependency already exists',
  )

  setResponseStatus(event, 201)
  return dependency
})
