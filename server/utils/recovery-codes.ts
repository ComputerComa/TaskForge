import { randomBytes } from 'node:crypto'
import { useDb } from '../db/client'

const RECOVERY_CODE_COUNT = 10

/** Generates a fresh batch of one-time recovery codes for a user,
 * replacing any existing ones (used when 2FA is first enabled, and when
 * the user explicitly regenerates them from Settings). Returns the raw
 * codes -- shown to the caller exactly once, same as an API token;
 * only their hashes are stored. */
export async function generateRecoveryCodes(userId: number): Promise<string[]> {
  const db = useDb()
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => `tf-${randomBytes(5).toString('base64url')}`)

  await db.$transaction([
    db.recoveryCode.deleteMany({ where: { userId } }),
    db.recoveryCode.createMany({
      data: await Promise.all(codes.map(async code => ({ userId, codeHash: await hashPassword(code) }))),
    }),
  ])

  return codes
}

/** Checks a submitted code against a user's unused recovery codes,
 * marking the first match as used (single-use) so it can't be replayed.
 * Returns whether it matched. */
export async function consumeRecoveryCode(userId: number, code: string): Promise<boolean> {
  const db = useDb()
  const candidates = await db.recoveryCode.findMany({ where: { userId, usedAt: null } })

  for (const candidate of candidates) {
    if (await verifyPassword(candidate.codeHash, code)) {
      await db.recoveryCode.update({ where: { id: candidate.id }, data: { usedAt: new Date() } })
      return true
    }
  }
  return false
}
