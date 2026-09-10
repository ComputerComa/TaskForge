import type { InjectionKey } from 'vue'
import type { PhaseNode, TaskNode } from '~~/shared/types/entities'

export interface ProjectDetailFilters {
  hideBlocked: boolean
  actionableOnly: boolean
  showCompleted: boolean
}

/** A phase with no tasks yet falls back to its own status; otherwise it's
 * done once every task in it is done. Mirrors the same rule the backend
 * uses for the "current phase" computation (db-helpers.ts). */
export function isPhaseDone(phase: Pick<PhaseNode, 'status' | 'tasks'>): boolean {
  return phase.tasks.length > 0 ? phase.tasks.every(task => task.status === 'done') : phase.status === 'done'
}

/** Shared visibility rule for both phases and tasks: each filter is an
 * independent, composable restriction, so combining them is a plain AND
 * rather than needing precedence rules between checkboxes. */
function isVisible(item: { done: boolean; blocked: boolean }, filters: ProjectDetailFilters): boolean {
  if (filters.actionableOnly && (item.done || item.blocked)) return false
  if (filters.hideBlocked && item.blocked) return false
  if (!filters.showCompleted && item.done) return false
  return true
}

export function isPhaseVisible(phase: PhaseNode, filters: ProjectDetailFilters): boolean {
  return isVisible({ done: isPhaseDone(phase), blocked: phase.blockers.length > 0 }, filters)
}

export function isTaskVisible(task: TaskNode, filters: ProjectDetailFilters): boolean {
  return isVisible({ done: task.status === 'done', blocked: task.blockers.length > 0 }, filters)
}

/** View-only state for the Project Detail page: the blocked/actionable/
 * completed filters, and which phases are manually expanded or collapsed
 * (a phase collapses by default once it's done, otherwise stays expanded,
 * until the user explicitly toggles it). Kept separate from
 * useProjectTree's server-backed data so a tree refresh never resets it. */
export function useProjectDetailUi() {
  const filters = reactive<ProjectDetailFilters>({
    hideBlocked: false,
    actionableOnly: false,
    showCompleted: true,
  })

  const collapsedOverrides = reactive(new Map<number, boolean>())

  function isPhaseCollapsed(phase: PhaseNode): boolean {
    const override = collapsedOverrides.get(phase.id)
    return override ?? isPhaseDone(phase)
  }

  function togglePhaseCollapsed(phase: PhaseNode) {
    collapsedOverrides.set(phase.id, !isPhaseCollapsed(phase))
  }

  function expandPhase(phaseId: number) {
    collapsedOverrides.set(phaseId, false)
  }

  return { filters, isPhaseCollapsed, togglePhaseCollapsed, expandPhase }
}

export type ProjectDetailUiApi = ReturnType<typeof useProjectDetailUi>

export const projectUiKey: InjectionKey<ProjectDetailUiApi> = Symbol('project-detail-ui')
