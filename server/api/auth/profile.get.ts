import { useDb } from '~~/server/db/client'

// email isn't part of the session (see shared/types/auth.d.ts) -- the
// Settings page fetches it fresh here instead.
export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)
  const db = useDb()
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, email: true } })
  return record
})
