import { z } from 'zod'
import { nonEmptyString } from './common'

export const eventStatuses = ['upcoming', 'occurred', 'cancelled'] as const
export type EventStatus = (typeof eventStatuses)[number]

export const createEventSchema = z
  .object({
    projectId: z.number().int().positive(),
    title: nonEmptyString,
    // Nullable (not just optional) so an update can explicitly clear a
    // previously-set date -- omitting the key means "leave unchanged".
    expectedAt: z.coerce.date().nullable().optional(),
    note: z.string().optional(),
    status: z.enum(eventStatuses).default('upcoming'),
  })
  .strict()

export const updateEventSchema = createEventSchema.omit({ projectId: true }).partial()

export type CreateEventPayload = z.input<typeof createEventSchema>
export type UpdateEventPayload = z.input<typeof updateEventSchema>
