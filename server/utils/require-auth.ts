import type { H3Event } from 'h3'

/** Guards an API handler behind the session cookie set by
 * POST /api/auth/login. Called explicitly at the top of every CRUD
 * handler rather than via a blanket server middleware -- with this few
 * routes, explicit calls are easier to audit than a path-exclusion list. */
export async function requireAuth(event: H3Event) {
  return requireUserSession(event)
}
