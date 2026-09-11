export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const document = await buildExportDocument(id)
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${document.project.identifier}.json"`)
  return document
})
