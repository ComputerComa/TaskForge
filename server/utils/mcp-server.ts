import { z } from 'zod'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { useDb } from '../db/client'
import { createProjectSchema, updateProjectSchema } from '~~/shared/schemas/project.schema'
import { createPhaseSchema, updatePhaseSchema } from '~~/shared/schemas/phase.schema'
import { createTaskSchema, updateTaskSchema } from '~~/shared/schemas/task.schema'
import { createEventSchema, updateEventSchema } from '~~/shared/schemas/event.schema'
import { importRequestSchema } from '~~/shared/schemas/import-export.schema'

// Tool `inputSchema`s only need to describe shape/types to the client --
// the MCP SDK converts them to JSON Schema for that, which can't carry
// Zod's defaults/transforms/cross-field refinements. So every handler
// below re-parses `args` against the real schema (the same ones the REST
// routes use) to get identical validation, exactly like parseBody does for
// HTTP bodies. This helper just adapts the failure shape for a tool
// result instead of an H3 error.
function parseToolArgs<T extends z.ZodTypeAny>(schema: T, args: unknown): z.output<T> {
  const result = schema.safeParse(args)
  if (!result.success) {
    const issues = result.error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    throw new Error(`Invalid arguments -- ${issues.join('; ')}`)
  }
  return result.data
}

function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

async function findProjectByIdentifier(identifier: string) {
  const db = useDb()
  const project = await db.project.findUnique({ where: { identifier: identifier.toUpperCase() } })
  if (!project) {
    throw new Error(`No project with identifier "${identifier}"`)
  }
  return project
}

const updateProjectToolSchema = z.object({ id: z.number().int().positive(), ...updateProjectSchema.shape })
const updatePhaseToolSchema = z.object({ id: z.number().int().positive(), ...updatePhaseSchema.shape })
const updateTaskToolSchema = z.object({ id: z.number().int().positive(), ...updateTaskSchema.shape })
const updateEventToolSchema = z.object({ id: z.number().int().positive(), ...updateEventSchema.shape })

// createEventSchema/updateEventSchema's `expectedAt` is z.coerce.date() for
// real parsing (parseToolArgs below still uses those schemas directly) --
// but zod-to-json-schema, which the SDK uses to build each tool's
// *advertised* inputSchema, can't represent a Date output type at all. The
// advertised shape swaps it for a plain string; parseToolArgs still coerces
// whatever string comes back into the Date Prisma expects.
const eventDateField = z
  .string()
  .nullable()
  .optional()
  .describe('ISO 8601 date/time, e.g. "2026-09-20". Omit to leave unchanged; null to clear.')
const createEventToolInputSchema = { ...createEventSchema.shape, expectedAt: eventDateField }
const updateEventToolInputSchema = { ...updateEventToolSchema.shape, expectedAt: eventDateField }

/** Builds a fresh MCP server wired to the same domain logic as
 * server/api/**. One of these (plus a fresh transport) is created per
 * request in server/routes/mcp.ts -- see the note there on why, for the
 * stateless deployment this app uses that's cheap and avoids any
 * cross-request state bleed. */
