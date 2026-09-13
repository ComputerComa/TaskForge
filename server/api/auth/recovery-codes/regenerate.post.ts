// Issues a fresh batch of recovery codes, invalidating any existing
// ones -- called right after a user's first 2FA method is enrolled
// (from either the setup wizard or Settings), and any time they choose
// to regenerate from Settings afterward. Codes are returned once, same
// "reveal a secret exactly once" pattern as API tokens.
export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)
  const recoveryCodes = await generateRecoveryCodes(user.id)
  return { recoveryCodes }
})
