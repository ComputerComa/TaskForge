import { disableTotpSchema } from '~~/shared/schemas/totp.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)
  const body = await parseBody(disableTotpSchema, event)

  const db = useDb()
  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, webauthnCredentials: { select: { id: true } } },
  })
  if (!record || !(await verifyPassword(record.passwordHash, body.password))) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  await db.user.update({ where: { id: user.id }, data: { totpSecret: null, totpEnabledAt: null } })

  // Recovery codes cover "any second factor is unavailable" -- only
  // revoke them once none are left at all, not on every individual
  // method's removal (a passkey may still be enrolled).
  if (record.webauthnCredentials.length === 0) {
    await db.recoveryCode.deleteMany({ where: { userId: user.id } })
  }

  return { ok: true }
})
