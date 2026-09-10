import { z } from 'zod'

export const nonEmptyString = z.string().trim().min(1)

export const idParam = z.coerce.number().int().positive()

// A note on update schemas: plain `.partial()` on a create schema is NOT
// enough for any field that also has a `.default(...)` (e.g.
// `status: z.enum([...]).default('pending')`) -- Zod still applies the
// default whenever the field is missing, `.partial()` or not. In a PATCH
// that means every single-field update silently resets every *other*
// defaulted field back to its default. Confirmed with a real task:
// `{ status: 'done' }` then `{ title: 'x' }` reverted status to 'pending'.
// Each update schema below re-declares its defaulted fields as plain
// `.optional()` (no default) via `.extend(...)` after `.partial()`, so
// omitting one in a PATCH body truly means "leave it unchanged".
