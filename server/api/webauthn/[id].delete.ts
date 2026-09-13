import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { totpEnabledAt: true, webauthnCredentials: { select: { id: true } } },
  })
  // Scoped to the current user (single-account app, but still filter by
  // userId rather than trusting the id alone).
  await db.webauthnCredential.deleteMany({ where: { id, userId: user.id } })

  // Same "only clear once zero factors remain" rule as totp/disable.
  const remainingWebauthn = (existing?.webauthnCredentials.length ?? 0) - 1
  if (!existing?.totpEnabledAt && remainingWebauthn <= 0) {
    await db.recoveryCode.deleteMany({ where: { userId: user.id } })
  }

  setResponseStatus(event, 204)
  return null
})
