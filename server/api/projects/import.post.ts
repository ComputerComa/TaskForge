import { importRequestSchema } from '~~/shared/schemas/import-export.schema'
import { useDb } from '~~/server/db/client'

// Generous for a JSON project export -- guards against a pathological
// upload rather than a realistic one.
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export default defineEventHandler(async event => {
  await requireAuth(event)

  const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (contentLength > MAX_IMPORT_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Import file is too large' })
  }

  const body = await parseBody(importRequestSchema, event)

  const db = useDb()
  const existing = body.overwrite
    ? null
    : await db.project.findUnique({ where: { identifier: body.identifier }, select: { id: true } })
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: `A project with identifier "${body.identifier}" already exists`,
    })
  }

  const project = await createProjectFromImport(body.document, {
    identifier: body.identifier,
    overwrite: body.overwrite,
  })

  setResponseStatus(event, 201)
  return project
})
