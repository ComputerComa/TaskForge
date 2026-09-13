import { useDb } from '~~/server/db/client'

// Public, unauthenticated -- app/middleware/auth.global.ts calls this to
// decide whether a logged-out visitor should land on /setup (no account
// exists yet) or /login (one already does).
export default defineEventHandler(async () => {
  const db = useDb()
  const existing = await db.user.findFirst({ select: { id: true } })
  return { setupRequired: !existing }
})
