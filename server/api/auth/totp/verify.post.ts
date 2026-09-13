import { totpVerifySchema } from '~~/shared/schemas/totp.schema'
import { useDb } from '~~/server/db/client'

const PENDING_TTL_MS = 5 * 60 * 1000

// Step 2 of login when the account has 2FA enrolled -- reads the
// `pending` session login.post.ts left behind (no `user` key yet, so
// this request is otherwise unauthenticated) and completes it. Accepts
// either a live TOTP code or a recovery code; tries TOTP first since
// it's the common case.
export default defineEventHandler(async event => {
  const session = await getUserSession(event)
  const pending = session.pending
  if (!pending || Date.now() - pending.createdAt > PENDING_TTL_MS) {
    throw createError({ statusCode: 401, statusMessage: 'No login in progress -- sign in again' })
  }

  const body = await parseBody(totpVerifySchema, event)

  const db = useDb()
  const user = await db.user.findUnique({ where: { id: pending.userId } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No login in progress -- sign in again' })
  }

  const validTotp = user.totpSecret ? verifyTotpCode(user.totpSecret, body.code) : false
  const validRecovery = validTotp ? false : await consumeRecoveryCode(user.id, body.code)
  if (!validTotp && !validRecovery) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect code' })
  }

  await replaceUserSession(event, { user: { id: user.id, username: user.username, name: user.name } })
  return { id: user.id, username: user.username, name: user.name }
})
