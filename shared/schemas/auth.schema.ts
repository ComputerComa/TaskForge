import { z } from 'zod'
import { nonEmptyString } from './common'

export const loginSchema = z
  .object({
    username: nonEmptyString,
    password: nonEmptyString,
  })
  .strict()

export type LoginPayload = z.infer<typeof loginSchema>
