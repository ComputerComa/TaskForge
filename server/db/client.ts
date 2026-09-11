import { PrismaClient } from '@prisma/client'

// Models are intentionally not defined here; the application owner supplies
// prisma/schema.prisma separately.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function useDb() {
  globalForPrisma.prisma ??= new PrismaClient()
  return globalForPrisma.prisma
}
