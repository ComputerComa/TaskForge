import { createProjectSchema } from '~~/shared/schemas/project.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createProjectSchema, event)

  const db = useDb()
  const now = new Date()
  const project = await runUnique(
    () => db.project.create({ data: { ...body, createdAt: now, updatedAt: now } }),
    `A project with identifier "${body.identifier}" already exists`,
  )

  setResponseStatus(event, 201)
  return project
})
