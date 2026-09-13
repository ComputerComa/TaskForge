import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  await db.apiToken.delete({ where: { id } }).catch(() => null)
  setResponseStatus(event, 204)
  return null
})
