import { loginSchema } from '~~/shared/schemas/auth.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  const body = await parseBody(loginSchema, event)

  const db = useDb()
  const user = await db.user.findUnique({ where: { username: body.username } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  const valid = await verifyPassword(user.passwordHash, body.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  await setUserSession(event, { user: { id: user.id, username: user.username } })
  return { id: user.id, username: user.username }
})
