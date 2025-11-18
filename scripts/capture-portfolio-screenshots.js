/**
 * Portfolio Screenshot Automation with NextAuth Authentication
 *
 * Captures comprehensive user flows for portfolio documentation:
 * - Flow 1: Client RFQ workflow (quote required service)
 * - Flow 2: Lab admin provide quote
 * - Flow 3: Fixed rate service (instant booking)
 * - Flow 4: Multi-lab catalog overview
 *
 * Prerequisites: Production site at https://www.pipetgo.com
 * Usage: node scripts/capture-portfolio-screenshots.js
 *
 * Environment Variables:
 * - PIPETGO_URL: Override base URL (default: production)
 *   Example: PIPETGO_URL=http://localhost:3000 node scripts/capture-portfolio-screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.PIPETGO_URL || 'https://www.pipetgo.com';
const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/portfolio');
const VIEWPORT = { width: 1920, height: 1080 };
const ANIMATION_DELAY = 2000; // Increased for production (CDN, network delays)

// Demo accounts (from seed data)
const ACCOUNTS = {
  client: 'client@example.com',
  lab: 'lab@testinglab.com',
  admin: 'admin@pipetgo.com'
};

// Helper Functions
// ================

/**
 * Programmatic NextAuth signin
 * @param {import('playwright').Page} page
 * @param {string} email
 * @param {boolean} alreadyOnSigninPage - Skip navigation if already on signin page
 */
async function signIn(page, email, alreadyOnSigninPage = false) {
  console.log(`🔐 Signing in as ${email}...`);

  // Always navigate to signin page (ensures fresh state)
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Wait for React hydration - use a selector that only appears after React loads
  await page.waitForFunction(() => {
    const emailInput = document.querySelector('input#email');
    return emailInput !== null && emailInput.offsetParent !== null;
  }, { timeout: 15000 });

  await page.waitForTimeout(500); // Additional buffer

  // Debug: check current URL
  const currentUrl = page.url();
  console.log(`   Current URL: ${currentUrl}`);

  // Fill email field
  await page.fill('input#email', email);

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard (based on role)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ANIMATION_DELAY);

  console.log(`✅ Signed in successfully`);
}

/**
 * Sign out current user
 * @param {import('playwright').Page} page
 */
async function signOut(page) {
  console.log('🚪 Signing out...');

  // Navigate to signout API endpoint
  await page.goto(`${BASE_URL}/api/auth/signout`);
  await page.waitForLoadState('networkidle');

  // Click confirm signout button
  const signoutButton = page.locator('form button');
  if (await signoutButton.count() > 0) {
    await signoutButton.click();
    await page.waitForLoadState('networkidle');
  }

  await page.waitForTimeout(ANIMATION_DELAY);
  console.log('✅ Signed out successfully');
}

/**
 * Capture screenshot with progress logging
 * @param {import('playwright').Page} page
 * @param {string} filename
 * @param {string} description
 * @param {string|null} contentSelector - Optional selector to wait for before capturing
 */
async function captureScreenshot(page, filename, description, contentSelector = null) {
  console.log(`📸 ${filename}: ${description}`);

  // Wait for page to stabilize
  await page.waitForLoadState('networkidle');

  // If content selector provided, wait for it to be visible
  if (contentSelector) {
    try {
      console.log(`   ⏳ Waiting for content: "${contentSelector}"`);
      await page.waitForSelector(contentSelector, {
        state: 'visible',
        timeout: 10000
      });
      console.log(`   ✓ Content loaded`);
    } catch (error) {
      console.log(`   ⚠️  Content selector "${contentSelector}" not found, capturing anyway...`);
    }
  }

  await page.waitForTimeout(ANIMATION_DELAY);

  // Take full-page screenshot
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true
  });

  console.log(`   ✅ Saved`);
}

/**
 * Fill RFQ form with sample data
 * @param {import('playwright').Page} page
 */
async function fillRfqForm(page) {
  // Wait for form to load
  await page.waitForSelector('textarea#sampleDescription', { timeout: 10000 });

  // Sample description
  await page.fill('textarea#sampleDescription',
    'Food sample: Packaged instant noodles (batch #2024-11-17). Need to verify fatty acid composition meets FDA nutritional labeling requirements.');

  // Special instructions
  const specialInstructionsTextarea = page.locator('textarea#specialInstructions');
  if (await specialInstructionsTextarea.count() > 0) {
    await specialInstructionsTextarea.fill('Please expedite if possible - product launch scheduled for December 1, 2024. Certificate of analysis required for customs.');
  }

  // Contact details (email should be pre-filled from session)
  const phoneInput = page.locator('input#contactPhone');
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('+63 917 123 4567');
  }

  // Organization
  const orgInput = page.locator('input#organization');
  if (await orgInput.count() > 0) {
    await orgInput.fill('Noodle King Manufacturing Corp.');
  }

  // Shipping address
  const streetInput = page.locator('input#street');
  if (await streetInput.count() > 0) {
    await streetInput.fill('456 Industrial Avenue, Valenzuela');
  }

  const cityInput = page.locator('input#city');
  if (await cityInput.count() > 0) {
    await cityInput.fill('Metro Manila');
  }

  const postalInput = page.locator('input#postal');
  if (await postalInput.count() > 0) {
    await postalInput.fill('1440');
  }
}

