import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db/client'
import { phases, tasks } from '~~/server/db/schema'

export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = parseIdParam(event)

  const db = useDb()
  const phase = db.select().from(phases).where(eq(phases.id, id)).get()
  if (!phase) {
    throw createError({ statusCode: 404, statusMessage: 'Phase not found' })
  }

  // Demote events scoped to this phase, or to any task under it, to
  // project scope before the cascade delete removes the phase and its
  // tasks -- otherwise those events would be left pointing at nothing.
  const phaseTasks = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.phaseId, id)).all()
  demoteEventScope(phase.projectId, 'phase', id)
  for (const task of phaseTasks) {
    demoteEventScope(phase.projectId, 'task', task.id)
  }

  db.delete(phases).where(eq(phases.id, id)).run()
  setResponseStatus(event, 204)
  return null
})
