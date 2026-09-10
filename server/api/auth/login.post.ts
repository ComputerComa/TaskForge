import { eq } from 'drizzle-orm'
import { loginSchema } from '~~/shared/schemas/auth.schema'
import { useDb } from '~~/server/db/client'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  const body = await parseBody(loginSchema, event)

  const db = useDb()
  const user = db.select().from(users).where(eq(users.username, body.username)).get()
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
