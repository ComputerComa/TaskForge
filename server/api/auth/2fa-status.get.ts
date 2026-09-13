import { useDb } from '~~/server/db/client'

// Aggregates everything the Settings page's two-factor section needs in
// one call -- whether TOTP is on, and whether any recovery codes exist
// (so it knows whether enabling a first factor needs to also issue them).
export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)

  const db = useDb()
  const [record, webauthnCount, recoveryCodeCount] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { totpEnabledAt: true } }),
    db.webauthnCredential.count({ where: { userId: user.id } }),
    db.recoveryCode.count({ where: { userId: user.id, usedAt: null } }),
  ])

  return {
    totpEnabled: Boolean(record?.totpEnabledAt),
    webauthnCredentialCount: webauthnCount,
    hasRecoveryCodes: recoveryCodeCount > 0,
  }
})
