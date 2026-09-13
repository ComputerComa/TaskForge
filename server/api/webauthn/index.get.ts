import { useDb } from '~~/server/db/client'

// Lists the account's enrolled passkeys for Settings -- never the public
// key or counter, just enough to tell them apart and revoke one.
export default defineEventHandler(async event => {
  const { user } = await requireAuth(event)

  const db = useDb()
  const credentials = await db.webauthnCredential.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, backedUp: true, createdAt: true, lastUsedAt: true },
  })
  return credentials
})
