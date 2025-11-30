import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Generate cryptographically secure password
 *
 * Requirements:
 * - 24 characters
 * - Uppercase, lowercase, numbers, special characters
 * - Avoid ambiguous characters (0/O, 1/l/I)
 * - Use crypto.randomBytes() for entropy
 */
function generateSecurePassword(): string {
  const buffer = crypto.randomBytes(32)
  const base64 = buffer.toString('base64')

  // Replace ambiguous and special chars with safe symbols
  const password = base64
    .replace(/[0OoIl1]/g, '') // Remove ambiguous
    .replace(/\+/g, '!')
    .replace(/\//g, '@')
    .replace(/=/g, '#')
    .substring(0, 24)  // 24 chars

  return password
}

async function main() {
  const labAccounts = [
    { email: 'lab1@pgtestinglab.com', name: 'Testing Lab 1' },
    { email: 'lab2@pgtestlab.com', name: 'Testing Lab 2' },
    { email: 'lab3@pgtstlab.com', name: 'Testing Lab 3' },
    { email: 'lab4@testlabpg.com', name: 'Testing Lab 4' },
  ]

  console.log('\n🔐 Generated Lab Account Credentials\n')
  console.log('CEO: Copy these to secure spreadsheet and distribute carefully.\n')
  console.log('='.repeat(80))

  for (const account of labAccounts) {
    const password = generateSecurePassword()
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log(`\n${account.name}`)
    console.log(`Email: ${account.email}`)
    console.log(`Password: ${password}`)
    console.log(`Hashed: ${hashedPassword}`)
    console.log('-'.repeat(80))
  }

  console.log('\n✅ Passwords generated. Copy hashed passwords to seed.ts\n')
  console.log('IMPORTANT: Save plaintext passwords to secure document for CEO distribution.\n')
}

main().catch(console.error)
