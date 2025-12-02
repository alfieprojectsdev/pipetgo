import bcrypt from 'bcryptjs'

async function generateDemoPasswords() {
  const passwords = {
    ADMIN: 'AdminDemo123!',
    CLIENT: 'ClientDemo123!',
  }

  console.log('='.repeat(60))
  console.log('DEMO PASSWORD BCRYPT HASHES')
  console.log('='.repeat(60))
  console.log()

  for (const [role, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 12)
    console.log(`${role} Role:`)
    console.log(`  Password: ${password}`)
    console.log(`  Hash: ${hash}`)
    console.log()
  }

  console.log('='.repeat(60))
  console.log('SQL UPDATE STATEMENTS (for Neon Console)')
  console.log('='.repeat(60))
  console.log()

  const adminHash = await bcrypt.hash('AdminDemo123!', 12)
  const clientHash = await bcrypt.hash('ClientDemo123!', 12)

  console.log(`-- Update ADMIN account`)
  console.log(`UPDATE "users"`)
  console.log(`SET "hashedPassword" = '${adminHash}',`)
  console.log(`    "updatedAt" = NOW()`)
  console.log(`WHERE email = 'admin@pipetgo.com';`)
  console.log()

  console.log(`-- Update CLIENT account (demo client 1)`)
  console.log(`UPDATE "users"`)
  console.log(`SET "hashedPassword" = '${clientHash}',`)
  console.log(`    "updatedAt" = NOW()`)
  console.log(`WHERE email = 'client@example.com';`)
  console.log()

  console.log(`-- Verify changes`)
  console.log(`SELECT email, role, "hashedPassword" IS NOT NULL as has_password`)
  console.log(`FROM "users"`)
  console.log(`WHERE email IN ('admin@pipetgo.com', 'client@example.com')`)
  console.log(`ORDER BY role;`)
  console.log()
  console.log('='.repeat(60))
}

generateDemoPasswords().catch(console.error)
