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
 *
 * Note: Reduced from 19 to ~16 screenshots by:
 * - Removing duplicate sign-in screenshot (#09)
 * - Removing empty/redundant screenshots when no orders exist (#11-13)
 * - Differentiating catalog screenshots by scroll position (#17-18)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.PIPETGO_URL || 'https://www.pipetgo.com';
const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/portfolio');
const VIEWPORT = { width: 1920, height: 1080 };
const ANIMATION_DELAY = 2000; // Increased for production (CDN, network delays)

// Demo accounts (from ALL_ACCOUNT_CREDENTIALS.md)
const ACCOUNTS = {
  client: { email: 'client@example.com', password: 'ClientDemo123!' },
  lab: { email: 'lab1@pgtestinglab.com', password: 'HSmgGnbBcZ!zRsGQsnDkNHnu' },
  admin: { email: 'admin@pipetgo.com', password: 'AdminDemo123!' }
};

// Helper Functions
// ================

/**
 * Programmatic NextAuth signin
 * @param {import('playwright').Page} page
 * @param {{email: string, password: string}} account
 * @param {boolean} alreadyOnSigninPage - Skip navigation if already on signin page
 */
async function signIn(page, account, alreadyOnSigninPage = false) {
  console.log(`🔐 Signing in as ${account.email}...`);

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
  await page.fill('input#email', account.email);

  // Fill password field
  await page.fill('input#password', account.password);

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
  // Wait for form to load (increased timeout for production API)
  await page.waitForSelector('textarea#sampleDescription', { timeout: 30000 });

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
  // Wait for quote form to load (increased timeout for production)
  await page.waitForSelector('input[name="quotedPrice"]', { timeout: 30000 });

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
  // CRITICAL: We need to track which lab owns this service so we can sign in as that lab later
  // Wait for services to load (increased timeout for production)
  await page.waitForSelector('button:has-text("Request Quote")', { timeout: 30000 });

  // Find and click the first "Request Quote" button (QUOTE_REQUIRED service)
  // This ensures the RFQ will be assigned to the lab that owns this service
  const quoteRequiredButton = page.locator('button:has-text("Request Quote")').first();
  console.log(`   Found quote-required service button`);

  // Store the service name for verification
  const serviceCard = page.locator('div').filter({ has: quoteRequiredButton }).first();
  const serviceName = await serviceCard.locator('h3, h2').first().textContent() || 'Unknown Service';
  console.log(`   Service: ${serviceName}`);

  await quoteRequiredButton.click();
  await page.waitForLoadState('networkidle');

  // Extract lab name from service detail page
  let labName = 'Unknown Lab';
  try {
    // Look for lab name in the service detail page
    const labElement = page.locator('text=/Lab:|Laboratory:|Provided by/i').locator('..').locator('text=/Testing Lab|Lab/');
    if (await labElement.count() > 0) {
      labName = await labElement.first().textContent() || 'Unknown Lab';
      console.log(`   Lab owner: ${labName}`);
    }
  } catch (error) {
    console.log(`   ⚠️ Could not extract lab name from service page`);
  }

  await captureScreenshot(page, '05-quote-required-service.png',
    'Quote required service detail page');

  // 6. Fill RFQ form (don't submit yet)
  await fillRfqForm(page);
  await captureScreenshot(page, '06-rfq-form.png',
    'RFQ form filled with sample data');

  // 7. Submit RFQ
  console.log('   Submitting RFQ...');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for confirmation/redirect
  await captureScreenshot(page, '07-rfq-submitted.png',
    'RFQ submission confirmation',
    'h2:has-text("Your Test Requests"), h1, h2, main');

  // 8. Return to client dashboard showing pending order
  await page.goto(`${BASE_URL}/dashboard/client`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for order to appear

  // Verify order was created
  const hasClientOrders = await page.locator('text=/Order #|QUOTE_REQUESTED|pending/i').count() > 0;
  if (hasClientOrders) {
    console.log('   ✓ Order successfully created and visible in client dashboard');
  } else {
    console.log('   ⚠️ No orders visible in client dashboard - RFQ creation may have failed');
  }

  await captureScreenshot(page, '08-client-dashboard-pending-quote.png',
    'Client dashboard showing pending RFQ (awaiting quote)');
}

/**
 * Flow 2: Lab Admin Provide Quote
 */
async function captureLabQuoteFlow(page) {
  console.log('\n🧪 FLOW 2: Lab Admin Provide Quote');
  console.log('='.repeat(60));

  // 9. Sign out client and sign in as lab admin (no duplicate screenshot needed)
  await signOut(page);
  await signIn(page, ACCOUNTS.lab, false);

  // 10. Wait for lab dashboard to load with actual orders (not just loading state)
  console.log('   ⏳ Waiting for orders to appear in lab dashboard...');
  await page.waitForLoadState('networkidle');

  // Wait for either order cards OR empty state (with increased timeout for production)
  try {
    await page.waitForSelector('text=/Order #|Request Quote|Provide Quote|No incoming requests/i', {
      timeout: 15000
    });
    console.log('   ✓ Dashboard content loaded');
  } catch (error) {
    console.log('   ⚠️ Timeout waiting for dashboard content - capturing current state');
  }

  // Additional wait for order cards to render
  await page.waitForTimeout(2000);

  await captureScreenshot(page, '09-lab-dashboard-rfqs.png',
    'Lab admin dashboard showing incoming RFQs',
    'h2:has-text("Incoming Requests"), h1, h2, main');

  // Check if orders exist
  const hasOrders = await page.locator('text=/Order #|Request Quote|Provide Quote/i').count() > 0;

  if (hasOrders) {
    console.log('   ✓ Orders found - proceeding with quote flow');

    // Try to find and click first QUOTE_REQUESTED order
    const orderCard = page.locator('.Card, [role="row"]').filter({ hasText: /QUOTE_REQUESTED|PENDING/i }).first();

    if (await orderCard.count() > 0) {
      // Look for a "View" or "Provide Quote" button
      const actionButton = orderCard.locator('button:has-text("View"), button:has-text("Details"), button:has-text("Provide Quote")');
      if (await actionButton.count() > 0) {
        await actionButton.first().click();
      } else {
        await orderCard.click();
      }
      await page.waitForLoadState('networkidle');

      await captureScreenshot(page, '10-rfq-detail.png',
        'RFQ detail page (lab admin view)');

      // Check if quote form is visible on this page
      const quoteFormExists = await page.locator('input[name="quotedPrice"]').count() > 0;

      if (quoteFormExists) {
        await fillQuoteForm(page);
        await captureScreenshot(page, '11-quote-form.png',
          'Quote form filled with pricing');

        // Submit quote
        const submitButton = page.locator('button:has-text("Submit Quote"), button:has-text("Provide Quote")');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          await captureScreenshot(page, '12-quote-submitted.png',
            'Quote submission confirmation');
        } else {
          console.log('   ⚠️ Submit quote button not found');
        }
      } else {
        console.log('   ⚠️ Quote form not found on detail page');
      }

      // Return to lab dashboard showing updated status
      await page.goto(`${BASE_URL}/dashboard/lab`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await captureScreenshot(page, '13-lab-dashboard-quote-sent.png',
        'Lab dashboard after quote provision');
    } else {
      console.log('   ⚠️ Could not find order card to click');
    }
  } else {
    console.log('   ⚠️ No orders found in lab dashboard - RFQ may not have propagated');
    console.log('   This suggests the client-submitted order is not visible to this lab admin');
  }
}

/**
 * Flow 3: Fixed Rate Service (Instant Booking)
 */
async function captureFixedRateFlow(page) {
  console.log('\n💳 FLOW 3: Fixed Rate Service (Instant Booking)');
  console.log('='.repeat(60));

  try {
    // Sign out lab admin, sign in as client
    await signOut(page);
    await signIn(page, ACCOUNTS.client);

    // 14. Navigate to service catalog and find FIXED service
    await page.goto(BASE_URL);
    await page.waitForSelector('button:has-text("Book Service")', { timeout: 30000 });

    // Find and click the first "Book Service" button (FIXED pricing)
    const bookServiceButton = page.locator('button:has-text("Book Service")').first();
    console.log(`   Found fixed-rate service button`);

    await bookServiceButton.click();
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '14-fixed-rate-service.png',
      'Fixed rate service detail (shows instant booking price)');

    // 15. Fill booking form
    await fillRfqForm(page); // Reuse form filling logic
    await captureScreenshot(page, '15-instant-booking-form.png',
      'Instant booking form with fixed price');

    // 16. Submit booking
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await captureScreenshot(page, '16-instant-booking-confirmed.png',
      'Instant booking confirmation');
  } catch (error) {
    console.log(`   ⚠️ Fixed rate services not available in production - skipping flow`);
    console.log(`   ${error.message}`);
  }
}

/**
 * Flow 4: Multi-Lab Catalog Overview
 */
async function captureMultiLabCatalog(page) {
  console.log('\n🏢 FLOW 4: Multi-Lab Catalog Overview');
  console.log('='.repeat(60));

  // 17. Full service catalog at top of page (unauthenticated is fine, or stay signed in)
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Ensure we're at the top of the page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  await captureScreenshot(page, '17-service-catalog-top.png',
    'Service catalog - top section showing first services');

  // 18. Scroll to show different services (1200px down)
  console.log('   Scrolling to show different catalog section...');
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);

  await captureScreenshot(page, '18-service-catalog-scrolled.png',
    'Service catalog - scrolled section showing different services');
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

    // Verify no duplicates by checking file sizes
    console.log('\n🔍 Checking for duplicate screenshots...');
    const fileSizes = new Map();
    let duplicatesFound = false;

    files.forEach(file => {
      const stats = fs.statSync(path.join(SCREENSHOT_DIR, file));
      const size = stats.size;

      if (fileSizes.has(size)) {
        console.log(`   ⚠️  Potential duplicate: ${file} has same size as ${fileSizes.get(size)}`);
        duplicatesFound = true;
      } else {
        fileSizes.set(size, file);
      }
    });

    if (!duplicatesFound) {
      console.log('   ✓ No duplicate screenshots detected (by file size)');
    }

    // Expected screenshot count
    const expectedCount = 18; // Updated expected count after removing duplicates
    if (files.length < expectedCount - 3) {
      console.log(`\n⚠️  Warning: Only ${files.length} screenshots captured (expected ~${expectedCount})`);
    } else {
      console.log(`\n✓ Screenshot count looks good (${files.length} captured)`);
    }

  } catch (error) {
    console.error('\n❌ Error during screenshot capture:');
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
