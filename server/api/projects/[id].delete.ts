import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const deleted = await db.project.delete({ where: { id } }).catch(() => null)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  setResponseStatus(event, 204)
  return null
})
