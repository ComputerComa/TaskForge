import type { InjectionKey } from 'vue'
import type { ProjectTree } from '~~/shared/types/entities'
import type { CreateEventPayload, UpdateEventPayload } from '~~/shared/schemas/event.schema'
import type { CreatePhasePayload, UpdatePhasePayload } from '~~/shared/schemas/phase.schema'
import type { CreateTaskPayload, UpdateTaskPayload } from '~~/shared/schemas/task.schema'
import type { UpdateProjectPayload } from '~~/shared/schemas/project.schema'

/** Fetches one project's full phase -> task tree (plus its events) and
 * exposes mutation helpers. Every mutation refetches the whole tree
 * afterward rather than patching local state -- the tree is small, and
 * this avoids building optimistic-merge logic for a first slice. */
export function useProjectTree(projectId: number) {
  // useRequestFetch (not the global $fetch) forwards the incoming request's
  // cookies during SSR -- without it, the server-side render of this fetch
  // runs as an unauthenticated request and 401s even though the page's own
  // request is logged in.
  const requestFetch = useRequestFetch()
  const { data: tree, pending, error, refresh } = useAsyncData<ProjectTree>(
    `project-tree-${projectId}`,
    () => requestFetch(`/api/projects/${projectId}`),
  )

  async function updateProject(body: UpdateProjectPayload) {
    await $fetch(`/api/projects/${projectId}`, { method: 'PATCH', body })
    await refresh()
  }

  async function createPhase(body: Omit<CreatePhasePayload, 'projectId'>) {
    await $fetch('/api/phases', { method: 'POST', body: { ...body, projectId } })
    await refresh()
  }

  async function updatePhase(id: number, body: UpdatePhasePayload) {
    await $fetch(`/api/phases/${id}`, { method: 'PATCH', body })
    await refresh()
  }

  async function deletePhase(id: number) {
    await $fetch(`/api/phases/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function createTask(body: Omit<CreateTaskPayload, 'projectId'>) {
    await $fetch('/api/tasks', { method: 'POST', body: { ...body, projectId } })
    await refresh()
  }

  async function updateTask(id: number, body: UpdateTaskPayload) {
    await $fetch(`/api/tasks/${id}`, { method: 'PATCH', body })
    await refresh()
  }

  async function deleteTask(id: number) {
    await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function createEvent(body: Omit<CreateEventPayload, 'projectId'>) {
    await $fetch('/api/events', { method: 'POST', body: { ...body, projectId } })
    await refresh()
  }

  async function updateEvent(id: number, body: UpdateEventPayload) {
    await $fetch(`/api/events/${id}`, { method: 'PATCH', body })
    await refresh()
  }

  async function deleteEvent(id: number) {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' })
    await refresh()
  }

  /** Swaps two siblings' `position` values -- the up/down reordering
   * control for phases and tasks. No drag-and-drop in this slice. */
  async function swapPositions(
    kind: 'phase' | 'task',
    a: { id: number; position: number },
    b: { id: number; position: number },
  ) {
    const updater = kind === 'phase' ? updatePhase : updateTask
    await updater(a.id, { position: b.position })
    await updater(b.id, { position: a.position })
  }

  return {
    swapPositions,
    tree,
    pending,
    error,
    refresh,
    updateProject,
    createPhase,
    updatePhase,
    deletePhase,
    createTask,
    updateTask,
    deleteTask,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}

export type ProjectTreeApi = ReturnType<typeof useProjectTree>

/** Injection key so nested phase/task components can reach the tree's
 * mutators without prop-drilling through every level. */
export const projectTreeKey: InjectionKey<ProjectTreeApi> = Symbol('project-tree')
