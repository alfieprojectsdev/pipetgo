import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  account: string
  role: string
  loginSuccess: boolean
  dashboardLoaded: boolean
  screenshot: string
  errors: string[]
  verifications: string[]
}

const PROD_URL = 'https://www.pipetgo.com'
const SCREENSHOT_DIR = 'test-results/login-tests'

async function setupScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
}

async function testLogin(
  browser: Browser,
  email: string,
  password: string,
  role: string,
  expectedDashboard: string
): Promise<TestResult> {
  const result: TestResult = {
    account: email,
    role,
    loginSuccess: false,
    dashboardLoaded: false,
    screenshot: '',
    errors: [],
    verifications: []
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to login page
    console.log(`\n📝 Testing ${role}: ${email}`)
    await page.goto(`${PROD_URL}/auth/signin`, { waitUntil: 'networkidle' })

    // Take screenshot of login page
    const loginScreenshot = path.join(SCREENSHOT_DIR, `${role.toLowerCase()}-01-login-page.png`)
    await page.screenshot({ path: loginScreenshot, fullPage: true })
    result.verifications.push('✅ Login page loaded')

    // Fill in credentials
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)

    // Take screenshot before submit
    const beforeSubmit = path.join(SCREENSHOT_DIR, `${role.toLowerCase()}-02-credentials-filled.png`)
    await page.screenshot({ path: beforeSubmit, fullPage: true })

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation
    await page.waitForURL(`${PROD_URL}${expectedDashboard}*`, { timeout: 10000 })

    result.loginSuccess = true
    result.verifications.push('✅ Login successful')
    result.verifications.push(`✅ Redirected to ${expectedDashboard}`)

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    result.dashboardLoaded = true

    // Take screenshot of dashboard
    const dashboardScreenshot = path.join(SCREENSHOT_DIR, `${role.toLowerCase()}-03-dashboard.png`)
    await page.screenshot({ path: dashboardScreenshot, fullPage: true })
    result.screenshot = dashboardScreenshot
    result.verifications.push('✅ Dashboard loaded')

    // Role-specific verifications
    if (role === 'CLIENT') {
      // Verify "Browse Services" button exists
      const browseButton = await page.locator('button:has-text("Browse Services")').count()
      if (browseButton > 0) {
        result.verifications.push('✅ "Browse Services" button found')

        // Click browse services
        await page.click('button:has-text("Browse Services")')
        await page.waitForURL(`${PROD_URL}/`, { timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify service catalog loaded
        const services = await page.locator('[data-testid="service-card"], .service-card, h2:has-text("Available Services"), h2:has-text("Lab Services")').count()
        if (services > 0) {
          result.verifications.push('✅ Service catalog loaded (navigation fix verified)')
        } else {
          result.errors.push('❌ Service catalog not found after navigation')
        }

        // Take screenshot of service catalog
        const catalogScreenshot = path.join(SCREENSHOT_DIR, `${role.toLowerCase()}-04-service-catalog.png`)
        await page.screenshot({ path: catalogScreenshot, fullPage: true })
      } else {
        result.errors.push('❌ "Browse Services" button not found')
      }
    }

    if (role === 'LAB_ADMIN') {
      // Navigate to services page
      await page.goto(`${PROD_URL}/dashboard/lab/services`, { waitUntil: 'networkidle' })

      // Take screenshot of services page
      const servicesScreenshot = path.join(SCREENSHOT_DIR, `${role.toLowerCase()}-04-services-page.png`)
      await page.screenshot({ path: servicesScreenshot, fullPage: true })
      result.verifications.push('✅ Services page loaded')

      // Try to find and click edit button
      const editButtons = await page.locator('button:has-text("Edit")').count()
      if (editButtons > 0) {
        result.verifications.push(`✅ Found ${editButtons} Edit buttons`)

        // Click first edit button
        await page.locator('button:has-text("Edit")').first().click()
        await page.waitForTimeout(1000) // Wait for modal

        // Check if modal opened
        const modal = await page.locator('[role="dialog"], .modal, [data-testid="edit-modal"]').count()
        if (modal > 0) {
          result.verifications.push('✅ Edit service modal opened (duplicate cleanup verified)')

          // Take screenshot of modal
          const modalScreenshot = path.join(SCREENSHOT_DIR, `${role.toLowerCase()}-05-edit-modal.png`)
          await page.screenshot({ path: modalScreenshot, fullPage: true })
        } else {
          result.errors.push('❌ Edit service modal did not open')
        }
      } else {
        result.errors.push('❌ No Edit buttons found')
      }
    }

  } catch (error) {
    result.loginSuccess = false
    result.errors.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    await context.close()
  }

  return result
}

async function main() {
  console.log('='.repeat(60))
  console.log('PRODUCTION LOGIN TESTING SUITE')
  console.log('='.repeat(60))
  console.log(`Target: ${PROD_URL}`)
  console.log()

  await setupScreenshotDir()

  const browser = await chromium.launch({ headless: true })
  const results: TestResult[] = []

  try {
    // Test ADMIN login
    results.push(await testLogin(
      browser,
      'admin@pipetgo.com',
      'AdminDemo123!',
      'ADMIN',
      '/dashboard/admin'
    ))

    // Test CLIENT login
    results.push(await testLogin(
      browser,
      'client@example.com',
      'ClientDemo123!',
      'CLIENT',
      '/dashboard/client'
    ))

    // Test LAB_ADMIN login
    results.push(await testLogin(
      browser,
      'lab4@testlabpg.com',
      'rY!hXsCWvUHbf8e65QwveYPG',
      'LAB_ADMIN',
      '/dashboard/lab'
    ))

  } finally {
    await browser.close()
  }

  // Generate report
  console.log()
  console.log('='.repeat(60))
  console.log('TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  console.log()

  let allPassed = true

  for (const result of results) {
    console.log(`${result.role} (${result.account}):`)
    console.log(`  Login: ${result.loginSuccess ? '✅ Success' : '❌ Failed'}`)
    console.log(`  Dashboard: ${result.dashboardLoaded ? '✅ Loaded' : '❌ Not loaded'}`)

    if (result.verifications.length > 0) {
      console.log(`  Verifications:`)
      result.verifications.forEach(v => console.log(`    ${v}`))
    }

    if (result.errors.length > 0) {
      console.log(`  Errors:`)
      result.errors.forEach(e => console.log(`    ${e}`))
      allPassed = false
    }

    console.log()
  }

  console.log('='.repeat(60))
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`)
  console.log('='.repeat(60))
  console.log()

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED')
    console.log()
    console.log('Bug Fixes Verified:')
    console.log('  ✅ ADMIN and CLIENT can log in (password fix)')
    console.log('  ✅ Browse Services navigation works (homepage fix)')
    console.log('  ✅ Edit Service modal opens (duplicate cleanup fix)')
  } else {
    console.log('❌ SOME TESTS FAILED')
    process.exit(1)
  }
}

main()
