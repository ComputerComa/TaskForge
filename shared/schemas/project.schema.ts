import { z } from 'zod'
import { nonEmptyString } from './common'

export const projectStatuses = ['active', 'on_hold', 'done', 'archived'] as const
export type ProjectStatus = (typeof projectStatuses)[number]

export const createProjectSchema = z
  .object({
    identifier: nonEmptyString
      .regex(/^[A-Za-z0-9-]+$/, 'Identifier may contain only letters, numbers, and hyphens')
      .toUpperCase(),
    name: nonEmptyString,
    description: z.string().default(''),
    status: z.enum(projectStatuses).default('active'),
  })
  .strict()

// .extend() re-declares description/status without their .default() --
// see the note in shared/schemas/common.ts on why that matters for PATCH.
export const updateProjectSchema = createProjectSchema
  .partial()
  .extend({
    description: z.string().optional(),
    status: z.enum(projectStatuses).optional(),
  })
  .strict()

// z.input (not z.infer/output) so fields with a .default() stay optional on
// the client-side payload type -- the server fills them in on parse.
export type CreateProjectPayload = z.input<typeof createProjectSchema>
export type UpdateProjectPayload = z.input<typeof updateProjectSchema>
