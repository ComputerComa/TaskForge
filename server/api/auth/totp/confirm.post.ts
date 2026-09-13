import { totpConfirmSchema } from '~~/shared/schemas/totp.schema'
import { useDb } from '~~/server/db/client'

// Verifies the code from an in-progress enrollment (totp/enroll.post.ts)
// and, only on success, actually turns 2FA on -- also issuing recovery
// codes, shown to the caller exactly once.
export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)
  const body = await parseBody(totpConfirmSchema, event)

  const db = useDb()
  const record = await db.user.findUnique({ where: { id: user.id }, select: { totpSecret: true } })
  if (!record?.totpSecret) {
    throw createError({ statusCode: 400, statusMessage: 'No TOTP enrollment in progress -- call enroll first' })
  }
  if (!verifyTotpCode(record.totpSecret, body.code)) {
    throw createError({ statusCode: 400, statusMessage: 'Incorrect code' })
  }

  await db.user.update({ where: { id: user.id }, data: { totpEnabledAt: new Date() } })

  return { ok: true }
})
