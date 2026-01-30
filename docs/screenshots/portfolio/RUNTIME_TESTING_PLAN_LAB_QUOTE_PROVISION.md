# Runtime Testing Plan: Lab Quote Provision Flow
**Goal:** Increase confidence from 90% → 98-100% before implementing fixes  
**Method:** Systematic runtime testing on production with evidence collection  
**Timeline:** 30-45 minutes of focused testing

---

## Why Runtime Testing is Critical

**Current State:**
- **90% confidence** based on static code analysis only
- Assumptions about browser rendering, timing, user behavior
- No validation of UX friction points with real measurements

**Risks of Skipping Testing:**
- ❌ Implement "fixes" that don't address actual user pain
- ❌ Miss critical edge cases that only appear at runtime
- ❌ Introduce regressions in working functionality
- ❌ Waste dev time on low-impact changes

**Benefits of Testing First:**
- ✅ Validate all 5 friction points are real (not theoretical)
- ✅ Measure actual page refresh delay (is it really 30 seconds?)
- ✅ Discover edge cases missed in code review
- ✅ Prioritize fixes by actual impact, not assumptions
- ✅ Build evidence base for CEO presentation

---

## Testing Checklist

### Phase 1: Happy Path Validation (15 min)

**Test:** Lab admin provides quote successfully

**Steps:**
1. Navigate to https://www.pipetgo.com/auth/signin
2. Sign in as `lab1@pgtestinglab.com` / `HSmgGnbBcZ!zRsGQsnDkNHnu`
3. Verify dashboard loads with orders visible
4. Click "Provide Quote" on first QUOTE_REQUESTED order
5. Fill quote form:
   - Quoted Price: `8500`
   - Estimated Turnaround: `5`
   - Quote Notes: `Standard analysis, rush available for +20%`
6. Click "Submit Quote"
7. Verify success toast appears
8. Verify redirect to dashboard
9. Verify order status changed to QUOTE_PROVIDED

**Measurements to Capture:**
- ⏱️ Time from "Provide Quote" click → Quote form visible: ___ seconds
- ⏱️ Page refresh visual flash: Yes/No
- ⏱️ Time from "Submit" → Success toast: ___ seconds
- ⏱️ Total time dashboard → quote submitted → back to dashboard: ___ seconds

**Evidence to Collect:**
- Screenshot of dashboard before quote
- Screenshot of quote form filled
- Screenshot of success confirmation
- Screenshot of dashboard after quote (status changed)

**Success Criteria:**
- [ ] Quote submitted successfully (status changes)
- [ ] No JavaScript errors in console
- [ ] Form validation works (try submitting empty form)
- [ ] Success feedback visible before redirect

---

### Phase 2: UX Friction Validation (10 min)

**Friction Point 1: Page Refresh on Navigation**

**Test:** Measure jarring effect of page reload
1. Open browser DevTools → Network tab
2. Click "Provide Quote" button
3. Observe: Full page reload or client-side navigation?
4. Measure: Document download size and time
5. Visual: White flash or smooth transition?

**Expected Finding:** Full page reload with visible flash  
**Actual Finding:** _______________________

---

**Friction Point 2: Status Color Differentiation**

**Test:** Can user quickly scan 6 orders to find QUOTE_REQUESTED?
1. Time yourself: How long to identify all QUOTE_REQUESTED orders?
2. Observe: Do QUOTE_REQUESTED and PENDING look identical?
3. Check: Actual color values used

**Expected Finding:** Yellow for both, identical appearance  
**Actual Finding:** _______________________  
**Scan Time:** ___ seconds to identify actionable orders

---

**Friction Point 3: No Order Filtering**

**Test:** Dashboard with 6 orders - is scanning tedious?
1. Count: How many orders visible?
2. Observe: Any filter/search UI elements?
3. Simulate: If there were 20 orders, would this be usable?

