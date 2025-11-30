import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migration script to update lab names and associate with new password-protected accounts
 *
 * This script:
 * 1. Deletes old labs (and associated services/orders via cascade)
 * 2. Deletes old lab admin users
 * 3. Re-runs seed to create new labs with generic names and secure passwords
 */

async function main() {
  console.log('🔄 Starting migration to secure passwords...\n')

  // Step 1: Delete old labs (cascade deletes services and orders)
  console.log('1️⃣ Deleting old labs...')
  const oldLabIds = await prisma.lab.findMany({
    where: {
      owner: {
        email: {
          in: ['lab@testinglab.com', 'lab2@chempro.com', 'lab3@eurofins.com', 'lab4@intertek.com']
        }
      }
    },
    select: { id: true, name: true }
  })

  if (oldLabIds.length > 0) {
    console.log(`   Found ${oldLabIds.length} old labs:`)
    oldLabIds.forEach(lab => console.log(`   - ${lab.name}`))

    // First delete orders associated with these labs
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        labId: { in: oldLabIds.map(l => l.id) }
      }
    })
    console.log(`   ✅ Deleted ${deletedOrders.count} orders`)

    // Then delete lab services
    const deletedServices = await prisma.labService.deleteMany({
      where: {
        labId: { in: oldLabIds.map(l => l.id) }
      }
    })
    console.log(`   ✅ Deleted ${deletedServices.count} lab services`)

    // Finally delete the labs
    const deletedLabs = await prisma.lab.deleteMany({
      where: {
        id: { in: oldLabIds.map(l => l.id) }
      }
    })
    console.log(`   ✅ Deleted ${deletedLabs.count} labs\n`)
  } else {
    console.log('   ℹ️  No old labs found\n')
  }

  // Step 2: Delete old lab admin users
  console.log('2️⃣ Deleting old lab admin users...')
  const oldEmails = ['lab@testinglab.com', 'lab2@chempro.com', 'lab3@eurofins.com', 'lab4@intertek.com']
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { in: oldEmails }
    }
  })
  console.log(`   ✅ Deleted ${deletedUsers.count} old lab admin users\n`)

  // Step 3: Re-run seed (user must do this manually)
  console.log('3️⃣ Next steps:')
  console.log('   Run the following command to create new labs with secure passwords:')
  console.log('   ')
  console.log('   npm run db:seed')
  console.log('   ')
  console.log('✅ Migration preparation complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Migration failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
