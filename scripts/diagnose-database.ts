import { prisma } from '../src/lib/db'

async function diagnoseDatabaseIntegrity() {
  console.log('='.repeat(60))
  console.log('DATABASE INTEGRITY DIAGNOSTIC')
  console.log('='.repeat(60))
  console.log()

  // Query 1: Check for duplicate labs across all users
  console.log('1. Checking for duplicate labs...')
  console.log('   (Users with multiple labs or >10 services)')
  console.log()

  const duplicateLabs = await prisma.$queryRaw<Array<{
    email: string
    role: string
    lab_count: bigint
    total_services: bigint
    lab_names: string
  }>>`
    SELECT
      u.email,
      u.role,
      COUNT(DISTINCT l.id) as lab_count,
      COUNT(ls.id) as total_services,
      STRING_AGG(DISTINCT l.name, ', ') as lab_names
    FROM "users" u
    LEFT JOIN "labs" l ON l."ownerId" = u.id
    LEFT JOIN "lab_services" ls ON ls."labId" = l.id
    GROUP BY u.email, u.role
    HAVING COUNT(DISTINCT l.id) > 1 OR COUNT(ls.id) > 10
    ORDER BY COUNT(DISTINCT l.id) DESC, COUNT(ls.id) DESC;
  `

  if (duplicateLabs.length === 0) {
    console.log('   ✅ No duplicate labs found')
  } else {
    console.log(`   ⚠️  Found ${duplicateLabs.length} users with issues:`)
    console.table(duplicateLabs.map(row => ({
      ...row,
      lab_count: Number(row.lab_count),
      total_services: Number(row.total_services)
    })))
  }

  // Query 2: Check for orphaned data
  console.log('\n2. Checking for orphaned data...')
  console.log('   (Broken foreign key references)')
  console.log()

  const orphanedData = await prisma.$queryRaw<Array<{
    issue_type: string
    count: bigint
  }>>`
    SELECT 'Orphaned Services' as issue_type, COUNT(*) as count
    FROM "lab_services" ls
    LEFT JOIN "labs" l ON ls."labId" = l.id
    WHERE l.id IS NULL

    UNION ALL

    SELECT 'Orphaned Orders (bad service)', COUNT(*)
    FROM "orders" o
    LEFT JOIN "lab_services" ls ON o."serviceId" = ls.id
    WHERE ls.id IS NULL

    UNION ALL

    SELECT 'Orphaned Orders (bad lab)', COUNT(*)
    FROM "orders" o
    LEFT JOIN "labs" l ON o."labId" = l.id
    WHERE l.id IS NULL

    UNION ALL

    SELECT 'Orphaned Orders (bad client)', COUNT(*)
    FROM "orders" o
    LEFT JOIN "users" u ON o."clientId" = u.id
    WHERE u.id IS NULL;
  `

  const hasOrphans = orphanedData.some(row => Number(row.count) > 0)
  if (!hasOrphans) {
    console.log('   ✅ No orphaned data found')
  } else {
    console.log('   ⚠️  Found orphaned data:')
    console.table(orphanedData.map(row => ({
      ...row,
      count: Number(row.count)
    })))
  }

  // Query 3: Check specific user labs (lab4@testlabpg.com)
  console.log('\n3. Checking lab4@testlabpg.com specifically...')
  console.log('   (Detailed breakdown of duplicate labs)')
  console.log()

  const lab4Labs = await prisma.$queryRaw<Array<{
    lab_id: string
    lab_name: string
    lab_created: Date
    service_count: bigint
    order_count: bigint
  }>>`
    SELECT
      l.id as lab_id,
      l.name as lab_name,
      l."createdAt" as lab_created,
      COUNT(DISTINCT ls.id) as service_count,
      COUNT(DISTINCT o.id) as order_count
    FROM "labs" l
    LEFT JOIN "lab_services" ls ON ls."labId" = l.id
    LEFT JOIN "orders" o ON o."labId" = l.id
    WHERE l."ownerId" = (SELECT id FROM "users" WHERE email = 'lab4@testlabpg.com')
    GROUP BY l.id, l.name, l."createdAt"
    ORDER BY l."createdAt" ASC;
  `

  if (lab4Labs.length === 0) {
    console.log('   ℹ️  No labs found for lab4@testlabpg.com')
  } else if (lab4Labs.length === 1) {
    console.log('   ✅ Only 1 lab found (no duplicates)')
    console.table(lab4Labs.map(row => ({
      ...row,
      service_count: Number(row.service_count),
      order_count: Number(row.order_count)
    })))
  } else {
    console.log(`   ⚠️  Found ${lab4Labs.length} duplicate labs:`)
    console.table(lab4Labs.map((row, index) => ({
      index: index + 1,
      lab_id: row.lab_id.substring(0, 8) + '...',
      lab_name: row.lab_name,
      created: row.lab_created,
      services: Number(row.service_count),
      orders: Number(row.order_count)
    })))
    console.log('\n   💡 Recommended: Keep oldest lab (row 1), delete others')
  }

  console.log()
  console.log('='.repeat(60))
  console.log('DIAGNOSTIC COMPLETE')
  console.log('='.repeat(60))
}

async function main() {
  try {
    await diagnoseDatabaseIntegrity()
  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
