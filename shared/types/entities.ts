import type { PhaseStatus } from '../schemas/phase.schema'
import type { ProjectStatus } from '../schemas/project.schema'
import type { StepStatus } from '../schemas/step.schema'
import type { TaskStatus } from '../schemas/task.schema'

export interface ProjectSummary {
  id: number
  identifier: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  taskCount: number
}

export interface StepNode {
  id: number
  taskId: number
  title: string
  description: string
  status: StepStatus
  position: number
  command: string | null
  notes: string | null
  link: string | null
}

export interface TaskDependencyEdge {
  id: number
  dependsOnTaskId: number
}

export interface TaskNode {
  id: number
  projectId: number
  phaseId: number
  reference: string
  slug: string
  title: string
  description: string
  status: TaskStatus
  assignee: string | null
  dueAt: string | null
  position: number
  steps: StepNode[]
  dependencies: TaskDependencyEdge[]
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
}
