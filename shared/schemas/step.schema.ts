import { z } from 'zod'
import { nonEmptyString } from './common'

export const stepStatuses = ['pending', 'done'] as const
export type StepStatus = (typeof stepStatuses)[number]

export const createStepSchema = z
  .object({
    taskId: z.number().int().positive(),
    title: nonEmptyString,
    description: z.string().default(''),
    status: z.enum(stepStatuses).default('pending'),
    command: z.string().optional(),
    notes: z.string().optional(),
    link: z.string().optional(),
  })
  .strict()

export const updateStepSchema = createStepSchema
  .omit({ taskId: true })
  .partial()
  .extend({
    position: z.number().int().min(0).optional(),
  })

export type CreateStepPayload = z.input<typeof createStepSchema>
export type UpdateStepPayload = z.input<typeof updateStepSchema>
