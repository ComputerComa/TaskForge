import { z } from 'zod'
import { nonEmptyString } from './common'

export const taskStatuses = ['backlog', 'ready', 'in_progress', 'waiting', 'done'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const createTaskSchema = z
  .object({
    projectId: z.number().int().positive(),
    phaseId: z.number().int().positive(),
    reference: nonEmptyString
      .toUpperCase()
      .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Reference must resemble NAS-001'),
    slug: nonEmptyString
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be a lowercase, hyphenated identifier'),
    title: nonEmptyString,
    description: z.string().default(''),
    status: z.enum(taskStatuses).default('backlog'),
    // Nullable (not just optional) so an update can explicitly clear an
    // existing assignee by sending null -- omitting the key entirely
    // (undefined) means "leave unchanged".
    assignee: nonEmptyString.toLowerCase().nullable().optional(),
    dueAt: z.coerce.date().optional(),
  })
  .strict()

export const updateTaskSchema = createTaskSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    phaseId: z.number().int().positive().optional(),
    position: z.number().int().min(0).optional(),
  })

export type CreateTaskPayload = z.input<typeof createTaskSchema>
export type UpdateTaskPayload = z.input<typeof updateTaskSchema>
