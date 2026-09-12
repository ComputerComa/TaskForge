import type { H3Event } from 'h3'

/** Sets the RFC 6750 challenge header and throws the 401. There's no OAuth
 * authorization server behind this endpoint -- just a static credential
 * check against the api_tokens table -- so no Protected Resource Metadata
 * document is advertised alongside it. */
function unauthorized(event: H3Event): never {
  setResponseHeader(event, 'WWW-Authenticate', 'Bearer realm="TaskForge MCP"')
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}

/** Guards the MCP endpoint (server/routes/mcp.ts) behind a bearer token
 * from the api_tokens table -- see server/utils/api-tokens.ts. This is
 * deliberately separate from requireAuth: the web app keeps using the
 * session cookie, while MCP clients (Claude, ChatGPT, ...) use a
 * long-lived token they can't get a cookie for. */
export async function requireApiToken(event: H3Event): Promise<{ id: number; name: string }> {
  const header = getRequestHeader(event, 'authorization')
  const [scheme, token] = header?.split(' ') ?? []
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    unauthorized(event)
  }

  const match = await findApiTokenByRawToken(token)
  if (!match) {
    unauthorized(event)
  }
  return match
}
