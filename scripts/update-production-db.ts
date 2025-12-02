/**
 * Production Database Update Script
 *
 * Adds hashed passwords to lab admin users directly via script
 * No manual SQL execution needed!
 *
 * Usage:
 *   npx tsx scripts/update-production-db.ts
 *
 * Environment:
 *   Requires DATABASE_URL in .env (production Neon connection string)
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const LAB_ADMINS = [
  {
    email: 'lab1@pgtestinglab.com',
    hashedPassword: '$2b$12$h/kWZYI1SIPahWOiWtprveXbw/Tzpgyr0wOaPik/kZvAb49UFl/YK',
    name: 'Testing Lab 1'
  },
  {
    email: 'lab2@pgtestlab.com',
    hashedPassword: '$2b$12$/45QGazcH0DIKJfpi72GoeE/.I.Nk90sV/BSh2qJTR2n48h51R.sK',
    name: 'Testing Lab 2'
  },
  {
    email: 'lab3@pgtstlab.com',
    hashedPassword: '$2b$12$Mwev5yrkJvg7ffg3uGrpG.B2wsX7qFT/Akzl.IIgzkR6tXSAfOOqe',
    name: 'Testing Lab 3'
  },
  {
    email: 'lab4@testlabpg.com',
    hashedPassword: '$2b$12$lRbw1CRpZaCTwU.V3yeMI.7pl5EVjOvgAHXCBMy94BKbmbl9hKNIC',
    name: 'Testing Lab 4'
  },
]

async function main() {
  console.log('🔧 Production Database Update Script')
  console.log('=====================================\n')

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in environment')
    console.error('   Please set DATABASE_URL in .env file')
    console.error('   Example: DATABASE_URL="postgresql://user:pass@host/db"')
    process.exit(1)
  }

  console.log('📡 Connecting to database...')
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Neon requires SSL
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Step 1: Verify users exist
    console.log('🔍 Step 1: Checking which users exist...')
    const checkQuery = `
      SELECT email, role, "hashedPassword" IS NOT NULL as has_password
      FROM users
      WHERE email IN ($1, $2, $3, $4)
      ORDER BY email
    `
    const checkResult = await client.query(checkQuery, LAB_ADMINS.map(u => u.email))

    console.log(`   Found ${checkResult.rows.length} existing users:\n`)
    checkResult.rows.forEach((row) => {
      console.log(`   - ${row.email}: ${row.has_password ? '✅ Has password' : '❌ No password'}`)
    })

    // Step 2: Create missing users
    const existingEmails = new Set(checkResult.rows.map(r => r.email))
    const missingUsers = LAB_ADMINS.filter(u => !existingEmails.has(u.email))

    if (missingUsers.length > 0) {
      console.log(`\n🆕 Step 2: Creating ${missingUsers.length} missing users...`)

      for (const user of missingUsers) {
        const insertQuery = `
          INSERT INTO users (id, email, name, role, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, 'LAB_ADMIN', NOW(), NOW())
        `
        await client.query(insertQuery, [user.email, `${user.name} Admin`])
        console.log(`   ✅ Created: ${user.email}`)
      }
    } else {
      console.log('\n✅ Step 2: All users already exist (skip create)')
    }

    // Step 3: Update passwords
    console.log('\n🔑 Step 3: Updating passwords for all lab admins...')

    for (const user of LAB_ADMINS) {
      const updateQuery = `
        UPDATE users
        SET "hashedPassword" = $1, "updatedAt" = NOW()
        WHERE email = $2
      `
      const result = await client.query(updateQuery, [user.hashedPassword, user.email])

      if (result.rowCount === 1) {
        console.log(`   ✅ Updated: ${user.email}`)
      } else {
        console.log(`   ⚠️  Warning: ${user.email} - No rows updated (user might not exist)`)
      }
    }

    // Step 4: Verify final state
    console.log('\n✅ Step 4: Verifying final state...')
    const verifyResult = await client.query(checkQuery, LAB_ADMINS.map(u => u.email))

    console.log(`\n   Final Status (${verifyResult.rows.length} users):\n`)
    let allHavePasswords = true
    verifyResult.rows.forEach((row) => {
      const status = row.has_password ? '✅' : '❌'
      console.log(`   ${status} ${row.email}: ${row.has_password ? 'Password set' : 'NO PASSWORD'}`)
      if (!row.has_password) allHavePasswords = false
    })

    // Summary
    console.log('\n' + '='.repeat(60))
    if (allHavePasswords) {
      console.log('🎉 SUCCESS! All lab admin accounts have passwords set.')
      console.log('\nNext step:')
      console.log('1. Go to https://www.pipetgo.com/auth/signin')
      console.log('2. Test login with lab1@pgtestinglab.com')
      console.log('3. Password: (check scripts/ALL_ACCOUNT_CREDENTIALS.md)')
    } else {
      console.log('⚠️  WARNING: Some users still missing passwords')
      console.log('   Re-run this script or check database manually')
    }
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Verify DATABASE_URL points to production Neon database')
    console.error('2. Check database connection (SSL required for Neon)')
    console.error('3. Verify users table exists (run migrations first)')
    process.exit(1)
  } finally {
    await client.end()
    console.log('👋 Disconnected from database')
  }
}

main().catch(console.error)
