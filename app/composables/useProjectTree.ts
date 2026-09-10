import type { InjectionKey } from 'vue'
import type { ProjectTree } from '~~/shared/types/entities'
import type { CreatePhasePayload, UpdatePhasePayload } from '~~/shared/schemas/phase.schema'
import type { CreateStepPayload, UpdateStepPayload } from '~~/shared/schemas/step.schema'
import type { CreateTaskPayload, UpdateTaskPayload } from '~~/shared/schemas/task.schema'
import type { UpdateProjectPayload } from '~~/shared/schemas/project.schema'

/** Fetches one project's full phase -> task -> step tree and exposes
 * mutation helpers. Every mutation refetches the whole tree afterward
 * rather than patching local state -- the tree is small, and this avoids
 * building optimistic-merge logic for a first slice. */
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

  // Flat view of every task in the project, regardless of phase -- used by
  // the dependency picker (a task may depend on a task in another phase)
  // and for looking up a dependency's current status to render "blocked".
  const allTasks = computed(() => tree.value?.phases.flatMap(phase => phase.tasks) ?? [])

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

  async function createStep(body: CreateStepPayload) {
    await $fetch('/api/steps', { method: 'POST', body })
    await refresh()
  }

  async function updateStep(id: number, body: UpdateStepPayload) {
    await $fetch(`/api/steps/${id}`, { method: 'PATCH', body })
    await refresh()
  }

  async function deleteStep(id: number) {
    await $fetch(`/api/steps/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function addDependency(taskId: number, dependsOnTaskId: number) {
    await $fetch('/api/task-dependencies', { method: 'POST', body: { taskId, dependsOnTaskId } })
    await refresh()
  }

  async function removeDependency(edgeId: number) {
    await $fetch(`/api/task-dependencies/${edgeId}`, { method: 'DELETE' })
    await refresh()
  }

  /** Swaps two siblings' `position` values -- the up/down reordering
   * control for phases/tasks/steps. No drag-and-drop in this slice. */
  async function swapPositions(
    kind: 'phase' | 'task' | 'step',
    a: { id: number; position: number },
    b: { id: number; position: number },
  ) {
    const updater = kind === 'phase' ? updatePhase : kind === 'task' ? updateTask : updateStep
    await updater(a.id, { position: b.position })
    await updater(b.id, { position: a.position })
  }

  return {
    swapPositions,
    tree,
    allTasks,
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
    createStep,
    updateStep,
    deleteStep,
    addDependency,
    removeDependency,
  }
}

export type ProjectTreeApi = ReturnType<typeof useProjectTree>

/** Injection key so nested phase/task/step components can reach the tree's
 * mutators without prop-drilling through every level. */
export const projectTreeKey: InjectionKey<ProjectTreeApi> = Symbol('project-tree')
