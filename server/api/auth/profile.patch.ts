import { updateProfileSchema } from '~~/shared/schemas/setup.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)
  const body = await parseBody(updateProfileSchema, event)

  const db = useDb()
  const updated = await db.user.update({ where: { id: user.id }, data: body })

  // name is part of the session (shown in the topbar) -- keep it in
  // sync; merge is fine here, nothing sensitive is at stake.
  await setUserSession(event, { user: { id: updated.id, username: updated.username, name: updated.name } })

  return { name: updated.name, email: updated.email }
})
