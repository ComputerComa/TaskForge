import { z } from 'zod'
import { nonEmptyString } from './common'

export const eventStatuses = ['upcoming', 'occurred', 'cancelled'] as const
export type EventStatus = (typeof eventStatuses)[number]

export const eventScopeTypes = ['project', 'phase', 'task'] as const
export type EventScopeType = (typeof eventScopeTypes)[number]

export const eventTypes = ['milestone', 'blocker', 'delivery', 'decision', 'maintenance_window', 'note'] as const
export type EventType = (typeof eventTypes)[number]

export const createEventSchema = z
  .object({
    projectId: z.number().int().positive(),
    scopeType: z.enum(eventScopeTypes).default('project'),
    // The id of the project/phase/task named by scopeType -- callers set
    // this to projectId itself for project-scoped events. Cross-checked
    // against projectId in the API layer (assertValidEventScope), since
    // Zod alone can't see whether a phase/task actually belongs here.
    scopeId: z.number().int().positive(),
    type: z.enum(eventTypes).default('milestone'),
    title: nonEmptyString,
    description: z.string().optional(),
    // Nullable (not just optional) so an update can explicitly clear a
    // previously-set date -- omitting the key means "leave unchanged".
    expectedAt: z.coerce.date().nullable().optional(),
    status: z.enum(eventStatuses).default('upcoming'),
  })
  .strict()

// .extend() re-declares scopeType/type/status without their .default() --
// see the note in shared/schemas/common.ts on why that matters for PATCH.
export const updateEventSchema = createEventSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    scopeType: z.enum(eventScopeTypes).optional(),
    type: z.enum(eventTypes).optional(),
    status: z.enum(eventStatuses).optional(),
  })
  .strict()

export type CreateEventPayload = z.input<typeof createEventSchema>
export type UpdateEventPayload = z.input<typeof updateEventSchema>
