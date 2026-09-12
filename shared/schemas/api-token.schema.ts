import { z } from 'zod'
import { nonEmptyString } from './common'

export const createApiTokenSchema = z
  .object({
    // A human-readable label ("Claude", "ChatGPT") so multiple tokens can
    // be told apart and revoked individually in the settings page.
    name: nonEmptyString,
  })
  .strict()

export type CreateApiTokenPayload = z.input<typeof createApiTokenSchema>
