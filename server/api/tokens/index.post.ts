import { createApiTokenSchema } from '~~/shared/schemas/api-token.schema'
import { useDb } from '~~/server/db/client'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const body = await parseBody(createApiTokenSchema, event)

  const { token, tokenPrefix } = generateApiToken()
  const tokenHash = await hashPassword(token)

  const db = useDb()
  const created = await db.apiToken.create({
    data: { name: body.name, tokenPrefix, tokenHash },
  })

  // The raw token is returned here and only here -- it's not derivable
  // from tokenHash, so this is the caller's one chance to see it.
  return {
    id: created.id,
    name: created.name,
    tokenPrefix: created.tokenPrefix,
    createdAt: created.createdAt,
    lastUsedAt: created.lastUsedAt,
    token,
  }
})