export function createTaskForgeMcpServer() {
  const server = new McpServer({ name: 'taskforge', version: '1.0.0' })
  const db = useDb()

  // -- Resources (read-only) --------------------------------------------

  server.registerResource(
    'projects',
    'taskforge://projects',
    {
      title: 'Projects',
      description: 'Every project, with its computed status/progress summary and upcoming events.',
      mimeType: 'application/json',
    },
    async uri => {
      const projects = await fetchProjectSummaries()
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(projects, null, 2) }] }
    },
  )

  server.registerResource(
    'project',
    new ResourceTemplate('taskforge://projects/{identifier}', {
      list: async () => {
        const projects = await fetchProjectSummaries()
        return {
          resources: projects.map(project => ({
            uri: `taskforge://projects/${project.identifier}`,
            name: project.name,
            description: `${project.identifier} -- ${project.statusSummary.currentPhaseName ?? 'no phases yet'}`,
            mimeType: 'application/json',
          })),
        }
      },
    }),
    { title: 'Project', description: 'One project\'s full phase/task/event tree.', mimeType: 'application/json' },
    async (uri, { identifier }) => {
      const project = await findProjectByIdentifier(String(identifier))
      const tree = await fetchProjectTree(project.id)
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(tree, null, 2) }] }
    },
  )

  // -- Read tools ----------------------------------------------------------
  // (also exposed as resources above, but not every client reads resources
  // proactively -- tools are the one interface every MCP client drives.)

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description: "List every project with its computed status/progress summary and upcoming events -- the same data as the app's dashboard.",
    },
    async () => jsonResult(await fetchProjectSummaries()),
  )

  server.registerTool(
    'get_project',
    {
      title: 'Get project',
      description: 'Get one project\'s full phase/task/event tree by its identifier (e.g. "HOMELAB").',
      inputSchema: { identifier: z.string().describe('The project identifier, e.g. "HOMELAB".') },
    },
    async ({ identifier }) => {
      const project = await findProjectByIdentifier(identifier)
      return jsonResult(await fetchProjectTree(project.id))
    },
  )

  server.registerTool(
    'export_project',
    {
      title: 'Export project',
      description: 'Get a portable JSON export of a project (phases, tasks, events) by its identifier.',
      inputSchema: { identifier: z.string().describe('The project identifier, e.g. "HOMELAB".') },
    },
    async ({ identifier }) => {
      const project = await findProjectByIdentifier(identifier)
      const document = await buildExportDocument(project.id)
      return jsonResult(document)
    },
  )

  // -- Write tools -----------------------------------------------------

  server.registerTool(
    'create_project',
    {
      title: 'Create project',
      description: 'Create a new project.',
      inputSchema: createProjectSchema.shape,
    },
    async args => {
      const body = parseToolArgs(createProjectSchema, args)
      const now = new Date()
      const project = await runUnique(
        () => db.project.create({ data: { ...body, createdAt: now, updatedAt: now } }),
        `A project with identifier "${body.identifier}" already exists`,
      )
      return jsonResult(project)
    },
  )

  server.registerTool(
    'update_project',
    {
      title: 'Update project',
      description: "Update a project's name, description, or status.",
      inputSchema: updateProjectToolSchema.shape,
    },
    async args => {
      const { id, ...body } = parseToolArgs(updateProjectToolSchema, args)
      const project = await runUnique(
        () => db.project.update({ where: { id }, data: { ...body, updatedAt: new Date() } }),
        body.identifier ? `A project with identifier "${body.identifier}" already exists` : 'Conflict',
      )
      if (!project) throw new Error('Project not found')
      return jsonResult(project)
    },
  )

  server.registerTool(
    'create_phase',
    {
      title: 'Create phase',
      description: 'Add a new phase to a project. New phases are appended after existing ones.',
      inputSchema: createPhaseSchema.shape,
    },
    async args => {
      const body = parseToolArgs(createPhaseSchema, args)
      const siblings = await db.phase.findMany({ where: { projectId: body.projectId }, select: { position: true } })
      const phase = await db.phase.create({ data: { ...body, position: nextPosition(siblings) } })
      return jsonResult(phase)
    },
  )

  server.registerTool(
    'update_phase',
    {
      title: 'Update phase',
      description:
        "Update a phase's name, description, status, or position. A phase with tasks can't be marked done manually -- complete its tasks instead.",
      inputSchema: updatePhaseToolSchema.shape,
    },
    async args => {
      const { id, ...body } = parseToolArgs(updatePhaseToolSchema, args)
      const existing = await db.phase.findUnique({ where: { id }, include: { tasks: { select: { id: true } } } })
      if (!existing) throw new Error('Phase not found')
      if (body.status === 'done' && existing.tasks.length > 0) {
        throw new Error("A phase with tasks can't be marked done manually -- complete its tasks instead")
      }
      const phase = await db.phase.update({ where: { id }, data: body })
      return jsonResult(phase)
    },
  )

  server.registerTool(
    'create_task',
    {
      title: 'Create task',
      description: 'Add a new task to a phase. New tasks are appended after existing ones in that phase.',
      inputSchema: createTaskSchema.shape,
    },
    async args => {
      const body = parseToolArgs(createTaskSchema, args)
      const siblings = await db.task.findMany({ where: { phaseId: body.phaseId }, select: { position: true } })
      const task = await db.task.create({ data: { ...body, position: nextPosition(siblings) } })
      return jsonResult(task)
    },
  )

  server.registerTool(
    'update_task',
    {
      title: 'Update task',
      description: "Update a task's title, description, status (e.g. mark it done), or other fields.",
      inputSchema: updateTaskToolSchema.shape,
    },
    async args => {
      const { id, ...body } = parseToolArgs(updateTaskToolSchema, args)
      const task = await db.task.update({ where: { id }, data: body }).catch(() => null)
      if (!task) throw new Error('Task not found')
      return jsonResult(task)
    },
  )

  server.registerTool(
    'create_event',
    {
      title: 'Create event',
      description:
        'Add a dated event (milestone, blocker, delivery, decision, maintenance window, or note) scoped to a project, phase, or task. A "blocker"-type event blocks its scope until marked occurred or cancelled.',
      inputSchema: createEventToolInputSchema,
    },
    async args => {
      const body = parseToolArgs(createEventSchema, args)
      await assertValidEventScope(body.projectId, body.scopeType, body.scopeId)
      const created = await db.event.create({ data: body })
      return jsonResult(created)
    },
  )

  server.registerTool(
    'update_event',
    {
      title: 'Update event',
      description:
        'Update an event -- e.g. mark a blocker "occurred" or "cancelled" to lift the block, or reschedule its expected date.',
      inputSchema: updateEventToolInputSchema,
    },
    async args => {
      const { id, ...body } = parseToolArgs(updateEventToolSchema, args)
      const existing = await db.event.findUnique({ where: { id } })
      if (!existing) throw new Error('Event not found')

      const scopeType = body.scopeType ?? existing.scopeType
      const scopeId = body.scopeId ?? existing.scopeId
      await assertValidEventScope(existing.projectId, scopeType, scopeId)

      const updated = await db.event.update({ where: { id }, data: body })
      return jsonResult(updated)
    },
  )

  server.registerTool(
    'import_project',
    {
      title: 'Import project',
      description: 'Create a project from a portable export document (see export_project).',
      inputSchema: importRequestSchema.shape,
    },
    async args => {
      const body = parseToolArgs(importRequestSchema, args)
      const existing = body.overwrite
        ? null
        : await db.project.findUnique({ where: { identifier: body.identifier }, select: { id: true } })
      if (existing) {
        throw new Error(`A project with identifier "${body.identifier}" already exists`)
      }
      const project = await createProjectFromImport(body.document, {
        identifier: body.identifier,
        overwrite: body.overwrite,
      })
      return jsonResult(project)
    },
  )

  return server
}
