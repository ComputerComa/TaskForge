import { useDb } from '~~/server/db/client'

const CHALLENGE_TTL_MS = 5 * 60 * 1000

// The shape validateUser hands onSuccess -- extends the library's base
// WebAuthnUser with the account's real numeric id and the user-chosen
// device label, both of which the base type only knows via its
// [key: string]: unknown index signature (not strongly typed).
interface RegisteringUser {
  id: number
  userName: string
  displayName?: string
  credentialName?: string
  [key: string]: unknown
}

// Enrolls a new passkey for the (already logged in) account -- driven by
// useWebAuthn().register() client-side. Built on nuxt-auth-utils' own
// WebAuthn support (enabled via `auth: { webAuthn: true }` in
// nuxt.config.ts): it runs the full @simplewebauthn/server ceremony
// internally, we only supply the DB/session glue below.
export default defineWebAuthnRegisterEventHandler<RegisteringUser>({
  // Runs before both the options-generation and verify calls, for every
  // request -- the one gate that makes registration require a session:
  // without it, anyone reaching this endpoint could enroll their own
  // passkey against the account.
  // Requires a discoverable (resident-key) credential -- login (see
  // /api/webauthn/authenticate) is usernameless, so the browser needs to
  // be able to list this account's passkey on its own rather than being
  // told which credential id to look for.
  getOptions() {
    return { authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' } }
  },

  async validateUser(userBody, event) {
    const { user } = await requireAuth(event)
    if (userBody.userName !== user.username) return false
    return {
      id: user.id,
      userName: userBody.userName,
      displayName: userBody.displayName,
      credentialName: typeof userBody.credentialName === 'string' ? userBody.credentialName : undefined,
    }
  },

  // Random per-attempt challenge, kept only in the sealed session cookie
  // (never trusted from the client). Omitting storeChallenge/getChallenge
  // isn't a lighter option here -- the library forces the challenge to
  // "" in that case, which is a real security hole, not a default worth
  // relying on.
  async storeChallenge(event, challenge, attemptId) {
    await setUserSession(event, { webauthnChallenge: { attemptId, challenge, createdAt: Date.now() } })
  },
  async getChallenge(event, attemptId) {
    const session = await getUserSession(event)
    const pending = session.webauthnChallenge
    if (!pending || pending.attemptId !== attemptId || Date.now() - pending.createdAt > CHALLENGE_TTL_MS) {
      return '' // fails verification closed, same as the library's own default
    }
    return pending.challenge
  },

  async onSuccess(event, { user, credential }) {
    const db = useDb()
    await db.webauthnCredential.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        backedUp: credential.backedUp,
        transports: credential.transports ?? [],
        aaguid: credential.aaguid ?? null,
        name: user.credentialName?.trim() || 'Passkey',
      },
    })

    await setUserSession(event, { webauthnChallenge: undefined })
  },
})
