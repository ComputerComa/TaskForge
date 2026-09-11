import { z } from 'zod'
import { nonEmptyString } from './common'
import { projectStatuses } from './project.schema'
import { phaseStatuses } from './phase.schema'
import { taskStatuses } from './task.schema'
import { eventScopeTypes, eventStatuses, eventTypes } from './event.schema'

/** Bumped whenever the export document shape changes in a way older
 * importers can't read. Checked explicitly (via z.literal) rather than
 * left implicit, so an unsupported version fails with a clear Zod issue
 * instead of falling through to unrelated field errors. */
export const exportFormatVersion = 1

const exportTaskSchema = z
  .object({
    // A small per-document id (not a database id) so events elsewhere in
    // the same document can point at this task -- see exportEventSchema.
    ref: nonEmptyString,
    title: nonEmptyString,
    description: z.string(),
    status: z.enum(taskStatuses),
    command: z.string().nullable(),
    notes: z.string().nullable(),
    link: z.string().nullable(),
    reference: z.string().nullable(),
  })
  .strict()

const exportPhaseSchema = z
  .object({
    ref: nonEmptyString,
    name: nonEmptyString,
    description: z.string(),
    status: z.enum(phaseStatuses),
    // Array order is the source of truth for position on import.
    tasks: z.array(exportTaskSchema),
  })
  .strict()

const exportEventSchema = z
  .object({
    scopeType: z.enum(eventScopeTypes),
    // The ref of the phase/task this event is scoped to, or null when
    // scopeType is "project" (there's only one project per document, so it
    // needs no ref). Cross-checked against the declared phase/task refs
    // below, since Zod's per-field checks alone can't see across fields.
    scopeRef: nonEmptyString.nullable(),
    type: z.enum(eventTypes),
    title: nonEmptyString,
    description: z.string().nullable(),
    expectedAt: z.string().nullable(),
    status: z.enum(eventStatuses),
  })
  .strict()

export const exportDocumentSchema = z
  .object({
    formatVersion: z.literal(exportFormatVersion),
    project: z
      .object({
        identifier: nonEmptyString,
        name: nonEmptyString,
        description: z.string(),
        status: z.enum(projectStatuses),
      })
      .strict(),
    phases: z.array(exportPhaseSchema),
    events: z.array(exportEventSchema),
  })
  .strict()
  .superRefine((doc, ctx) => {
    const phaseRefs = new Set<string>()
    const taskRefs = new Set<string>()

    doc.phases.forEach((phase, phaseIndex) => {
      if (phaseRefs.has(phase.ref)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate phase ref "${phase.ref}"`,
          path: ['phases', phaseIndex, 'ref'],
        })
      }
      phaseRefs.add(phase.ref)

      phase.tasks.forEach((task, taskIndex) => {
        if (taskRefs.has(task.ref)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate task ref "${task.ref}"`,
            path: ['phases', phaseIndex, 'tasks', taskIndex, 'ref'],
          })
        }
        taskRefs.add(task.ref)
      })
    })

    doc.events.forEach((event, eventIndex) => {
      if (event.scopeType === 'project') {
        if (event.scopeRef !== null) {
          ctx.addIssue({
            code: 'custom',
            message: 'scopeRef must be null when scopeType is "project"',
            path: ['events', eventIndex, 'scopeRef'],
          })
        }
        return
      }

      const refs = event.scopeType === 'phase' ? phaseRefs : taskRefs
      if (event.scopeRef === null || !refs.has(event.scopeRef)) {
        ctx.addIssue({
          code: 'custom',
          message: `No ${event.scopeType} with ref "${event.scopeRef}" in this document`,
          path: ['events', eventIndex, 'scopeRef'],
        })
      }
    })
  })

export type ExportDocument = z.infer<typeof exportDocumentSchema>
export type ExportPhase = ExportDocument['phases'][number]
export type ExportTask = ExportPhase['tasks'][number]
export type ExportEvent = ExportDocument['events'][number]

export const importRequestSchema = z
  .object({
    document: exportDocumentSchema,
    // Editable at import time rather than trusted from the file, so a
    // "copy" import can pick a fresh identifier without re-exporting.
    identifier: nonEmptyString
      .regex(/^[A-Za-z0-9-]+$/, 'Identifier may contain only letters, numbers, and hyphens')
      .toUpperCase(),
    overwrite: z.boolean().default(false),
  })
  .strict()

export type ImportRequestPayload = z.input<typeof importRequestSchema>
