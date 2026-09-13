import { z } from 'zod'
import { nonEmptyString } from './common'

// Length over composition rules -- current NIST 800-63B guidance, and
// there's no complexity requirement anywhere else in this app to match.
export const MIN_PASSWORD_LENGTH = 10

export const setupSchema = z
  .object({
    username: nonEmptyString,
    name: nonEmptyString,
    email: z.email().trim().toLowerCase(),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    confirmPassword: z.string().min(1),
  })
  .strict()
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SetupPayload = z.infer<typeof setupSchema>

export const updateProfileSchema = z
  .object({
    name: nonEmptyString,
    email: z.email().trim().toLowerCase(),
  })
  .strict()

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>
