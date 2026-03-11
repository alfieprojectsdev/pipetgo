import { prisma } from '../src/lib/db'
import bcrypt from 'bcryptjs'

interface PasswordUpdate {
  email: string
  role: string
  password: string
  currentHasPassword: boolean
}

async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

async function checkCurrentState(): Promise<PasswordUpdate[]> {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@pipetgo.com', 'client@example.com']
      }
    },
    select: {
      email: true,
      role: true,
      hashedPassword: true
    }
  })

  return users.map(user => ({
    email: user.email,
    role: user.role,
    password: user.role === 'ADMIN' ? 'AdminDemo123!' : 'ClientDemo123!',
    currentHasPassword: user.hashedPassword !== null
  }))
}

async function updatePasswords(dryRun: boolean = true) {
  console.log('='.repeat(60))
  console.log(`UPDATE DEMO PASSWORDS - ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`)
  console.log('='.repeat(60))
  console.log()

  // Check current state
  const updates = await checkCurrentState()

  if (updates.length === 0) {
    console.log('❌ No users found to update')
    console.log('   Expected: admin@pipetgo.com, client@example.com')
    return
  }

  console.log('Current State:')
  console.table(updates.map(u => ({
    email: u.email,
    role: u.role,
    current_password: u.currentHasPassword ? '✅ Set' : '❌ NULL',
    new_password: u.password
  })))

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made')
    console.log('Run with --execute flag to update passwords')
    console.log()

    for (const update of updates) {
      const hash = await generatePasswordHash(update.password)
      console.log(`\nWould update ${update.email}:`)
      console.log(`  Password: ${update.password}`)
      console.log(`  Hash: ${hash.substring(0, 20)}...`)
    }

    return
  }

  // Execute updates
  console.log('\n🔄 Updating passwords...')

  for (const update of updates) {
    try {
      const hash = await generatePasswordHash(update.password)

      await prisma.user.update({
        where: { email: update.email },
        data: {
          hashedPassword: hash,
          updatedAt: new Date()
        }
      })

      console.log(`   ✅ Updated ${update.email}`)
      console.log(`      Password: ${update.password}`)
    } catch (error) {
      console.error(`   ❌ Failed to update ${update.email}:`, error)
      throw error
    }
  }

  // Verify changes
  console.log('\n📋 Verifying changes...')

  const verified = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@pipetgo.com', 'client@example.com']
      }
    },
    select: {
      email: true,
      role: true,
      hashedPassword: true
    }
  })

  const allUpdated = verified.every(u => u.hashedPassword !== null)

  console.table(verified.map(u => ({
    email: u.email,
    role: u.role,
    has_password: u.hashedPassword !== null ? '✅ Yes' : '❌ No'
  })))

  if (allUpdated) {
    console.log('\n✅ All passwords updated successfully!')
    console.log()
    console.log('Login Credentials:')
    console.log('─'.repeat(60))
    console.log('ADMIN Login:')
    console.log('  URL: https://www.pipetgo.com/auth/signin')
    console.log('  Email: admin@pipetgo.com')
    console.log('  Password: AdminDemo123!')
    console.log()
    console.log('CLIENT Login:')
    console.log('  URL: https://www.pipetgo.com/auth/signin')
    console.log('  Email: client@example.com')
    console.log('  Password: ClientDemo123!')
    console.log('─'.repeat(60))
  } else {
    console.log('\n❌ Some passwords failed to update')
    throw new Error('Password update incomplete')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute')

  try {
    await updatePasswords(!execute)
  } catch (error) {
    console.error('❌ Password update failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
