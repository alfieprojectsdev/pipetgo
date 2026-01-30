import { prisma } from '../src/lib/db'

async function verifyIntegrity() {
  console.log('='.repeat(60))
  console.log('DATABASE INTEGRITY VERIFICATION')
  console.log('='.repeat(60))
  console.log()

  let allPassed = true

  // Check 1: No duplicate labs
  const duplicates = await prisma.$queryRaw<Array<{ email: string, lab_count: bigint }>>`
    SELECT u.email, COUNT(DISTINCT l.id) as lab_count
    FROM "users" u
    LEFT JOIN "labs" l ON l."ownerId" = u.id
    WHERE u.role = 'LAB_ADMIN'
    GROUP BY u.email
    HAVING COUNT(DISTINCT l.id) > 1;
  `

  if (duplicates.length === 0) {
    console.log('✅ No duplicate labs found')
  } else {
    console.log('❌ Found duplicate labs:')
    console.table(duplicates.map(row => ({
      ...row,
      lab_count: Number(row.lab_count)
    })))
    allPassed = false
  }

  // Check 2: No orphaned services
  const orphanedServices = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "lab_services" ls
    LEFT JOIN "labs" l ON ls."labId" = l.id
    WHERE l.id IS NULL;
  `

  const serviceCount = Number(orphanedServices[0].count)
  if (serviceCount === 0) {
    console.log('✅ No orphaned services')
  } else {
    console.log(`❌ Found ${serviceCount} orphaned services`)
    allPassed = false
  }

  // Check 3: No orphaned orders
  const orphanedOrders = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "orders" o
    LEFT JOIN "labs" l ON o."labId" = l.id
    WHERE l.id IS NULL;
  `

  const orderCount = Number(orphanedOrders[0].count)
  if (orderCount === 0) {
    console.log('✅ No orphaned orders')
  } else {
    console.log(`❌ Found ${orderCount} orphaned orders`)
    allPassed = false
  }

  console.log()
  console.log('='.repeat(60))
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED')
  } else {
    console.log('❌ INTEGRITY ISSUES FOUND')
  }
  console.log('='.repeat(60))

  if (!allPassed) {
    process.exit(1)
  }
}

async function main() {
  try {
    await verifyIntegrity()
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
