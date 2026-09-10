import { eq } from 'drizzle-orm'
import { updateProjectSchema } from '~~/shared/schemas/project.schema'
import { useDb } from '~~/server/db/client'
import { projects } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateProjectSchema, event)

  const db = useDb()
  const [project] = runUnique(
    () =>
      db
        .update(projects)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning()
        .all(),
    body.identifier ? `A project with identifier "${body.identifier}" already exists` : 'Conflict',
  )

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  return project
})
