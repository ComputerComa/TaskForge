import { z } from 'zod'
import { nonEmptyString } from './common'

// Accepts either a 6-digit TOTP code or a recovery code (see
// server/utils/recovery-codes.ts -- tf-prefixed, base64url) -- the
// verify endpoint tries the former first, then falls back to the
// latter, so the schema just needs a non-empty trimmed string.
export const totpVerifySchema = z
  .object({
    code: z.string().trim().min(1),
  })
  .strict()

export type TotpVerifyPayload = z.infer<typeof totpVerifySchema>

export const totpConfirmSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app'),
  })
  .strict()

export type TotpConfirmPayload = z.infer<typeof totpConfirmSchema>

// Disabling 2FA re-requires the current password -- a hijacked session
// shouldn't be able to silently downgrade the account's security on its
// own.
export const disableTotpSchema = z
  .object({
    password: nonEmptyString,
  })
  .strict()

export type DisableTotpPayload = z.infer<typeof disableTotpSchema>
