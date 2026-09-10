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
import { users } from './schema'

async function main() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set (see .env.example).')
    process.exit(1)
  }

  const db = useDb()
  const existing = db.select({ id: users.id }).from(users).limit(1).all()
  if (existing.length > 0) {
    console.log('admin user already exists, skipping.')
    return
  }

  const hash = new Hash(new Scrypt({}))
  const passwordHash = await hash.make(password)
  db.insert(users).values({ username, passwordHash }).run()
  console.log(`created admin user "${username}".`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
