import type { EventStatus } from '../schemas/event.schema'
import type { PhaseStatus } from '../schemas/phase.schema'
import type { ProjectStatus } from '../schemas/project.schema'
import type { TaskStatus } from '../schemas/task.schema'

/** Computed (not stored) progress summary for one project -- see
 * server/utils/db-helpers.ts -> computeProjectStatus for how this is
 * derived from phase/task completion. */
export interface ProjectStatusSummary {
  totalPhases: number
  currentPhaseName: string | null
  currentPhaseIndex: number | null
  currentTaskPosition: number | null
  totalTasksInPhase: number | null
  totalTasks: number
  doneTasks: number
  progress: number
  isComplete: boolean
}

export interface EventSummary {
  id: number
  projectId: number
  title: string
  expectedAt: string | null
  note: string | null
  status: EventStatus
}

export interface ProjectSummary {
  id: number
  identifier: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  statusSummary: ProjectStatusSummary
  upcomingEvents: EventSummary[]
}

export interface TaskNode {
  id: number
  projectId: number
  phaseId: number
  title: string
  description: string
  status: TaskStatus
  position: number
  command: string | null
  notes: string | null
  link: string | null
}

export interface PhaseNode {
  id: number
  projectId: number
  name: string
  description: string
  position: number
  status: PhaseStatus
  tasks: TaskNode[]
}

export interface ProjectTree {
  id: number
  identifier: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  phases: PhaseNode[]
  events: EventSummary[]
  statusSummary: ProjectStatusSummary
}
