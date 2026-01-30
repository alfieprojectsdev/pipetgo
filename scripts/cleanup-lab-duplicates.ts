import { prisma } from '../src/lib/db'
import * as readline from 'readline'

interface Lab {
  lab_id: string
  lab_name: string
  lab_created: Date
  service_count: bigint
  order_count: bigint
}

async function findDuplicateLabs(email: string): Promise<Lab[]> {
  return await prisma.$queryRaw<Lab[]>`
    SELECT
      l.id as lab_id,
      l.name as lab_name,
      l."createdAt" as lab_created,
      COUNT(DISTINCT ls.id) as service_count,
      COUNT(DISTINCT o.id) as order_count
    FROM "labs" l
    LEFT JOIN "lab_services" ls ON ls."labId" = l.id
    LEFT JOIN "orders" o ON o."labId" = l.id
    WHERE l."ownerId" = (SELECT id FROM "users" WHERE email = ${email})
    GROUP BY l.id, l.name, l."createdAt"
    ORDER BY l."createdAt" ASC;
  `
}

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

async function cleanupDuplicates(email: string, dryRun: boolean = true) {
  console.log('='.repeat(60))
  console.log(`CLEANUP DUPLICATE LABS - ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`)
  console.log('='.repeat(60))
  console.log()

  // Find duplicates
  const labs = await findDuplicateLabs(email)

  if (labs.length === 0) {
    console.log(`❌ No labs found for ${email}`)
    return
  }

  if (labs.length === 1) {
    console.log(`✅ Only 1 lab found for ${email} (no cleanup needed)`)
    return
  }

  console.log(`Found ${labs.length} labs for ${email}:`)
  console.table(labs.map((lab, index) => ({
    index: index + 1,
    keep: index === 0 ? '✅ KEEP' : '❌ DELETE',
    lab_id: lab.lab_id.substring(0, 8) + '...',
    created: lab.lab_created,
    services: Number(lab.service_count),
    orders: Number(lab.order_count)
  })))

  const keepLab = labs[0]
  const deleteLabs = labs.slice(1)

  console.log(`\nStrategy: Keep oldest lab, delete ${deleteLabs.length} duplicates`)
  console.log(`✅ KEEP: ${keepLab.lab_id} (created ${keepLab.lab_created})`)
  deleteLabs.forEach(lab => {
    console.log(`❌ DELETE: ${lab.lab_id} (${Number(lab.service_count)} services, ${Number(lab.order_count)} orders)`)
  })

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made')
    console.log('Run with --execute flag to perform cleanup')
    return
  }

  // Confirm before deletion
  console.log()
  const confirmed = await promptConfirmation('⚠️  Are you sure you want to DELETE these labs?')

  if (!confirmed) {
    console.log('❌ Cleanup cancelled')
    return
  }

  // Perform deletion in transaction
  console.log('\n🔄 Deleting duplicate labs...')

  for (const lab of deleteLabs) {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete services (will cascade delete if foreign keys set up)
        const deletedServices = await tx.labService.deleteMany({
          where: { labId: lab.lab_id }
        })

        // Update orders to reference the kept lab
        const updatedOrders = await tx.order.updateMany({
          where: { labId: lab.lab_id },
          data: { labId: keepLab.lab_id }
        })

        // Delete the lab
        await tx.lab.delete({
          where: { id: lab.lab_id }
        })

        console.log(`   ✅ Deleted lab ${lab.lab_id.substring(0, 8)}... (${Number(deletedServices.count)} services, ${Number(updatedOrders.count)} orders moved)`)
      })
    } catch (error) {
      console.error(`   ❌ Failed to delete lab ${lab.lab_id}:`, error)
      throw error
    }
  }

  console.log('\n✅ Cleanup complete!')
}

async function main() {
  const args = process.argv.slice(2)
  const email = args.find(arg => !arg.startsWith('--')) || 'lab4@testlabpg.com'
  const execute = args.includes('--execute')

  try {
    await cleanupDuplicates(email, !execute)
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
