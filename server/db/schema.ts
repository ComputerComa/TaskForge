import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const timestamp = (name: string) =>
  integer(name, { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`)

// --- Auth ---------------------------------------------------------------

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at'),
})

// --- Core hierarchy: Project -> Phase -> Task ----------------------------
//
// Deliberately 3 levels, not 4: a Task is the atomic, ordered checklist
// item (what earlier drafts called a "Step"). Phases and tasks block
// purely sequentially by position -- the previous one in the list must be
// done -- there is no free-form dependency graph.

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  identifier: text('identifier').notNull().unique(),
  name: text('name').notNull(),
  // The project's overall goal -- what the whole thing is for.
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
  // active | done | archived -- a manual override; the "current phase" used
  // for status/progress is normally derived from task completion instead
  // (see server/utils/db-helpers.ts), so this mostly matters for phases
  // with no tasks yet, or for marking one skipped/archived.
  status: text('status').notNull().default('active'),
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  phaseId: integer('phase_id')
    .notNull()
    .references(() => phases.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  // pending | done
  status: text('status').notNull().default('pending'),
  position: integer('position').notNull().default(0),
  command: text('command'),
  notes: text('notes'),
  link: text('link'),
})

// --- Events ---------------------------------------------------------------
//
// Dated milestones, blockers, deliveries, decisions, maintenance windows,
// and log notes -- distinct from the task checklist. An event is attached
// to a project, phase, or task (scopeType/scopeId); a `blocker`-type event
// blocks that same scope for as long as its status stays 'upcoming'. See
// server/utils/db-helpers.ts -> isActiveBlocker.

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Denormalized owning project, for cheap "all events in this project"
  // queries regardless of scope depth (mirrors tasks.projectId).
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  // project | phase | task -- what this event is attached to (and, for a
  // blocker, what it blocks). scopeId is polymorphic (a phases.id or
  // tasks.id depending on scopeType) so it isn't a DB-level foreign key;
  // validated in the API layer instead (assertValidEventScope). When a
  // phase or task is deleted, events scoped to it are demoted to project
  // scope rather than orphaned -- see the phases/tasks DELETE handlers.
  scopeType: text('scope_type').notNull().default('project'),
  // Equals projectId when scopeType is 'project'.
  scopeId: integer('scope_id').notNull(),
  // milestone | blocker | delivery | decision | maintenance_window | note
  type: text('type').notNull().default('milestone'),
  title: text('title').notNull(),
  description: text('description'),
  expectedAt: integer('expected_at', { mode: 'timestamp_ms' }),
  // upcoming | occurred | cancelled -- for a blocker, "upcoming" means
  // still actively blocking; "occurred" or "cancelled" clears the block.
  status: text('status').notNull().default('upcoming'),
  createdAt: timestamp('created_at'),
})
