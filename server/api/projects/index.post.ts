import { createProjectSchema } from '~~/shared/schemas/project.schema'
import { useDb } from '~~/server/db/client'
import { projects } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createProjectSchema, event)

  const db = useDb()
  const now = new Date()
  const [project] = runUnique(
    () =>
      db
        .insert(projects)
        .values({ ...body, createdAt: now, updatedAt: now })
        .returning()
        .all(),
    `A project with identifier "${body.identifier}" already exists`,
  )

  setResponseStatus(event, 201)
  return project
})