**Expected Finding:** All orders shown, no filtering  
**Actual Finding:** _______________________

---

**Friction Point 4: "Provide Quote" Button Priority**

**Test:** Is button visually emphasized as critical action?
1. Compare: "Provide Quote" vs "Acknowledge Order" button styles
2. Measure: Button size, color, position
3. Observe: Does it stand out as THE money action?

**Expected Finding:** Same visual weight as other buttons  
**Actual Finding:** _______________________

---

**Friction Point 5: Turnaround Days Input**

**Test:** Free text input allows any value?
1. Try entering: `999` days
2. Try entering: `-5` days
3. Try entering: `abc` (non-numeric)
4. Observe: Validation behavior

**Expected Finding:** Accepts any positive integer  
**Actual Finding:** _______________________

---

### Phase 3: Edge Cases & Error Scenarios (10 min)

**Test 1: Duplicate Quote Submission**
- Submit quote for same order twice
- **Expected:** Second submission blocked with error
- **Actual:** _______________________

**Test 2: Network Timeout**
- Open DevTools → Network → Throttle to "Slow 3G"
- Submit quote
- **Expected:** Loading state visible, timeout handling
- **Actual:** _______________________

**Test 3: Invalid Price Input**
- Try: Negative price `-100`
- Try: Zero price `0`
- Try: Absurdly high price `999999999`
- **Expected:** Validation errors specific and helpful
- **Actual:** _______________________

**Test 4: Form Abandonment**
- Fill quote form halfway
- Navigate away (click browser back)
- Return to same order
- **Expected:** Form cleared (no draft save)
- **Actual:** _______________________

**Test 5: Browser Autofill**
- Clear form
- Check if browser suggests autofill for price/turnaround
- **Expected:** May not work (uses `id` not `name` attributes)
- **Actual:** _______________________

**Test 6: Keyboard Navigation**
- Use only Tab key to navigate quote form
- **Expected:** Can reach all fields and submit button
- **Actual:** _______________________

**Test 7: Mobile Device**
- Open on actual phone (or dev tools mobile emulation)
- **Expected:** Touch targets ≥44px, responsive layout
- **Actual:** _______________________

---

### Phase 4: Cross-Browser Testing (5 min)

**Test on:**
- [ ] Chrome (primary)
- [ ] Safari (iOS users)
- [ ] Firefox
- [ ] Edge

**Check for:**
- Layout differences
- Button rendering
- Form validation display
- Date/number input behavior

---

### Phase 5: Performance Profiling (5 min)

**Measure with Browser DevTools:**

**Page Load Metrics:**
- Time to Interactive (TTI): ___ ms
- Largest Contentful Paint (LCP): ___ ms
- First Input Delay (FID): ___ ms

**Navigation Timing:**
- Dashboard → Quote form: ___ ms
- Quote submit → Dashboard: ___ ms

**Bundle Size:**
- JavaScript loaded: ___ KB
- CSS loaded: ___ KB
- Total transfer: ___ KB

---

## Evidence Collection Format

For each test, document:

```markdown
### Test: [Name]
**Date:** 2025-12-05  
**Browser:** Chrome 120  
**Device:** Desktop  

**Steps Performed:**
1. [Action]
2. [Action]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Evidence:**
- Screenshot: [filename]
- Console errors: [yes/no]
- Network timing: [X ms]

**Conclusion:**
[Pass/Fail, notes]
```

---

## Success Criteria for 98-100% Confidence

### Must Validate (Critical):
- [ ] Quote submission works end-to-end (happy path)
- [ ] All 5 friction points confirmed real (not theoretical)
- [ ] Measured timings support "30 seconds longer" claim
- [ ] No blocking bugs discovered
- [ ] Edge cases handled gracefully

### Should Validate (Important):
- [ ] Cross-browser compatibility verified
- [ ] Mobile usability confirmed
- [ ] Performance baseline established
- [ ] Keyboard navigation works
- [ ] Error messages helpful

