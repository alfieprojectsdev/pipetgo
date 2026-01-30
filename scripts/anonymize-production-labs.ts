#!/usr/bin/env tsx
/**
 * Production Database Lab Anonymization Script
 *
 * Purpose: Replace real laboratory names and contact info with generic placeholders
 * in production database to avoid legal issues with unauthorized use of company data.
 *
 * Context: CEO feedback - "Nkalagay pa din yun names Ng mga laboratory sa landing page"
 * Request: Anonymize all real company identifiers to prevent legal matters.
 *
 * Usage:
 *   npx tsx scripts/anonymize-production-labs.ts           # Dry-run (shows changes)
 *   npx tsx scripts/anonymize-production-labs.ts --execute # Apply changes
 *
 * Safety:
 *   - Dry-run mode by default (no changes made)
 *   - Shows preview of all changes before execution
 *   - Requires --execute flag for live updates
 *   - Verifies changes after execution
 *   - Preserves all service data, orders, and relationships
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AnonymizationMapping {
  oldEmail: string
  newEmail: string
  oldName: string
  newName: string
  oldUserName: string
  newUserName: string
  oldAddress: string
  newAddress: string
  oldCoords: { lat: number; lng: number }
  newCoords: { lat: number; lng: number }
  removeCertifications?: string[]
}

// Anonymization mappings from seed.ts changes (commit e893fb8)
const ANONYMIZATION_MAP: AnonymizationMapping[] = [
  {
    oldEmail: 'lab2@chempro.com',
    newEmail: 'lab2@pgtestlab.com',
    oldName: 'Chempro Analytical Services Laboratories, Inc.',
    newName: 'Testing Lab 2',
    oldUserName: 'Chempro Analytical',
    newUserName: 'Testing Lab 2 Admin',
    oldAddress: '2F-3F P1 Bldg. No. 131-135 Shaw Blvd., Brgy. Oranbo',
    newAddress: '200 Testing Street, Brgy. Sample',
    oldCoords: { lat: 14.5764, lng: 121.0851 },
    newCoords: { lat: 14.5995, lng: 120.9842 }
  },
  {
    oldEmail: 'lab3@eurofins.com',
    newEmail: 'lab3@pgtstlab.com',
    oldName: 'Eurofins Analytical and Assurance Services Philippines, Inc.',
    newName: 'Testing Lab 3',
    oldUserName: 'Eurofins Philippines',
    newUserName: 'Testing Lab 3 Admin',
    oldAddress: '8th Floor Azure Business Center, 1197 EDSA Brgy. Katipunan',
    newAddress: '300 Laboratory Avenue, Brgy. Demo',
    oldCoords: { lat: 14.6760, lng: 121.0437 },
    newCoords: { lat: 14.6042, lng: 120.9822 },
    removeCertifications: ['Eurofins Global Network']
  },
  {
    oldEmail: 'lab4@intertek.com',
    newEmail: 'lab4@testlabpg.com',
    oldName: 'Analytical Assessment Division - Makati Laboratory Intertek Testing Services Philippines, Inc.',
    newName: 'Testing Lab 4',
    oldUserName: 'Intertek Makati',
    newUserName: 'Testing Lab 4 Admin',
    oldAddress: '2307 Chino Roces Avenue Extension',
    newAddress: '400 Analysis Road, Brgy. Test',
    oldCoords: { lat: 14.5547, lng: 121.0244 },
    newCoords: { lat: 14.5888, lng: 120.9903 },
    removeCertifications: ['Intertek Global Network']
  }
]

async function checkCurrentState() {
  console.log('🔍 Checking current production database state...\n')

  const findings: Array<{
    mapping: AnonymizationMapping
    user: any
    lab: any
    needsUpdate: boolean
  }> = []

  for (const mapping of ANONYMIZATION_MAP) {
    // Check if user exists with old email
    const user = await prisma.user.findUnique({
      where: { email: mapping.oldEmail },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      // Check if already updated to new email
      const newUser = await prisma.user.findUnique({
        where: { email: mapping.newEmail },
        select: { id: true, email: true, name: true }
      })

      if (newUser) {
        console.log(`   ✅ ${mapping.newEmail} - Already anonymized`)
        findings.push({
          mapping,
          user: newUser,
          lab: null,
          needsUpdate: false
        })
        continue
      } else {
        console.log(`   ⚠️  ${mapping.oldEmail} - Not found (skipping)`)
        continue
      }
    }

    // User found with old email - get associated lab
    const lab = await prisma.lab.findFirst({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        location: true,
        certifications: true,
        _count: {
          select: {
            services: true,
            orders: true
          }
        }
      }
    })

    if (lab) {
      const hasRealName = lab.name.includes('Chempro') ||
                         lab.name.includes('Eurofins') ||
                         lab.name.includes('Intertek')

      console.log(`   ${hasRealName ? '❌' : '✅'} ${user.email} → ${lab.name}`)
      console.log(`      Services: ${lab._count.services}, Orders: ${lab._count.orders}`)

      findings.push({
        mapping,
        user,
        lab,
        needsUpdate: hasRealName
      })
    } else {
      console.log(`   ⚠️  ${user.email} - Lab not found`)
    }
  }

  console.log('')
  return findings
}

async function previewChanges(findings: Awaited<ReturnType<typeof checkCurrentState>>) {
  const needsUpdate = findings.filter(f => f.needsUpdate)

  if (needsUpdate.length === 0) {
    console.log('✅ All labs already anonymized - no changes needed!\n')
    return false
  }

  console.log('📋 PREVIEW: The following changes will be applied:\n')

  for (const { mapping, user, lab } of needsUpdate) {
    console.log(`🔄 ${mapping.oldName.substring(0, 50)}...`)
    console.log(`   User Email:     ${mapping.oldEmail} → ${mapping.newEmail}`)
    console.log(`   User Name:      ${mapping.oldUserName} → ${mapping.newUserName}`)
    console.log(`   Lab Name:       ${lab.name} → ${mapping.newName}`)
    console.log(`   Address:        ${mapping.oldAddress.substring(0, 40)}...`)
    console.log(`                   → ${mapping.newAddress}`)
    console.log(`   Coordinates:    (${mapping.oldCoords.lat}, ${mapping.oldCoords.lng})`)
    console.log(`                   → (${mapping.newCoords.lat}, ${mapping.newCoords.lng})`)

    if (mapping.removeCertifications && mapping.removeCertifications.length > 0) {
      console.log(`   Remove Certs:   ${mapping.removeCertifications.join(', ')}`)
    }

    console.log(`   Impact:         ${lab._count.services} services, ${lab._count.orders} orders preserved`)
    console.log('')
  }

  console.log(`Total labs to anonymize: ${needsUpdate.length}\n`)
  return true
}

async function executeAnonymization(findings: Awaited<ReturnType<typeof checkCurrentState>>) {
  const needsUpdate = findings.filter(f => f.needsUpdate)
  let updatedCount = 0

  console.log('🔄 Executing anonymization...\n')

  for (const { mapping, user, lab } of needsUpdate) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Update user email and name
        await tx.user.update({
          where: { id: user.id },
          data: {
            email: mapping.newEmail,
            name: mapping.newUserName,
            updatedAt: new Date()
          }
        })

        // 2. Update lab name and location
        const updatedCertifications = mapping.removeCertifications
          ? lab.certifications.filter((cert: string) =>
              !mapping.removeCertifications!.includes(cert)
            )
          : lab.certifications

        await tx.lab.update({
          where: { id: lab.id },
          data: {
            name: mapping.newName,
            location: {
              ...lab.location,
              address: mapping.newAddress,
              coordinates: mapping.newCoords
            },
            certifications: updatedCertifications,
            updatedAt: new Date()
          }
        })
      })

      console.log(`   ✅ ${mapping.newEmail} - Anonymized successfully`)
      updatedCount++
    } catch (error) {
      console.error(`   ❌ ${mapping.oldEmail} - Failed:`, error)
      throw error // Abort on any failure
    }
  }

  console.log(`\n✅ Anonymized ${updatedCount} labs successfully\n`)
}

async function verifyChanges() {
  console.log('🔍 Verifying anonymization...\n')

  let allClean = true

  for (const mapping of ANONYMIZATION_MAP) {
    // Check old email doesn't exist
    const oldUser = await prisma.user.findUnique({
      where: { email: mapping.oldEmail }
    })

    if (oldUser) {
      console.log(`   ❌ ${mapping.oldEmail} - Still exists!`)
      allClean = false
      continue
    }

    // Check new email exists with correct data
    const newUser = await prisma.user.findUnique({
      where: { email: mapping.newEmail },
      include: {
        labs: {
          select: {
            name: true,
            location: true,
            certifications: true
          }
        }
      }
    })

    if (!newUser) {
      console.log(`   ❌ ${mapping.newEmail} - Not found!`)
      allClean = false
      continue
    }

    if (newUser.name !== mapping.newUserName) {
      console.log(`   ⚠️  ${mapping.newEmail} - User name mismatch`)
      allClean = false
    }

    const lab = newUser.labs[0]
    if (lab) {
      const hasRealName = lab.name.includes('Chempro') ||
                         lab.name.includes('Eurofins') ||
                         lab.name.includes('Intertek')

      if (hasRealName) {
        console.log(`   ❌ ${mapping.newEmail} - Lab still has real name: ${lab.name}`)
        allClean = false
      } else {
        console.log(`   ✅ ${mapping.newEmail} - Clean (${lab.name})`)
      }
    }
  }

  console.log('')
  if (allClean) {
    console.log('✅ ALL VERIFICATION CHECKS PASSED\n')
  } else {
    console.log('❌ VERIFICATION FAILED - Manual review required\n')
  }

  return allClean
}

async function main() {
  const dryRun = !process.argv.includes('--execute')

  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║   Production Database Lab Anonymization Script            ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made')
    console.log('   Run with --execute flag to apply changes\n')
  } else {
    console.log('🚨 EXECUTE MODE - Changes will be applied to production database!\n')
  }

  // Step 1: Check current state
  const findings = await checkCurrentState()

  // Step 2: Preview changes
  const hasChanges = await previewChanges(findings)

  if (!hasChanges) {
    await prisma.$disconnect()
    return
  }

  // Step 3: Execute or show instructions
  if (dryRun) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('To apply these changes to production, run:')
    console.log('')
    console.log('  npx tsx scripts/anonymize-production-labs.ts --execute')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } else {
    // Execute anonymization
    await executeAnonymization(findings)

    // Verify changes
    const verified = await verifyChanges()

    if (verified) {
      console.log('╔═══════════════════════════════════════════════════════════╗')
      console.log('║   ✅ ANONYMIZATION COMPLETE                               ║')
      console.log('║                                                           ║')
      console.log('║   All real company identifiers removed from database     ║')
      console.log('║   Landing page will now show generic lab names           ║')
      console.log('║   Services and orders preserved intact                   ║')
      console.log('╚═══════════════════════════════════════════════════════════╝\n')
    } else {
      console.log('╔═══════════════════════════════════════════════════════════╗')
      console.log('║   ⚠️  ANONYMIZATION COMPLETED WITH WARNINGS               ║')
      console.log('║                                                           ║')
      console.log('║   Manual review recommended - check logs above           ║')
      console.log('╚═══════════════════════════════════════════════════════════╝\n')
    }
  }

  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
