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

  // 1. Service Catalog
  console.log('1/5: Service catalog...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(screenshotDir, '01-service-catalog-all-modes.png'),
    fullPage: true
  });

  // 2. Quote Required service
  console.log('2/5: Quote-required order page...');
  const quoteRequiredButton = await page.locator('button:has-text("Request Quote")').first();
  await quoteRequiredButton.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(screenshotDir, '02-order-quote-required.png'),
    fullPage: true
  });

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 3. Fixed Price service
  console.log('3/5: Fixed-price order page...');
  const fixedPriceButton = await page.locator('button:has-text("Book Service")').first();
  await fixedPriceButton.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(screenshotDir, '03-order-fixed-price.png'),
    fullPage: true
  });

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 4. Hybrid service (unchecked)
  console.log('4/5: Hybrid order page (unchecked)...');
  // Find card containing "Flexible Pricing" badge, then click its button
  const hybridCard = await page.locator('div.h-full:has-text("Flexible Pricing")').first();
  const hybridButton = hybridCard.locator('button');
  await hybridButton.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(screenshotDir, '04-order-hybrid-unchecked.png'),
    fullPage: true
  });

  // 5. Hybrid service (checked)
  console.log('5/5: Hybrid order page (checked)...');
  const checkbox = await page.locator('#requestCustomQuote');
  await checkbox.click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotDir, '05-order-hybrid-checked.png'),
    fullPage: true
  });

  await browser.close();
  console.log('\n✅ All screenshots captured successfully!');
  console.log(`📁 Saved to: ${screenshotDir}`);
})();
