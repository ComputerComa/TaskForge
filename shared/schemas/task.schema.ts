import { z } from 'zod'
import { nonEmptyString } from './common'

export const taskStatuses = ['pending', 'done'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const createTaskSchema = z
  .object({
    projectId: z.number().int().positive(),
    phaseId: z.number().int().positive(),
    title: nonEmptyString,
    description: z.string().default(''),
    status: z.enum(taskStatuses).default('pending'),
    command: z.string().optional(),
    notes: z.string().optional(),
    link: z.string().optional(),
  })
  .strict()

// .extend() re-declares description/status without their .default() --
// see the note in shared/schemas/common.ts on why that matters for PATCH.
export const updateTaskSchema = createTaskSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    phaseId: z.number().int().positive().optional(),
    description: z.string().optional(),
    status: z.enum(taskStatuses).optional(),
    position: z.number().int().min(0).optional(),
  })
  .strict()

export type CreateTaskPayload = z.input<typeof createTaskSchema>
export type UpdateTaskPayload = z.input<typeof updateTaskSchema>