/**
 * Fill quote form with lab admin pricing
 * @param {import('playwright').Page} page
 */
async function fillQuoteForm(page) {
  // Wait for quote form to load
  await page.waitForSelector('input[name="quotedPrice"]', { timeout: 5000 });

  // Enter quoted price
  await page.fill('input[name="quotedPrice"]', '8500');

  // Turnaround estimate (if field exists)
  const turnaroundInput = page.locator('input[name="estimatedTurnaround"]');
  if (await turnaroundInput.count() > 0) {
    await turnaroundInput.fill('5');
  }

  // Quote notes
  const notesTextarea = page.locator('textarea[name="quoteNotes"]');
  if (await notesTextarea.count() > 0) {
    await notesTextarea.fill('Price includes full fatty acid profile (saturated, monounsaturated, polyunsaturated, trans fats). Rush service available for +20% if needed by Nov 25.');
  }
}

// Main Screenshot Flows
// ======================

/**
 * Flow 1: Client RFQ Workflow (Quote Required Service)
 */
async function captureClientRfqFlow(page) {
  console.log('\n📋 FLOW 1: Client RFQ Workflow (Quote Required Service)');
  console.log('='.repeat(60));

  // 1. Homepage (unauthenticated)
  await page.goto(BASE_URL);
  await captureScreenshot(page, '01-homepage-unauthenticated.png',
    'Homepage showing service catalog (unauthenticated)');

  // 2. Sign in page
  await page.goto(`${BASE_URL}/auth/signin`);
  await captureScreenshot(page, '02-signin-page.png',
    'Sign in page with demo accounts');

  // 3. Sign in as client (reload page to ensure fresh state)
  await signIn(page, ACCOUNTS.client, false);
  await captureScreenshot(page, '03-client-dashboard-empty.png',
    'Client dashboard (empty - no orders yet)',
    'h2:has-text("Your Test Requests"), h1, h2, main');

  // 4. Navigate to service catalog (click Browse Services or go home)
  await page.goto(BASE_URL);
  await captureScreenshot(page, '04-service-catalog.png',
    'Service catalog (authenticated client view)');

  // 5. Click first QUOTE_REQUIRED service
  // Wait for services to load
  await page.waitForSelector('button:has-text("Request Quote")', { timeout: 10000 });

  // Find and click the first "Request Quote" button (QUOTE_REQUIRED service)
  const quoteRequiredButton = page.locator('button:has-text("Request Quote")').first();
  console.log(`   Found quote-required service button`);

  await quoteRequiredButton.click();
  await page.waitForLoadState('networkidle');
  await captureScreenshot(page, '05-quote-required-service.png',
    'Quote required service detail page');

  // 6. Fill RFQ form (don't submit yet)
  await fillRfqForm(page);
  await captureScreenshot(page, '06-rfq-form.png',
    'RFQ form filled with sample data');

  // 7. Submit RFQ
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for confirmation/redirect
  await captureScreenshot(page, '07-rfq-submitted.png',
    'RFQ submission confirmation',
    'h2:has-text("Your Test Requests"), h1, h2, main');

  // 8. Return to client dashboard showing pending order
  await page.goto(`${BASE_URL}/dashboard/client`);
  await captureScreenshot(page, '08-client-dashboard-pending-quote.png',
    'Client dashboard showing pending RFQ (awaiting quote)');
}

/**
 * Flow 2: Lab Admin Provide Quote
 */
