/**
 * 🎓 LEARNING: Prisma Client Singleton
 * ====================================
 * This file exports a single Prisma Client instance to prevent connection pool exhaustion.
 *
 * Key Concepts:
 * - Prisma Client manages database connections via a connection pool
 * - Each PrismaClient instance creates new connections
 * - In development, Next.js hot-reloads modules, which would create multiple instances
 * - Solution: Store instance in globalThis (not affected by hot-reload)
 * - In production, modules are cached naturally, so we create one instance
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
 * 🎓 Prisma Client Instance
 * Either use existing global instance or create new one
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log queries in development (helpful for debugging)
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

/**
 * 🎓 Store in Global
 * In development, preserve instance across hot-reloads
 * In production, this has no effect (globalThis is naturally stable)
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * 🎓 Graceful Shutdown
 * Close database connections when process exits
 */
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}