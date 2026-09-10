import type { H3Event } from 'h3'
import type { z } from 'zod'
import { idParam } from '~~/shared/schemas/common'

/** Parses and validates a request body against `schema`, converting a Zod
 * failure into a 400 (with the Zod issues attached) instead of letting it
 * fall through to h3's generic 500 handling. */
export async function parseBody<T extends z.ZodTypeAny>(schema: T, event: H3Event): Promise<z.infer<T>> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: result.error.issues })
  }
  return result.data
}

/** Parses a route `:id` param, converting an invalid value into a 400
 * rather than a 500. */
export function parseIdParam(event: H3Event, name = 'id'): number {
  const result = idParam.safeParse(getRouterParam(event, name))
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${name}` })
  }
  return result.data
}
