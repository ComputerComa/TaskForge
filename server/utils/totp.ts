import { Secret, TOTP } from 'otpauth'

// Shown as the account name/issuer inside the user's authenticator app.
const ISSUER = 'TaskForge'

/** Generates a new, random TOTP secret (base32, the standard on-disk/
 * QR-payload encoding) for a pending enrollment -- see totp/enroll.post.ts. */
export function generateTotpSecret(): string {
  return new Secret().base32
}

/** Builds the otpauth:// URI an authenticator app scans (as a QR code) or
 * accepts via manual entry. */
export function buildTotpUri(username: string, secretBase32: string): string {
  return new TOTP({
    issuer: ISSUER,
    label: username,
    secret: Secret.fromBase32(secretBase32),
  }).toString()
}

/** Validates a 6-digit code against a stored secret. `window: 1` accepts
 * the previous/next 30s step too, tolerating minor clock drift between
 * the server and the authenticator app. */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new TOTP({ issuer: ISSUER, secret: Secret.fromBase32(secretBase32) })
  return totp.validate({ token: code, window: 1 }) !== null
}
