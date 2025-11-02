const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, '../docs/screenshots/phase4-session1');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('📸 Capturing screenshots for Phase 4 Session 1...\n');

  // Service Catalog - the primary deliverable showing all pricing mode badges
  console.log('1/1: Service catalog with all pricing modes...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Take full-page screenshot
  await page.screenshot({
    path: path.join(screenshotDir, '01-service-catalog-all-modes.png'),
    fullPage: true
  });

  await browser.close();
  console.log('\n✅ Screenshot captured successfully!');
  console.log(`📁 Saved to: ${screenshotDir}`);
  console.log('\nNote: Order page screenshots require authentication.');
  console.log('Service catalog demonstrates pricing mode badges (Quote Required, Fixed Rate, Flexible Pricing).');
})();
