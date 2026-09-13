import { loginSchema } from '~~/shared/schemas/auth.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  const body = await parseBody(loginSchema, event)

  const db = useDb()
  const user = await db.user.findUnique({
    where: { username: body.username },
    include: { webauthnCredentials: { select: { id: true } } },
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  const valid = await verifyPassword(user.passwordHash, body.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  const methods: ('totp' | 'webauthn')[] = []
  if (user.totpEnabledAt) methods.push('totp')
  if (user.webauthnCredentials.length > 0) methods.push('webauthn')

  if (methods.length === 0) {
    // replaceUserSession (not setUserSession) so a stale `pending` from
    // an earlier, abandoned login attempt on this same browser session
    // can't linger alongside the new `user` key.
    await replaceUserSession(event, { user: { id: user.id, username: user.username, name: user.name } })
    return { twoFactorRequired: false, id: user.id, username: user.username, name: user.name }
  }

  // Password verified, but a second factor is still required -- this
  // session has no `user` key, so it correctly fails every existing
  // requireAuth call until totp/verify.post.ts (or a passkey via
  // /api/webauthn/authenticate) replaces it with a real one.
  await replaceUserSession(event, { pending: { userId: user.id, methods, createdAt: Date.now() } })
  return { twoFactorRequired: true, methods }
})
