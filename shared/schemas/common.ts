import { z } from 'zod'

export const nonEmptyString = z.string().trim().min(1)

export const idParam = z.coerce.number().int().positive()
