import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

// The remote MCP endpoint for TaskForge -- see server/utils/mcp-server.ts
// for the tool/resource surface and server/utils/require-api-token.ts for
// how it's authenticated. Deliberately plain (not under server/api/**):
// it's a JSON-RPC endpoint for MCP clients (Claude, ChatGPT, ...), not part
// of the app's own typed REST API.
//
// Stateless mode (`sessionIdGenerator: undefined`): no Mcp-Session-Id, no
// server-held connection state between requests. A fresh McpServer +
// transport per request is the pattern the SDK itself documents for this
// mode -- cheap here, and it rules out any state (or request-id numbering)
// bleeding between two requests that happen to overlap.
export default defineEventHandler(async event => {
  if (event.method !== 'POST') {
    setResponseHeader(event, 'Allow', 'POST')
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  await requireApiToken(event)

  const server = createTaskForgeMcpServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })

  try {
    await server.connect(transport)
    await transport.handleRequest(event.node.req, event.node.res)
  } finally {
    await transport.close()
    await server.close()
  }
})
