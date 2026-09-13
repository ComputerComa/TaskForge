import { randomBytes } from 'node:crypto'
import { useDb } from '../db/client'

// Long enough to be unguessable on its own, short enough to stay a cheap,
// non-secret index -- the actual credential check is always the hash
// comparison below, never the prefix match by itself.
const TOKEN_PREFIX_LENGTH = 15

/** Generates a new bearer token for the MCP endpoint. Returns both the raw
 * token (shown to the caller exactly once) and the prefix that gets stored
 * in the clear for cheap lookup -- see the ApiToken model for why. */
export function generateApiToken(): { token: string; tokenPrefix: string } {
  const token = `tf_${randomBytes(24).toString('base64url')}`
  return { token, tokenPrefix: token.slice(0, TOKEN_PREFIX_LENGTH) }
}

/** Looks up the bearer token presented on an MCP request. Uses the
 * (non-secret) prefix to narrow to a handful of candidate rows, then hashes
 * the full token against each candidate -- collisions on just the prefix
 * are astronomically unlikely but handled correctly regardless. Returns
 * null for anything that doesn't verify, and updates lastUsedAt on success
 * so the settings page can show which tokens are actually in use. */
export async function findApiTokenByRawToken(token: string): Promise<{ id: number; name: string } | null> {
  if (!token.startsWith('tf_')) return null

  const db = useDb()
  const candidates = await db.apiToken.findMany({
    where: { tokenPrefix: token.slice(0, TOKEN_PREFIX_LENGTH) },
  })

  for (const candidate of candidates) {
    if (await verifyPassword(candidate.tokenHash, token)) {
      await db.apiToken.update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
      return { id: candidate.id, name: candidate.name }
    }
  }
  return null
}
