import type { AuthenticatorTransportFuture } from '@simplewebauthn/types'
import { useDb } from '~~/server/db/client'

const CHALLENGE_TTL_MS = 5 * 60 * 1000

// What getCredential hands onSuccess -- extends the library's base
// WebAuthnCredential with enough of our own User/WebauthnCredential rows
// to finish the login and update the row afterward, both of which the
// base type only knows via its [key: string]: unknown index signature.
interface LoginCredential {
  id: string
  publicKey: string
  counter: number
  backedUp: boolean
  transports: AuthenticatorTransportFuture[]
  dbId: number
  userId: number
  username: string
  name: string
  [key: string]: unknown
}

// Logs in with a passkey -- driven by useWebAuthn().authenticate()
// client-side, called with no userName (this is a single-account app,
// so there's nothing to disambiguate). A successful passkey assertion is
// a complete login on its own, same as GitHub/Google treat it -- it
// doesn't additionally require a TOTP code, unlike the password path.
export default defineWebAuthnAuthenticateEventHandler<LoginCredential>({
  async storeChallenge(event, challenge, attemptId) {
    await setUserSession(event, { webauthnChallenge: { attemptId, challenge, createdAt: Date.now() } })
  },
  async getChallenge(event, attemptId) {
    const session = await getUserSession(event)
    const pending = session.webauthnChallenge
    if (!pending || pending.attemptId !== attemptId || Date.now() - pending.createdAt > CHALLENGE_TTL_MS) {
      return ''
    }
    return pending.challenge
  },

  async getCredential(event, credentialID) {
    const db = useDb()
    const record = await db.webauthnCredential.findUnique({
      where: { credentialId: credentialID },
      include: { user: { select: { id: true, username: true, name: true } } },
    })
    if (!record) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown passkey' })
    }
    return {
      id: record.credentialId,
      publicKey: record.publicKey,
      counter: record.counter,
      backedUp: record.backedUp,
      transports: record.transports as AuthenticatorTransportFuture[],
      dbId: record.id,
      userId: record.user.id,
      username: record.user.username,
      name: record.user.name,
    }
  },

  async onSuccess(event, { credential, authenticationInfo }) {
    const db = useDb()
    await db.webauthnCredential.update({
      where: { id: credential.dbId },
      data: { counter: authenticationInfo.newCounter, lastUsedAt: new Date() },
    })

    // Full login in one step -- clears any stray `pending`/challenge
    // state left over from a password attempt too, since replace (not
    // merge) starts the session completely clean.
    await replaceUserSession(event, {
      user: { id: credential.userId, username: credential.username, name: credential.name },
    })
  },
})
