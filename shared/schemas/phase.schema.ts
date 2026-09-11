import { z } from 'zod'
import { nonEmptyString } from './common'

export const phaseStatuses = ['active', 'done', 'archived'] as const
export type PhaseStatus = (typeof phaseStatuses)[number]

// Read-only, never persisted or client-writable -- 'pending' is derived at
// read time (see server/utils/db-helpers.ts -> computePhaseDisplayStatuses)
// so that exactly one phase is ever 'active' regardless of what raw
// 'active'/'done'/'archived' values are actually stored.
export const phaseDisplayStatuses = ['pending', 'active', 'done', 'archived'] as const
export type PhaseDisplayStatus = (typeof phaseDisplayStatuses)[number]

export const createPhaseSchema = z
  .object({
    projectId: z.number().int().positive(),
    name: nonEmptyString,
    description: z.string().default(''),
    status: z.enum(phaseStatuses).default('active'),
  })
  .strict()

// Project reassignment isn't supported in this slice. .extend() re-declares
// description/status without their .default() -- see the note in
// shared/schemas/common.ts on why that matters for PATCH.
export const updatePhaseSchema = createPhaseSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    description: z.string().optional(),
    status: z.enum(phaseStatuses).optional(),
    position: z.number().int().min(0).optional(),
  })
  .strict()

export type CreatePhasePayload = z.input<typeof createPhaseSchema>
export type UpdatePhasePayload = z.input<typeof updatePhaseSchema>
