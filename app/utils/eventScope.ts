import type { EventType } from '~~/shared/schemas/event.schema'
import type { EventSummary, ProjectTree } from '~~/shared/types/entities'

export const eventTypeMeta: Record<EventType, { label: string; icon: string }> = {
  milestone: { label: 'Milestone', icon: '◆' },
  blocker: { label: 'Blocker', icon: '⛔' },
  delivery: { label: 'Delivery', icon: '▣' },
  decision: { label: 'Decision', icon: '?' },
  maintenance_window: { label: 'Maintenance', icon: '⚙' },
  note: { label: 'Note', icon: '≡' },
}

export function isActiveBlockerEvent(event: Pick<EventSummary, 'type' | 'status'>): boolean {
  return event.type === 'blocker' && event.status === 'upcoming'
}

/** Human label for what an event is attached to -- the phase/task name,
 * or "Project" for a project-scoped event. */
export function eventScopeLabel(event: EventSummary, tree: ProjectTree): string {
  if (event.scopeType === 'project') return 'Project'
  if (event.scopeType === 'phase') {
    return tree.phases.find(phase => phase.id === event.scopeId)?.name ?? 'Phase'
  }
  for (const phase of tree.phases) {
    const task = phase.tasks.find(candidate => candidate.id === event.scopeId)
    if (task) return task.title
  }
  return 'Task'
}

/** Which phase (if any) needs to be expanded to reveal this event's
 * scope -- the phase itself, or the phase containing its task. */
export function eventPhaseId(event: EventSummary, tree: ProjectTree): number | null {
  if (event.scopeType === 'phase') return event.scopeId
  if (event.scopeType === 'task') {
    return tree.phases.find(phase => phase.tasks.some(task => task.id === event.scopeId))?.id ?? null
  }
  return null
}

/** DOM id of the element representing an event's scope -- see the
 * matching `:id` bindings on the project header, PhaseNode, and TaskNode. */
export function eventDomId(event: EventSummary): string {
  return event.scopeType === 'project' ? 'project-header' : `${event.scopeType}-${event.scopeId}`
}
