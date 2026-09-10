// Creates the single admin user for local auth. There is no signup flow in
// this slice -- run this once after migrating:
//
//   npm run db:migrate && npm run db:seed
//
// Idempotent: no-ops if any user already exists, so it's safe to re-run
// (e.g. as part of a container's startup script).
//
// Hashing is done with the same @adonisjs/hash Scrypt driver (default
// options) that nuxt-auth-utils uses internally for hashPassword/
// verifyPassword, so hashes produced here verify correctly at login. It's
// used directly (rather than nuxt-auth-utils's hashPassword) because this
// script runs standalone via tsx, outside the Nitro build that resolves
// nuxt-auth-utils's `#imports`-dependent internals.
import 'dotenv/config'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { useDb } from './client'

async function main() {
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  const username = env.ADMIN_USERNAME
  if (!username) {
    console.error('ADMIN_USERNAME must be set (see .env.example).')
    throw new Error('ADMIN_USERNAME must be set (see .env.example).')
  }

  const db = useDb()
  const existing = await db.user.findFirst({ select: { id: true } })
  if (existing) {
    console.log('admin user already exists, skipping.')
    return
  }

  const password = Array.from({ length: 4 }, () => crypto.randomUUID().replaceAll('-', '')).join('').slice(0, 32)
  const hash = new Hash(new Scrypt({}))
  const passwordHash = await hash.make(password)
  await db.user.create({ data: { username, passwordHash } })
  console.log(`created admin user "${username}".`)
  console.log(`Generated admin password (save it now; it will not be shown again): ${password}`)
}

main().catch(error => {
  console.error(error)
  throw error
})