async function captureLabQuoteFlow(page) {
  console.log('\n🧪 FLOW 2: Lab Admin Provide Quote');
  console.log('='.repeat(60));

  // 9. Sign out client
  await signOut(page);
  await page.goto(`${BASE_URL}/auth/signin`);
  await captureScreenshot(page, '09-lab-signin.png',
    'Sign in page (returning to sign in as lab admin)');

  // 10. Sign in as lab admin (reload page)
  await signIn(page, ACCOUNTS.lab, false);
  await captureScreenshot(page, '10-lab-dashboard-rfqs.png',
    'Lab admin dashboard showing incoming RFQs',
    'h2:has-text("Incoming Requests"), h1, h2, main');

  // 11. Click on first order/RFQ (if any orders exist)
  // Orders might be in cards or table rows - try multiple selectors
  const hasOrders = await page.locator('text=/Order #|Request Quote|Provide Quote/i').count() > 0;

  if (hasOrders) {
    // Try to find and click first order card or row
    const orderCard = page.locator('.Card, [role="row"]').filter({ hasText: /QUOTE_REQUESTED|PENDING/i }).first();

    if (await orderCard.count() > 0) {
      // If card is clickable, click it; otherwise look for a "View" button
      const viewButton = orderCard.locator('button:has-text("View"), button:has-text("Details")');
      if (await viewButton.count() > 0) {
        await viewButton.first().click();
      } else {
        await orderCard.click();
      }
      await page.waitForLoadState('networkidle');
    }

    await captureScreenshot(page, '11-rfq-detail.png',
      'RFQ detail page (lab admin view)');

    // 12. Fill quote form (if quote form exists on same page)
    // Check if quote form is visible
    const quoteFormExists = await page.locator('input[name="quotedPrice"]').count() > 0;

    if (quoteFormExists) {
      await fillQuoteForm(page);
      await captureScreenshot(page, '12-quote-form.png',
        'Quote form filled with pricing');

      // 13. Submit quote
      const submitButton = page.locator('button:has-text("Submit Quote"), button:has-text("Provide Quote")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await captureScreenshot(page, '13-quote-submitted.png',
          'Quote submission confirmation');
      } else {
        console.log('   ⚠️ Submit quote button not found - quote flow may differ');
        await captureScreenshot(page, '13-quote-submitted.png',
          'Current page state (quote flow incomplete)');
      }
    } else {
      console.log('   ⚠️ Quote form not found on this page');
      await captureScreenshot(page, '12-quote-form.png',
        'RFQ detail page (quote form not implemented)');
      await captureScreenshot(page, '13-quote-submitted.png',
        'RFQ detail page (quote submission not available)');
    }

    // 14. Return to lab dashboard
    await page.goto(`${BASE_URL}/dashboard/lab`);
    await captureScreenshot(page, '14-lab-dashboard-quote-sent.png',
      'Lab dashboard after quote provision');
  } else {
    console.log('   ⚠️ No orders found in lab dashboard');
    await captureScreenshot(page, '11-rfq-detail.png',
      'Lab dashboard (no orders)');
    await captureScreenshot(page, '12-quote-form.png',
      'Lab dashboard (no quote form)');
    await captureScreenshot(page, '13-quote-submitted.png',
      'Lab dashboard (no submission)');
    await captureScreenshot(page, '14-lab-dashboard-quote-sent.png',
      'Lab dashboard (unchanged)');
  }
}

/**
 * Flow 3: Fixed Rate Service (Instant Booking)
 */
async function captureFixedRateFlow(page) {
  console.log('\n💳 FLOW 3: Fixed Rate Service (Instant Booking)');
  console.log('='.repeat(60));

  // Sign out lab admin, sign in as client
  await signOut(page);
  await signIn(page, ACCOUNTS.client);

  // 15. Navigate to service catalog and find FIXED service
  await page.goto(BASE_URL);
  await page.waitForSelector('button:has-text("Book Service")', { timeout: 10000 });

  // Find and click the first "Book Service" button (FIXED pricing)
  const bookServiceButton = page.locator('button:has-text("Book Service")').first();
  console.log(`   Found fixed-rate service button`);

  await bookServiceButton.click();
  await page.waitForLoadState('networkidle');
  await captureScreenshot(page, '15-fixed-rate-service.png',
    'Fixed rate service detail (shows instant booking price)');

  // 16. Fill booking form
  await fillRfqForm(page); // Reuse form filling logic
  await captureScreenshot(page, '16-instant-booking-form.png',
    'Instant booking form with fixed price');

  // 17. Submit booking
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await captureScreenshot(page, '17-instant-booking-confirmed.png',
    'Instant booking confirmation');
}

/**
 * Flow 4: Multi-Lab Catalog Overview
 */
async function captureMultiLabCatalog(page) {
  console.log('\n🏢 FLOW 4: Multi-Lab Catalog Overview');
  console.log('='.repeat(60));

  // 18. Full service catalog (unauthenticated is fine, or stay signed in)
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Scroll to show more services
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);

  await captureScreenshot(page, '18-service-catalog-all-labs.png',
    'Full catalog showing services from multiple labs');

  // 19. Highlight categories (scroll to show variety)
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(500);

  await captureScreenshot(page, '19-service-categories.png',
    'Diverse service categories across labs');
}

// Main Execution
// ==============

(async () => {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('🎬 Portfolio Screenshot Capture Starting...');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshot Directory: ${SCREENSHOT_DIR}`);
  console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log('');

  // Launch browser
  const browser = await chromium.launch({
    headless: true, // Set to false for debugging
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
  });

  const page = await context.newPage();

  // Log console messages for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`   [Browser Console Error]: ${msg.text()}`);
    }
  });

  // Log page errors
  page.on('pageerror', err => {
    console.log(`   [Page Error]: ${err.message}`);
  });

  try {
    // Execute all flows
    await captureClientRfqFlow(page);
    await captureLabQuoteFlow(page);
    await captureFixedRateFlow(page);
    await captureMultiLabCatalog(page);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Screenshots Captured Successfully!');
    console.log(`📁 Location: ${SCREENSHOT_DIR}`);
    console.log('='.repeat(60));

    // List captured files
    const files = fs.readdirSync(SCREENSHOT_DIR)
      .filter(f => f.endsWith('.png'))
      .sort();

    console.log(`\n📋 Captured ${files.length} screenshots:`);
    files.forEach(file => {
      const stats = fs.statSync(path.join(SCREENSHOT_DIR, file));
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ✓ ${file} (${sizeMB} MB)`);
    });

  } catch (error) {
    console.error('\n❌ Error during screenshot capture:');
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
