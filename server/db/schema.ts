import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const timestamp = (name: string) =>
  integer(name, { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`)

// --- Auth ---------------------------------------------------------------

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at'),
})

// --- Core hierarchy: Project -> Phase -> Task -> Step --------------------

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  identifier: text('identifier').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  // active | on_hold | done | archived -- enforced in the Zod layer, not here.
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const phases = sqliteTable('phases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  position: integer('position').notNull().default(0),
  // active | done | archived -- stored directly, not derived from tasks in this slice.
  status: text('status').notNull().default('active'),
})

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    phaseId: integer('phase_id')
      .notNull()
      .references(() => phases.id, { onDelete: 'cascade' }),
    reference: text('reference').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    // backlog | ready | in_progress | waiting | done
    status: text('status').notNull().default('backlog'),
    assignee: text('assignee'),
    dueAt: integer('due_at', { mode: 'timestamp_ms' }),
    position: integer('position').notNull().default(0),
  },
  table => [
    uniqueIndex('tasks_project_reference_unique').on(table.projectId, table.reference),
    uniqueIndex('tasks_project_slug_unique').on(table.projectId, table.slug),
  ],
)

export const steps = sqliteTable('steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  // pending | done
  status: text('status').notNull().default('pending'),
  position: integer('position').notNull().default(0),
  command: text('command'),
  notes: text('notes'),
  link: text('link'),
})

export const taskDependencies = sqliteTable(
  'task_dependencies',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    dependsOnTaskId: integer('depends_on_task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
  },
  table => [uniqueIndex('task_dependencies_edge_unique').on(table.taskId, table.dependsOnTaskId)],
)
