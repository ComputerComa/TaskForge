import { toDataURL } from 'qrcode'
import { useDb } from '~~/server/db/client'

// Starts (or restarts) a TOTP enrollment. The secret is stored right
// away but totpEnabledAt stays null until totp/confirm.post.ts verifies
// a real code -- so re-calling this (e.g. the QR didn't scan) is safe
// and just issues a fresh secret, and a half-finished enrollment never
// silently counts as "2FA enabled".
export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)

  const secret = generateTotpSecret()
  const db = useDb()
  await db.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabledAt: null } })

  const uri = buildTotpUri(user.username, secret)
  const qrDataUrl = await toDataURL(uri)

  return { secret, uri, qrDataUrl }
})
