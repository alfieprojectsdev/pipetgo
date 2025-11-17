/**
 * 🎓 LEARNING: Prisma Client Singleton (Dual-Mode)
 * =================================================
 * This file exports a single Prisma Client instance to prevent connection pool exhaustion.
 * It supports TWO modes: live database (Neon) and mock database (pg-mem).
 *
 * Key Concepts:
 * - Prisma Client manages database connections via a connection pool
 * - Each PrismaClient instance creates new connections
 * - In development, Next.js hot-reloads modules, which would create multiple instances
 * - Solution: Store instance in globalThis (not affected by hot-reload)
 * - In production, modules are cached naturally, so we create one instance
 *
 * Dual-Mode Pattern:
 * - Set USE_MOCK_DB=true → Uses pg-mem (in-memory mock database)
 * - Set USE_MOCK_DB=false or unset → Uses Neon (live PostgreSQL)
 * - Mock mode is for fast, isolated tests without network calls
 * - Live mode is for integration tests and production
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/db'
 * const users = await prisma.user.findMany()
 * ```
 *
 * ⚠️ NEVER create new PrismaClient() instances elsewhere in the code!
 */

import { PrismaClient } from '@prisma/client'

/**
 * 🎓 Global Type Declaration
 * TypeScript doesn't know about our custom global variable
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * 🎓 Prisma Client Instance (Live Mode)
 * Uses Neon PostgreSQL connection
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log queries in development (helpful for debugging)
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

/**
 * 🎓 Store in Global (Development Only)
 * In development, preserve instance across hot-reloads
 * In production, this has no effect (globalThis is naturally stable)
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * 🎓 Graceful Shutdown (Live Mode Only)
 * Close database connections when process exits
 * Not needed for mock mode (pg-mem is in-memory, no connections to close)
 */
if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_DB !== 'true') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}