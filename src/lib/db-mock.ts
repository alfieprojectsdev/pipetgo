import { newDb, IMemoryDb, DataType } from 'pg-mem'
import { PrismaClient } from '@prisma/client'

let mockDb: IMemoryDb | null = null
let mockPrisma: PrismaClient | null = null

/**
 * Creates a pg-mem in-memory PostgreSQL database instance with Prisma schema.
 * Uses singleton pattern to avoid recreating the database on multiple calls.
 *
 * @returns Promise<PrismaClient> - Prisma client connected to pg-mem database
 */
export async function createPrismaMock(): Promise<PrismaClient> {
  if (mockPrisma) {
    return mockPrisma
  }

  // Create pg-mem instance with auto foreign key indices
  mockDb = newDb({
    autoCreateForeignKeyIndices: true,
  })

  // Register required PostgreSQL functions
  mockDb.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'mock_db',
  })

  mockDb.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 15.0 (pg-mem)',
  })

  // Register cuid() function for ID generation
  mockDb.public.registerFunction({
    name: 'cuid',
    returns: DataType.text,
    implementation: () => {
      // Simple CUID-like ID generator (timestamp + random)
      const timestamp = Date.now().toString(36)
      const randomPart = Math.random().toString(36).substring(2, 15)
      return `c${timestamp}${randomPart}`
    },
  })

  // Generate mock schema from Prisma schema
  await generateMockSchema(mockDb)

  // Bind pg-mem to a server
  const { connectionSettings } = await mockDb.adapters.bindServer({
    port: 0, // Random available port
  })

  // Construct PostgreSQL connection string
  const connectionString = `postgresql://postgres:postgres@${connectionSettings.host}:${connectionSettings.port}/mock_db`

  // Create Prisma client connected to pg-mem server
  mockPrisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })

  // Connect to the mock database
  await mockPrisma.$connect()

  console.log('✅ pg-mem database initialized with Prisma schema')

  return mockPrisma
}

/**
 * Generates the complete database schema matching prisma/schema.prisma.
 * Creates enums, tables, foreign keys, and constraints.
 *
 * @param db - pg-mem database instance
 */
async function generateMockSchema(db: IMemoryDb): Promise<void> {
  db.public.none(`
    -- Create Enums
    CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'LAB_ADMIN', 'ADMIN');
    CREATE TYPE "PricingMode" AS ENUM ('QUOTE_REQUIRED', 'FIXED', 'HYBRID');
    CREATE TYPE "OrderStatus" AS ENUM (
      'QUOTE_REQUESTED',
      'QUOTE_PROVIDED',
      'QUOTE_REJECTED',
      'PENDING',
      'ACKNOWLEDGED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    );

    -- Users table
    CREATE TABLE "users" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "name" TEXT,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" TIMESTAMP,
      "image" TEXT,
      "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Account table (NextAuth)
    CREATE TABLE "Account" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
      UNIQUE ("provider", "providerAccountId")
    );

    -- Session table (NextAuth)
    CREATE TABLE "Session" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP NOT NULL,
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    );

    -- VerificationToken table (NextAuth)
    CREATE TABLE "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expires" TIMESTAMP NOT NULL,
      UNIQUE ("identifier", "token")
    );

    -- Labs table
    CREATE TABLE "labs" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "ownerId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "location" JSONB,
      "certifications" TEXT[] NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "labs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id")
    );

    -- LabService table
    CREATE TABLE "lab_services" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "labId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "category" TEXT NOT NULL,
      "pricingMode" "PricingMode" NOT NULL DEFAULT 'QUOTE_REQUIRED',
      "pricePerUnit" DECIMAL,
      "unitType" TEXT NOT NULL DEFAULT 'per_sample',
      "turnaroundDays" INTEGER,
      "sampleRequirements" TEXT,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "lab_services_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE
    );

    -- Orders table
    CREATE TABLE "orders" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "clientId" TEXT NOT NULL,
      "labId" TEXT NOT NULL,
      "serviceId" TEXT NOT NULL,
      "status" "OrderStatus" NOT NULL DEFAULT 'QUOTE_REQUESTED',
      "clientDetails" JSONB NOT NULL,
      "sampleDescription" TEXT NOT NULL,
      "specialInstructions" TEXT,
      "quotedPrice" DECIMAL,
      "quotedAt" TIMESTAMP,
      "quoteNotes" TEXT,
      "estimatedTurnaroundDays" INTEGER,
      "quoteApprovedAt" TIMESTAMP,
      "quoteRejectedAt" TIMESTAMP,
      "quoteRejectedReason" TEXT,
      "acknowledgedAt" TIMESTAMP,
      "completedAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id"),
      CONSTRAINT "orders_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id"),
      CONSTRAINT "orders_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "lab_services"("id")
    );

    -- Attachments table
    CREATE TABLE "attachments" (
      "id" TEXT PRIMARY KEY DEFAULT cuid(),
      "orderId" TEXT NOT NULL,
      "uploadedById" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "fileUrl" TEXT NOT NULL,
      "fileType" TEXT NOT NULL,
      "fileSize" INTEGER,
      "attachmentType" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "attachments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
      CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
    );
  `)

  console.log('✅ Mock schema generated from Prisma schema')
}

