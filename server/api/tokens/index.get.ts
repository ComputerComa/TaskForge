import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)

  const db = useDb()
  const tokens = await db.apiToken.findMany({ orderBy: { createdAt: 'desc' } })
  return tokens.map(token => ({
    id: token.id,
    name: token.name,
    tokenPrefix: token.tokenPrefix,
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt,
  }))
})
