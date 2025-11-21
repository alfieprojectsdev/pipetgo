# PipetGo User Testing Guide
## For CEO's Friends - November 2025

**Testing URL**: https://www.pipetgo.com/
*(Production deployment)*

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

### Scenario 5: Lab Admin Manages Service Catalog
**Role**: Lab Admin

1. **Navigate to Service Management**
   - Sign in as lab admin
   - Go to Lab Dashboard → Services (or directly to `/dashboard/lab/services`)
   - See table of existing services with columns: Name, Category, Pricing Mode, Price, Status
   - **WHAT TO CHECK**: Can you see all your lab's services? Is the table easy to scan?

2. **Add a New Service**
   - Click "Add Service" button
   - Fill out service form:
     - **Name**: e.g., "Heavy Metals Analysis (Lead, Mercury, Cadmium)"
     - **Category**: Select from dropdown (Chemical Analysis, Microbiological Testing, etc.)
     - **Pricing Mode**: Choose one:
       - QUOTE_REQUIRED - Client must request quote (no fixed price shown)
       - FIXED - Show fixed price to clients
       - HYBRID - Show base price but allow custom quotes
     - **Price** (if FIXED or HYBRID): e.g., ₱5,000.00
     - **Turnaround Days**: e.g., 7
     - **Description**: What the test includes, sample requirements
   - Click "Create Service"
   - **WHAT TO CHECK**: Is the form clear? Do you understand what each pricing mode means?

3. **Verify Service Created**
   - See new service appear in the table
   - Status shows "Active" (green badge)
   - **WHAT TO CHECK**: Easy to confirm the service was added?

4. **Test Bulk Operations**
   - Select multiple services using checkboxes
   - Use "Enable Selected" or "Disable Selected" buttons
   - See status change for all selected services
   - **WHAT TO CHECK**: Can you quickly enable/disable multiple services at once?

5. **Edit an Existing Service**
   - Click the edit icon (pencil) on any service row
   - Modify any field (e.g., update price or turnaround time)
   - Save changes
   - **WHAT TO CHECK**: Easy to update service details?

6. **Toggle Service Status**
   - Click the toggle switch to deactivate a service
   - Service status changes to "Inactive" (gray badge)
   - Inactive services won't appear to clients on the homepage
   - **WHAT TO CHECK**: Clear visual feedback when toggling?

### Scenario 6: Lab Admin Views Analytics Dashboard
**Role**: Lab Admin

1. **Navigate to Analytics**
   - Go to Lab Dashboard → Analytics (or directly to `/dashboard/lab/analytics`)
   - **WHAT TO CHECK**: Easy to find the analytics section?

2. **Review Dashboard Metrics**
   - See overview cards: Total Revenue, Total Orders, Pending Quotes, etc.
   - View Revenue Chart showing income over time
   - View Quote Metrics (acceptance rate, average response time)
   - View Order Volume trends
   - See Top Services table (which services generate most revenue)
   - **WHAT TO CHECK**: Is the data useful? Any metrics missing that you'd want to see?

3. **Interact with Charts**
   - Hover over chart elements for detailed values
   - Check date ranges if available
   - **WHAT TO CHECK**: Are charts easy to understand?

---

## 🐛 What to Report

### Critical Issues (Blocks testing)
- ❌ Can't sign in
- ❌ Can't submit RFQ
- ❌ Can't provide quote
- ❌ Can't approve/reject quote
- ❌ Can't add/edit services
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
5. **Service Management**: Can labs easily add/edit services?
6. **Analytics**: Is the dashboard data useful for lab admins?

### Secondary Focus
7. **Mobile Usability**: Does it work well on your phone?
8. **Error Handling**: If something goes wrong, is the error message helpful?
9. **Loading States**: Any confusingly long waits without feedback?

---

## ⏱️ Estimated Testing Time

- **Quick Test** (happy path only): 15-20 minutes
- **Thorough Test** (including edge cases): 45-60 minutes

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

**Q: How do I add services as a lab admin?**
A: Go to Lab Dashboard → Services. Click "Add Service" to create your lab's service catalog. You can set pricing mode (quote required, fixed price, or hybrid), turnaround time, and description for each service.

---

## 🙏 Thank You!

Your feedback helps make PipetGo better for Philippine businesses and laboratories. Every bug you find and every suggestion you make improves the platform.

**Questions?** Contact [CEO name] directly.

---

**Happy Testing! 🧪🔬**
