import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

function openDatabase() {
  const path = resolve(process.env.NUXT_DATABASE_PATH ?? './server/db/data/taskforge.db')
  mkdirSync(dirname(path), { recursive: true })

  const sqlite = new Database(path)
  // Required for onDelete: 'cascade' to actually take effect -- SQLite does
  // not enforce foreign keys by default.
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

let instance: ReturnType<typeof openDatabase> | undefined

export function useDb() {
  instance ??= openDatabase()
  return instance
}
