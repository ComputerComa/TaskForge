import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const deleted = await db.event.delete({ where: { id } }).catch(() => null)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  setResponseStatus(event, 204)
  return null
})
