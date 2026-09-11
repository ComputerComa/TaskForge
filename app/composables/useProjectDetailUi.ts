import type { InjectionKey } from 'vue'
import type { PhaseNode, TaskNode } from '~~/shared/types/entities'

export interface ProjectDetailFilters {
  hideBlocked: boolean
  actionableOnly: boolean
  showCompleted: boolean
}

/** Trusts the server's derivation (db-helpers.ts ->
 * computePhaseDisplayStatuses) rather than re-deriving completion from
 * tasks here -- one source of truth, so this can never drift from what
 * the phase's status badge actually shows. */
export function isPhaseDone(phase: Pick<PhaseNode, 'displayStatus'>): boolean {
  return phase.displayStatus === 'done' || phase.displayStatus === 'archived'
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
 * completed filters, which phases are manually expanded or collapsed
 * (a phase collapses by default unless it's the current one, until the
 * user explicitly toggles it), and -- within the current phase -- whether
 * its full task list is shown or just the "up next" task. Kept separate
 * from useProjectTree's server-backed data so a tree refresh never resets
 * it. */
export function useProjectDetailUi() {
  const filters = reactive<ProjectDetailFilters>({
    hideBlocked: false,
    actionableOnly: false,
    showCompleted: true,
  })

  const collapsedOverrides = reactive(new Map<number, boolean>())
  const taskListExpandedOverrides = reactive(new Map<number, boolean>())

  // Only the current phase (the one being actively worked) stays expanded
  // by default -- pending/done/archived ones collapse, since there's
  // nothing actionable to see in them yet or anymore.
  function isPhaseCollapsed(phase: PhaseNode): boolean {
    const override = collapsedOverrides.get(phase.id)
    return override ?? phase.displayStatus !== 'active'
  }

  function togglePhaseCollapsed(phase: PhaseNode) {
    collapsedOverrides.set(phase.id, !isPhaseCollapsed(phase))
  }

  // Within an expanded phase, only the current phase further defaults to
  // showing just its "up next" task rather than the whole list -- a
  // manually-expanded past/future phase has no single "current" task, so
  // it always shows everything (see PhaseNode.vue's v-show condition).
  function isTaskListExpanded(phase: PhaseNode): boolean {
    return taskListExpandedOverrides.get(phase.id) ?? false
  }

  function toggleTaskListExpanded(phase: PhaseNode) {
    taskListExpandedOverrides.set(phase.id, !isTaskListExpanded(phase))
  }

  function expandPhase(phaseId: number) {
    collapsedOverrides.set(phaseId, false)
    taskListExpandedOverrides.set(phaseId, true)
  }

  return {
    filters,
    isPhaseCollapsed,
    togglePhaseCollapsed,
    isTaskListExpanded,
    toggleTaskListExpanded,
    expandPhase,
  }
}

export type ProjectDetailUiApi = ReturnType<typeof useProjectDetailUi>

export const projectUiKey: InjectionKey<ProjectDetailUiApi> = Symbol('project-detail-ui')
