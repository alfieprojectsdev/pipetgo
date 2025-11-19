# PipetGo User Testing Guide
## For CEO's Friends - November 2025

**Testing URL**: https://pipetgo-git-claude-testing-nov25-011cut9uf3dhjrqck8rf54s4.vercel.app
*(Vercel preview deployment from testing branch)*

---

## 🎯 What We're Testing

PipetGo is a B2B marketplace connecting businesses with ISO 17025 accredited laboratory testing services. Think "Alibaba RFQ system for lab testing" - **not** instant checkout e-commerce.

**Key Flow**: Client submits RFQ → Lab provides custom quote → Client approves quote → Testing begins

---

## 👥 Test Accounts

### Client Account (Request Quotes)
- **Email**: `client@example.com`
- **Password**: *(any password works in testing mode)*

### Lab Admin Account (Provide Quotes)
- **Email**: `lab@example.com`
- **Password**: *(any password works in testing mode)*

### Platform Admin Account (Overview)
- **Email**: `admin@example.com`
- **Password**: *(any password works in testing mode)*

---

## ✅ Testing Scenarios

### Scenario 1: Client Submits RFQ (Request for Quote)
**Role**: Client

1. **Browse Services** (Homepage)
   - Visit homepage
   - See list of lab services with categories (Chemical Analysis, Microbiological Testing, etc.)
   - Notice pagination (12 services per page)
   - **WHAT TO CHECK**: Are services clearly described? Do you understand what each test does?

2. **Submit RFQ**
   - Click "Request Quote" on any service
   - Fill out form:
     - Contact details (name, email, phone)
     - Sample description (what you want tested)
     - Special instructions (optional)
   - Click "Submit Request"
   - **WHAT TO CHECK**: Is the form easy to understand? Any confusing fields?

3. **Track RFQ in Dashboard**
   - Go to "Client Dashboard" (sign in if needed)
   - See your submitted RFQ with status "Awaiting Quote" (yellow badge)
   - **WHAT TO CHECK**: Can you find your order easily? Is the status clear?

### Scenario 2: Lab Admin Provides Quote
**Role**: Lab Admin

1. **View Incoming RFQs**
   - Sign in as lab admin
   - Go to "Lab Dashboard"
   - See list of orders with "Quote Requested" status
   - **WHAT TO CHECK**: Can you see client requirements clearly?

2. **Provide Custom Quote**
   - Click "Provide Quote" button on any "Quote Requested" order
   - Fill out quote form:
     - Quoted Price (₱ PHP)
     - Estimated Turnaround (days)
     - Notes to client (optional - explain pricing)
   - Click "Submit Quote"
   - **WHAT TO CHECK**: Is quote form straightforward? Any missing information you'd want to provide?

3. **Verify Quote Sent**
   - Return to lab dashboard
   - See order status changed to "Quote Provided" (green badge)
   - **WHAT TO CHECK**: Clear confirmation that quote was sent?

### Scenario 3: Client Reviews & Approves Quote
**Role**: Client

1. **View Quote**
   - Go to client dashboard
   - See order with "Quote Ready for Review" badge (green)
   - Expand order details
   - See quoted price, turnaround estimate, lab notes
   - **WHAT TO CHECK**: Is quote information clear? Do you understand what you're paying for?

2. **Approve Quote**
   - Click "Approve Quote" button
   - Confirm approval in modal
   - **WHAT TO CHECK**: Clear that you're committing to this price?

3. **Track Approved Order**
   - See status change to "Pending" (lab will acknowledge next)
   - **WHAT TO CHECK**: Understand what "Pending" means (awaiting lab acknowledgment)?

### Scenario 4: Reject Quote (Alternative Flow)
**Role**: Client

1. **Reject Quote**
   - On any "Quote Ready for Review" order
   - Click "Reject Quote" button
   - Provide rejection reason (e.g., "Price exceeds budget", "Too long turnaround")
   - **WHAT TO CHECK**: Easy to provide feedback to lab?

2. **Verify Rejection**
   - See status change to "Quote Rejected" (red badge)
   - **WHAT TO CHECK**: Clear that this RFQ is closed?

---

## 🐛 What to Report

### Critical Issues (Blocks testing)
- ❌ Can't sign in
- ❌ Can't submit RFQ
- ❌ Can't provide quote
- ❌ Can't approve/reject quote
- ❌ Page crashes or shows error

### Important Issues (Confusing UX)
- 😕 Unclear what a field means
- 😕 Didn't understand what happened after action
- 😕 Can't find how to do something
- 😕 Unexpected behavior

### Nice-to-Have Feedback
- 💡 Suggestion for improvement
- 💡 Missing feature you expected
- 💡 Design/layout preferences

---

## 📝 Feedback Template

**Copy this template for each issue:**

```
## Issue #[X]

**Priority**: [Critical / Important / Nice-to-have]

**What I was trying to do**:
[e.g., "Submit RFQ for water quality testing"]

**What happened instead**:
[e.g., "Form didn't submit, no error message shown"]

**What I expected**:
[e.g., "See confirmation and redirect to dashboard"]

**Steps to reproduce**:
1. Go to [URL or page]
2. Click [button]
3. Fill [field] with [value]
4. See error

**Screenshot** (if possible):
[attach screenshot]

**Device & Browser**:
[e.g., "iPhone 13, Safari" or "Windows 11, Chrome"]
```

---

## 🎯 Focus Areas

### Primary Focus (Most Important)
1. **RFQ Submission Flow**: Can clients easily request quotes?
2. **Quote Provision Flow**: Can labs easily provide quotes?
3. **Quote Review Flow**: Can clients easily approve/reject quotes?
4. **Status Clarity**: Do you understand what each order status means?

### Secondary Focus
5. **Mobile Usability**: Does it work well on your phone?
6. **Error Handling**: If something goes wrong, is the error message helpful?
7. **Loading States**: Any confusingly long waits without feedback?

---

## ⏱️ Estimated Testing Time

- **Quick Test** (happy path only): 10-15 minutes
- **Thorough Test** (including edge cases): 30-45 minutes

---

## 📧 How to Submit Feedback

**Option 1**: Email feedback to [your-email]

**Option 2**: Add comments to shared Google Doc: [doc-link]

**Option 3**: WhatsApp/Telegram: [your-contact]

---

## ❓ FAQ

**Q: What happens after I submit feedback?**
A: Development team will review, prioritize (P0/P1/P2), and fix critical issues before launch.

**Q: Can I create my own account?**
A: Yes! Sign in page has "Create Account" option. Use any email (doesn't need to be real email for testing).

**Q: What if I find a bug during testing?**
A: Great! That's the point of testing. Report it using the feedback template above.

**Q: Are my test orders saved?**
A: Yes, test data persists during testing period. But it will be reset before production launch.

**Q: Can I test on my phone?**
A: Yes! Mobile testing is valuable. Please note device/browser in feedback.

---

## 🙏 Thank You!

Your feedback helps make PipetGo better for Philippine businesses and laboratories. Every bug you find and every suggestion you make improves the platform.

**Questions?** Contact [CEO name] directly.

---

**Happy Testing! 🧪🔬**