### Nice to Validate (Recommended):
- [ ] Actual lab admin feedback (1-2 users)
- [ ] Comparison with competitor workflows
- [ ] Accessibility tool scan (axe DevTools)

---

## Updated Confidence Levels

| Testing Depth | Confidence | Timeline |
|---------------|-----------|----------|
| Static code analysis only | 90% | Complete ✓ |
| + Happy path runtime test | 95% | 15 min |
| + UX friction validation | 97% | +10 min |
| + Edge case testing | 98% | +10 min |
| + Cross-browser testing | 99% | +5 min |
| + Real user validation | 100% | +30 min |

**Recommended Target:** 98% (45 min total testing time)

**To reach 100%:** Add 1-2 lab admin user tests

---

## Decision Framework

### If Testing Confirms All Findings → Proceed with Fixes
**Action:** Implement Priority 1-4 fixes (<30 min)  
**Confidence:** Can claim findings are validated  
**CEO Presentation:** Strong evidence base

### If Testing Reveals Different Issues → Revise Plan
**Action:** Update recommendations based on actual findings  
**Confidence:** Higher than 90% but findings changed  
**CEO Presentation:** "We tested and found X instead of Y"

### If Testing Shows No Friction → Reconsider Fixes
**Action:** Focus only on proven issues  
**Confidence:** 100% that current state is adequate  
**CEO Presentation:** "Market maker feature validated, no changes needed"

---

## Recommended Next Steps

### Option A: Full Testing (Recommended)
1. **Today:** Execute Phase 1-5 testing (45 min)
2. **Document:** Create evidence-based findings report
3. **Tomorrow:** Update recommendations with validated priorities
4. **Then:** Implement only proven fixes

**Outcome:** 98% confidence, evidence-based decisions

### Option B: Minimal Testing (Faster)
1. **Today:** Execute Phase 1-2 only (25 min)
2. **Document:** Happy path + major friction points
3. **Tomorrow:** Implement fixes with caveat "needs further validation"

**Outcome:** 95% confidence, faster iteration

### Option C: Skip Testing (Not Recommended)
1. **Today:** Implement fixes based on 90% confidence
2. **Risk:** May fix non-issues or miss real problems

**Outcome:** Unknown confidence, higher risk

---

## CEO Communication Strategy

### Before Testing:
> "Our code analysis found 5 friction points in the 'market maker' feature. Before implementing fixes, we're running 45 minutes of runtime testing to validate findings and measure actual impact. This ensures we invest dev time on high-ROI improvements."

### After Testing (Findings Confirmed):
> "Runtime testing validated all 5 friction points. Page refresh adds 2.3 seconds per quote (measured), status scanning takes 12 seconds for 6 orders (timed). We have evidence-based priorities and can implement fixes with 98% confidence."

### After Testing (Findings Changed):
> "Runtime testing revealed different priorities than code analysis. While page refresh is noticeable, users actually struggle with [new finding]. We've updated recommendations based on real-world usage."

---

## Testing Artifacts to Preserve

Save all evidence for:
1. CEO presentation deck
2. Developer handoff documentation  
3. Before/after comparison (after fixes)
4. User research archive

**Folder structure:**
```
docs/testing/lab-quote-provision-2025-12-05/
├── screenshots/
│   ├── 01-dashboard-before-quote.png
│   ├── 02-quote-form-filled.png
│   ├── 03-success-confirmation.png
│   └── 04-dashboard-after-quote.png
├── console-logs/
│   ├── network-timing.txt
│   └── javascript-errors.txt
├── measurements/
│   ├── page-load-metrics.csv
│   └── user-flow-timing.md
└── evidence-report.md
```

---

**Prepared by:** Investigation Team  
**Purpose:** Increase confidence 90% → 98-100%  
**Time Investment:** 45 minutes  
**Value:** Evidence-based decision making, reduced implementation risk
