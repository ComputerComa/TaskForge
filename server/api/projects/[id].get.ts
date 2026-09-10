export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const tree = fetchProjectTree(id)
  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  return tree
})
