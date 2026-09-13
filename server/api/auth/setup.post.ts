import { setupSchema } from '~~/shared/schemas/setup.schema'
import { useDb } from '~~/server/db/client'

// Creates the one account this app supports -- replaces the old
// `npm run db:seed` CLI bootstrap with an in-app first-run wizard (see
// app/pages/setup.vue). The redirect in auth.global.ts is UX only; this
// 409 is the actual enforcement that setup can only ever run once.
export default defineEventHandler(async event => {
  const db = useDb()
  const existing = await db.user.findFirst({ select: { id: true } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Setup already completed' })
  }

  const body = await parseBody(setupSchema, event)
  const passwordHash = await hashPassword(body.password)

  const user = await db.user.create({
    data: { username: body.username, name: body.name, email: body.email, passwordHash },
  })

  // Uses replace (not merge) so this session starts completely clean --
  // see the note on replaceUserSession vs setUserSession in login.post.ts.
  await replaceUserSession(event, { user: { id: user.id, username: user.username, name: user.name } })

  setResponseStatus(event, 201)
  return { id: user.id, username: user.username, name: user.name }
})