/**
 * Seeds the mock database with test data for all pricing modes.
 * Creates test users, lab, and services to support testing workflows.
 *
 * @param prisma - Prisma client instance
 */
export async function seedMockDatabase(prisma: PrismaClient): Promise<void> {
  // Seed test users
  await prisma.user.createMany({
    data: [
      {
        id: 'user-client-1',
        email: 'client@test.com',
        name: 'Test Client',
        role: 'CLIENT',
      },
      {
        id: 'user-lab-admin-1',
        email: 'labadmin@test.com',
        name: 'Test Lab Admin',
        role: 'LAB_ADMIN',
      },
      {
        id: 'user-admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
      },
    ],
  })

  // Seed test lab
  await prisma.lab.create({
    data: {
      id: 'lab-1',
      ownerId: 'user-lab-admin-1',
      name: 'Test Lab',
      description: 'ISO 17025 certified testing laboratory',
      location: {
        city: 'Manila',
        province: 'Metro Manila',
        country: 'Philippines',
      },
      certifications: ['ISO 17025'],
    },
  })

  // Seed test services (one for each pricing mode)
  await prisma.labService.createMany({
    data: [
      {
        id: 'service-quote-1',
        labId: 'lab-1',
        name: 'Custom Water Analysis',
        description: 'Requires custom quote based on parameters',
        category: 'Water Testing',
        pricingMode: 'QUOTE_REQUIRED',
        pricePerUnit: null,
        unitType: 'per_sample',
        turnaroundDays: 7,
        active: true,
      },
      {
        id: 'service-fixed-1',
        labId: 'lab-1',
        name: 'Standard Microbiological Testing',
        description: 'Fixed pricing for instant booking',
        category: 'Microbiology',
        pricingMode: 'FIXED',
        pricePerUnit: 500,
        unitType: 'per_sample',
        turnaroundDays: 3,
        active: true,
      },
      {
        id: 'service-hybrid-1',
        labId: 'lab-1',
        name: 'Heavy Metals Analysis',
        description: 'Reference price available, custom quotes accepted',
        category: 'Chemical Testing',
        pricingMode: 'HYBRID',
        pricePerUnit: 800,
        unitType: 'per_sample',
        turnaroundDays: 5,
        active: true,
      },
    ],
  })

  console.log('✅ Mock database seeded with test data')
}

/**
 * Resets the mock database singleton (useful for test isolation).
 * Forces recreation of database on next createPrismaMock() call.
 */
export async function resetMockDatabase(): Promise<void> {
  if (mockPrisma) {
    await mockPrisma.$disconnect()
  }
  mockDb = null
  mockPrisma = null
}
