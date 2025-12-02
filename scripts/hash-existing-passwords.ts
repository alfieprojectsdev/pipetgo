import bcrypt from 'bcryptjs'

/**
 * Hash existing passwords from LAB_ACCOUNT_CREDENTIALS.md
 *
 * This script takes the plaintext passwords that were already generated
 * and creates bcrypt hashes that can be used to update the production database.
 *
 * Run with: npx tsx scripts/hash-existing-passwords.ts
 */

async function main() {
  // Passwords from scripts/LAB_ACCOUNT_CREDENTIALS.md
  const accounts = [
    {
      email: 'lab1@pgtestinglab.com',
      password: 'HSmgGnbBcZ!zRsGQsnDkNHnu',
      name: 'Testing Lab 1'
    },
    {
      email: 'lab2@pgtestlab.com',
      password: 'f3iCMaNunBqNB6AzBf7bnFyR',
      name: 'Testing Lab 2'
    },
    {
      email: 'lab3@pgtstlab.com',
      password: 'W4!cTAV@Gs2vNLE9@VEHCUDz',
      name: 'Testing Lab 3'
    },
    {
      email: 'lab4@testlabpg.com',
      password: 'rY!hXsCWvUHbf8e65QwveYPG',
      name: 'Testing Lab 4'
    },
  ]

  console.log('\n🔐 Hashing Existing Passwords from Credential File\n')
  console.log('='.repeat(80))

  const hashedAccounts = []

  for (const account of accounts) {
    console.log(`\nProcessing: ${account.name} (${account.email})`)
    const hashedPassword = await bcrypt.hash(account.password, 12)

    hashedAccounts.push({
      email: account.email,
      hashedPassword,
      name: account.name
    })

    console.log(`✓ Password hashed successfully`)
    console.log(`  Hash: ${hashedPassword}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ All passwords hashed successfully!\n')
  console.log('📋 SQL UPDATE STATEMENTS FOR PRODUCTION:\n')
  console.log('-- Copy and run these in production database (Neon console)\n')

  for (const account of hashedAccounts) {
    console.log(`UPDATE "User" SET "hashedPassword" = '${account.hashedPassword}'`)
    console.log(`WHERE email = '${account.email}';`)
    console.log()
  }

  console.log('\n📋 VERIFICATION QUERY:\n')
  console.log(`SELECT email, role, "hashedPassword" IS NOT NULL as has_password`)
  console.log(`FROM "User"`)
  console.log(`WHERE email IN (`)
  for (let i = 0; i < hashedAccounts.length; i++) {
    const account = hashedAccounts[i]
    console.log(`  '${account.email}'${i < hashedAccounts.length - 1 ? ',' : ''}`)
  }
  console.log(`);`)

  console.log('\n' + '='.repeat(80))
  console.log('\n⚠️  IMPORTANT NOTES:\n')
  console.log('1. These SQL statements assume users already exist in production DB')
  console.log('2. If users do NOT exist, create them first with seed script')
  console.log('3. After running UPDATE, test login with ONE account before proceeding')
  console.log('4. Keep LAB_ACCOUNT_CREDENTIALS.md in secure location (DO NOT commit)')
  console.log('\n')
}

main().catch(console.error)
