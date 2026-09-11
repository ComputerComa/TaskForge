import { updateProjectSchema } from '~~/shared/schemas/project.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)
  const body = await parseBody(updateProjectSchema, event)

  const db = useDb()
  const project = await runUnique(
    () => db.project.update({ where: { id }, data: { ...body, updatedAt: new Date() } }),
    body.identifier ? `A project with identifier "${body.identifier}" already exists` : 'Conflict',
  )

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  return project
})
