# PipetGo Cost Analysis — Philippine Market Rates

## 1. LABOR COSTS BREAKDOWN

### 1.1 Development Hours Estimate

**Stage 1: MVP (6-8 weeks)**

| Milestone | Task Category | Hours | Hourly Rate (PHP) | Subtotal (PHP) |
|-----------|---------------|-------|-------------------|----------------|
| **M1: Project Setup** | Infrastructure | 24h | ₱800 | ₱19,200 |
| **M2: Authentication** | Backend + Frontend | 48h | ₱800 | ₱38,400 |
| **M3: User/Lab Profiles** | Full-stack | 56h | ₱800 | ₱44,800 |
| **M4: Service Catalog** | Full-stack + DB optimization | 56h | ₱800 | ₱44,800 |
| **M5: Order Management** | Complex business logic | 80h | ₱900 | ₱72,000 |
| **M6: File Upload System** | Backend + Storage | 48h | ₱800 | ₱38,400 |
| **M7: Notifications** | Integration + Templates | 32h | ₱700 | ₱22,400 |
| **M8: UI Polish & Testing** | QA + Refinement | 56h | ₱800 | ₱44,800 |
| **M9: Deployment** | DevOps | 20h | ₱900 | ₱18,000 |
| **Subtotal Stage 1** | | **420h** | | **₱342,800** |

**Stage 2: Professional Polish (4-5 weeks)**

| Milestone | Hours | Rate | Subtotal |
|-----------|-------|------|----------|
| Payment Integration (Stripe + Paymongo) | 60h | ₱1,000 | ₱60,000 |
| File Storage Migration (S3/UploadThing) | 24h | ₱800 | ₱19,200 |
| SMS Notifications (Semaphore) | 16h | ₱700 | ₱11,200 |
| Logistics Integration (Lalamove API) | 48h | ₱900 | ₱43,200 |
| Security Hardening | 32h | ₱1,000 | ₱32,000 |
| Advanced Order States | 40h | ₱900 | ₱36,000 |
| **Subtotal Stage 2** | **220h** | | **₱201,600** |

**Additional Development Overhead**

| Item | Hours | Rate | Subtotal |
|------|-------|------|----------|
| Bug fixes & iterations (15% of dev time) | 96h | ₱800 | ₱76,800 |
| Client communication & revisions | 40h | ₱600 | ₱24,000 |
| Documentation writing | 24h | ₱700 | ₱16,800 |
| **Overhead Subtotal** | **160h** | | **₱117,600** |

---

### 1.2 Philippine Developer Rates Context

**Market Rates (2025):**
- **Junior Developer (1-2 years):** ₱500-₱700/hour
- **Mid-Level Developer (3-5 years):** ₱700-₱1,000/hour
- **Senior Developer (5+ years):** ₱1,000-₱1,500/hour
- **Tech Lead/Architect:** ₱1,500-₱2,500/hour

**Your Profile:** Self-taught with 16 years coding experience → **Senior Mid-tier rate: ₱800-₱1,000/hour**

**Labor Total:**
- **Stage 1 (MVP):** 420h × ₱816 avg = **₱342,800**
- **Stage 2 (Polish):** 220h × ₱916 avg = **₱201,600**
- **Overhead:** 160h × ₱735 avg = **₱117,600**
- **Total Development Hours:** 800h
- **Total Labor Cost:** **₱662,000**

---

## 2. INFRASTRUCTURE & SERVICE COSTS

### 2.1 Year 1 Infrastructure Costs (MVP + Stage 2)

| Service | Tier/Plan | Monthly Cost | Annual Cost | Notes |
|---------|-----------|--------------|-------------|-------|
| **Domain (.com)** | Namecheap/GoDaddy | — | ₱700 | pipetgo.com |
| **Vercel Hosting** | Pro Plan | ₱1,100 | ₱13,200 | Required for team features, better limits |
| **Neon PostgreSQL** | Launch Plan | ₱1,000 | ₱12,000 | 10GB storage, autoscaling |
| **SendGrid Email** | Essentials 50K | ₱850 | ₱10,200 | 50,000 emails/month |
| **Sentry Error Tracking** | Team Plan | ₱1,500 | ₱18,000 | 50K events/month |
| **UploadThing Storage** | Pro Plan | ₱1,100 | ₱13,200 | 100GB storage, 1TB bandwidth |
| **Semaphore SMS** | Pay-as-you-go | ₱500 | ₱6,000 | ~2,000 SMS/month @ ₱3/SMS |
| **SSL Certificate** | Free | ₱0 | ₱0 | Included in Vercel |
| **GitHub** | Free | ₱0 | ₱0 | Private repos included |
| **AI Coding Assistant** | Claude Pro / Copilot | ₱1,100 | ₱13,200 | Development productivity |
| **Figma** | Free/Pro | ₱0 | ₱0 | Design tool (free tier sufficient) |
| **Postman** | Free | ₱0 | ₱0 | API testing |
| **Total Infrastructure** | | **₱7,150/mo** | **₱86,500/year** | |

---

### 2.2 Payment Gateway Fees (Ongoing, not upfront)

| Provider | Fee Structure | Estimated Cost (Year 1) |
|----------|---------------|-------------------------|
| **Stripe** | 3.5% + ₱15 per transaction | Variable (depends on GMV) |
| **Paymongo** | 3.5% + ₱15 per transaction | Variable |
| **GCash** | 2.5% per transaction | Variable |

**Assumption:** Not charged upfront; deducted from revenue. Not included in project cost.

---

### 2.3 Optional/Future Costs (Not in MVP)

| Service | Use Case | Annual Cost |
|---------|----------|-------------|
| **Vercel Analytics** | Deeper insights | ₱6,600 |
| **Redis (Upstash)** | Caching (Stage 3) | ₱5,500 |
| **Algolia** | Advanced search (Stage 3) | ₱11,000 |
| **Twilio** | Alternative SMS | ₱8,800 |
| **Cloudflare WAF** | DDoS protection | ₱11,000 |

**Not included in Stage 1-2 estimate.**

---

## 3. TOTAL PROJECT COST ESTIMATE

### 3.1 Itemized Breakdown

| Category | Cost (PHP) | % of Total |
|----------|-----------|------------|
| **Development Labor (800h)** | ₱662,000 | 88.4% |
| **Infrastructure (Year 1)** | ₱86,500 | 11.6% |
| **Total Project Cost** | **₱748,500** | 100% |

---

### 3.2 Comparison to Market Rates

**Reddit Estimates for Similar Projects:** ₱750,000 - ₱800,000

**Your Estimate:** ₱748,500 (within range ✅)

**Why this aligns:**
- **800 hours** is realistic for a solo senior developer building a full-stack marketplace
- **₱800-₱1,000/hour** matches senior freelance rates in Philippines
- Infrastructure costs (~₱87K/year) are standard for SaaS with real users

---

### 3.3 Cost Breakdown by Development Stage

| Stage | Labor Hours | Labor Cost | Infrastructure (Year 1) | Total |
|-------|-------------|------------|-------------------------|-------|
| **Stage 1 (MVP)** | 420h | ₱342,800 | ₱43,250 (6 months) | **₱386,050** |
| **Stage 2 (Polish)** | 220h | ₱201,600 | ₱43,250 (6 months) | **₱244,850** |
| **Overhead** | 160h | ₱117,600 | — | **₱117,600** |
| **Total** | 800h | ₱662,000 | ₱86,500 | **₱748,500** |

---

## 4. PAYMENT STRUCTURE OPTIONS

### 4.1 If Billing Your Sister's Business

**Option A: Fixed-Price Contract**
```
Total: ₱748,500
Payment Terms:
  - 30% upfront (₱224,550) — Upon contract signing
  - 40% mid-project (₱299,400) — After Stage 1 MVP deployment
  - 30% on completion (₱224,550) — After Stage 2 + 2 weeks support
```

**Option B: Milestone-Based**
```
Milestone 1 (Auth + Profiles): ₱150,000
Milestone 2 (Service Catalog): ₱100,000
Milestone 3 (Order System): ₱150,000
Milestone 4 (Files + Notifications): ₱100,000
Milestone 5 (Stage 2 Features): ₱200,000
Infrastructure (Year 1): ₱48,500 (upfront)
Total: ₱748,500
```

**Option C: Time & Materials**
```
Hourly Rate: ₱900/hour (blended rate)
Estimated: 800 hours
Cap: ₱750,000 (protect against overruns)
Infrastructure: Pass-through at cost
Invoiced: Bi-weekly based on logged hours
```

---

### 4.2 Family Discount Considerations

If this is for your sister's business, consider:

**Commercial Rate:** ₱748,500 (market rate)  
**Family Discount (20%):** -₱149,700  
**Adjusted Total:** **₱598,800**

**Reasoning:**
- You're saving her ₱150K vs hiring an agency
- Still values your senior-level expertise fairly
- Covers your infrastructure costs + reasonable compensation for 800 hours

---

## 5. COST OPTIMIZATION STRATEGIES

### 5.1 Reduce Infrastructure Costs

**Budget Option (MVP Only):**

| Service | Free Tier Alternative | Savings |
|---------|----------------------|---------|
| Vercel | Hobby Plan (free) | ₱13,200/year |
| Neon | Free Tier (0.5GB) | ₱12,000/year |
| SendGrid | Free Tier (100 emails/day) | ₱10,200/year |
| Sentry | Developer Plan (5K events) | ₱18,000/year |
| UploadThing | Free Tier (2GB) | ₱13,200/year |
| **Total Savings** | | **₱66,600/year** |

**New Infrastructure Cost:** ₱19,900/year (Domain + Semaphore + AI)

**Warning:** Free tiers have limits—upgrade when you hit real users.

---

### 5.2 Reduce Development Time

**Fast-Track MVP (Sacrifice Stage 2):**
- Focus only on core order flow (no payments, no logistics)
- Skip file upload (use email for results temporarily)
- Skip SMS (email-only notifications)
- **Reduced Hours:** 420h → 300h
- **Labor Savings:** ₱98,400
- **New Labor Cost:** ₱246,000

**Trade-off:** Less polished product, but faster validation.

---

### 5.3 Bootstrap Budget Estimate

**Absolute Minimum (DIY, Free Tiers):**

| Item | Cost |
|------|------|
| Labor (300h × ₱800) | ₱240,000 |
| Domain | ₱700 |
| Free tier infrastructure | ₱0 |
| AI Assistant (optional) | ₱13,200 |
| **Total** | **₱253,900** |

**Caveats:**
- No payment processing
- No SMS
- Limited email sends
- Must upgrade infrastructure when scaling
- Higher risk of downtime

---

## 6. ONGOING COSTS (POST-LAUNCH)

### 6.1 Monthly Operating Costs (Year 2+)

| Item | Cost/Month |
|------|-----------|
| Vercel Pro | ₱1,100 |
| Neon Launch | ₱1,000 |
| SendGrid Essentials | ₱850 |
| Sentry Team | ₱1,500 |
| UploadThing Pro | ₱1,100 |
| Semaphore SMS | ₱500 |
| Domain renewal | ₱58 |
| **Total** | **₱6,108/month** (~₱73,300/year) |

---

### 6.2 Maintenance & Support (Optional)

**If you offer ongoing maintenance to your sister:**

| Service Level | Hours/Month | Rate | Monthly Cost |
|---------------|-------------|------|--------------|
| **Basic Support** | 5h (bug fixes only) | ₱800/h | ₱4,000 |
| **Standard Support** | 10h (bugs + minor features) | ₱800/h | ₱8,000 |
| **Premium Support** | 20h (bugs + new features) | ₱800/h | ₱16,000 |

**Recommended:** Standard Support (₱8,000/month) for Year 1 post-launch.

---

## 7. REVENUE MODEL TO COVER COSTS

### 7.1 How Many Orders Needed to Break Even?

**Assumptions:**
- Platform fee: **15%** of order value
- Average order value: **₱5,000**
- Platform revenue per order: **₱750**

**Break-Even Analysis (Year 1):**

| Scenario | Costs | Orders Needed | Orders/Month |
|----------|-------|---------------|--------------|
| **With Free Infrastructure** | ₱662,000 (labor only) | 883 orders | 74 orders/month |
| **With Paid Infrastructure** | ₱748,500 (full cost) | 998 orders | 83 orders/month |
| **With Ongoing Costs (Year 2)** | ₱73,300/year | 98 orders/year | 8 orders/month |

**Insight:** After initial development, platform needs only **8-10 orders/month** to sustain itself.

---

### 7.2 Profitability Timeline

**Month 1-3:** MVP development (no revenue)  
**Month 4-6:** Stage 2 + beta testing (first orders)  
**Month 7-12:** Full launch (scaling orders)  
**Month 13+:** Profitable (infrastructure paid by platform fees)

**Target:** 50 orders/month by Month 12 → ₱37,500/month revenue → Covers infrastructure + maintenance.

---

## 8. FINAL RECOMMENDATIONS

### 8.1 Cost-Benefit Analysis by Approach

| Approach | Total Cost | Time to Launch | Risk Level | Recommendation |
|----------|-----------|----------------|------------|----------------|
| **Full Build (₱748,500)** | ₱748,500 | 8 weeks | Low | ✅ Best for serious business |
| **Fast MVP (₱386,050)** | ₱386,050 | 4 weeks | Medium | ✅ Good for validation |
| **Bootstrap (₱253,900)** | ₱253,900 | 4 weeks | High | ⚠️ Only if capital-constrained |

---

### 8.2 Intelligent Recommendation

**For your situation (sister's business, early-stage):**

1. **Start with Fast MVP (Stage 1 only): ₱386,050**
   - Validates product-market fit
   - Real users within 6 weeks
   - Lower financial risk

2. **If validation succeeds, fund Stage 2 from early revenue**
   - Charge clients even without payment gateway (manual bank transfer)
   - Use first 50 orders (₱37,500 revenue) to fund Stage 2 development

3. **Infrastructure: Start with free tiers, upgrade as needed**
   - Saves ₱67K in Year 1
   - Upgrade when hitting limits (good problem to have)

**Revised Budget:**
- **Phase 1 (MVP):** ₱342,800 (labor) + ₱19,900 (infrastructure) = **₱362,700**
- **Phase 2 (If successful):** Fund from revenue

---

### 8.3 Caveats & Assumptions

**Labor rate assumptions:**
- You're billing at senior developer rates (₱800-₱1,000/hour)
- If treating this as sweat equity (family project), labor cost is ₱0
- If hiring someone else, these rates are accurate for PH market

**Infrastructure assumptions:**
- Based on 2025 pricing (subject to change)
- Assumes moderate traffic (not viral launch)
- Free tiers sufficient for first 100 users

**Timeline assumptions:**
- Solo developer, part-time (20 hours/week) = 8 weeks
- Solo developer, full-time (40 hours/week) = 4 weeks
- With 1 partner, full-time = 2-3 weeks

---

## 9. SUMMARY TABLE

### 9.1 Quick Reference: Total Project Cost

| Component | Cost Range | Your Estimate |
|-----------|-----------|---------------|
| **Labor (800 hours)** | ₱640K - ₱800K | ₱662,000 |
| **Infrastructure (Year 1)** | ₱20K - ₱90K | ₱86,500 |
| **Total** | **₱660K - ₱890K** | **₱748,500** |
| **Reddit Market Rate** | ₱750K - ₱800K | ✅ Within range |

---

### 9.2 What You Get for ₱748,500

✅ **Full-stack marketplace platform**  
✅ **Role-based authentication** (4 roles)  
✅ **Service catalog with search/filters**  
✅ **Complete order workflow** (request → fulfill → deliver)  
✅ **File upload/download system**  
✅ **Email notifications** (transactional)  
✅ **Payment integration** (Stripe, Paymongo, GCash)  
✅ **SMS notifications** (critical alerts)  
✅ **Logistics integration** (Lalamove API)  
✅ **Responsive mobile design**  
✅ **Security hardening** (rate limiting, CSRF protection)  
✅ **Error tracking** (Sentry)  
✅ **Production deployment** (Vercel)  
✅ **1 year infrastructure costs included**  
✅ **Complete documentation**  

---

## 10. FINAL ANSWER

**Your project cost estimate of ₱748,500 is ACCURATE and well within the ₱750K-₱800K market range cited on Reddit.**

**Cost Breakdown:**
- 💼 **Development:** ₱662,000 (800 hours × ₱827.50 average rate)
- 🏗️ **Infrastructure:** ₱86,500 (Year 1 hosting, domain, services)
- 📊 **Total:** **₱748,500**

**This is a fair commercial rate for a senior-level developer building a production-ready B2B2C marketplace with payment integration, logistics, and security features.**

If you're building this as sweat equity (not billing anyone), your out-of-pocket cost is only ₱86,500 for infrastructure—or as low as ₱19,900 if using free tiers initially.

---

# PipetGo Cost Analysis — Sweat Equity + CTO Stake Model

Perfect context! This completely changes the financial model. You're not billing for labor—you're investing **sweat equity** in exchange for a **CTO equity position**. This is a common founder arrangement and makes much more sense for a family startup.

---

## REVISED COST STRUCTURE

### Your Out-of-Pocket Costs Only

| Category | Year 1 Cost | Notes |
|----------|-------------|-------|
| **Domain Registration** | ₱700 | pipetgo.com or .ph |
| **Vercel Hosting** | ₱0 | Start with free Hobby tier |
| **Neon PostgreSQL** | ₱0 | Free tier (0.5GB, sufficient for MVP) |
| **SendGrid Email** | ₱0 | Free tier (100 emails/day) |
| **Sentry Error Tracking** | ₱0 | Developer tier (5K events/month) |
| **File Storage** | ₱0 | Local storage initially, migrate to S3 when needed |
| **SMS (Optional)** | ₱0 | Defer to Stage 2, email-only for MVP |
| **AI Coding Assistant** | ₱13,200 | Claude Pro/GitHub Copilot (productivity investment) |
| **Coffee & Electricity** | ~₱5,000 | 2 months full-time work from home |
| **TOTAL MVP Cost** | **₱18,900** | Absolute minimum to launch |

### When You'll Need to Upgrade (Post-MVP)

| Service | Trigger Point | Upgrade Cost/Month |
|---------|---------------|-------------------|
| **Vercel** | >100GB bandwidth/month | ₱1,100 (Pro) |
| **Neon** | >0.5GB data or >20 connections | ₱1,000 (Launch) |
| **SendGrid** | >100 emails/day | ₱850 (Essentials) |
| **Sentry** | >5K errors/month | ₱1,500 (Team) |
| **File Storage** | >2GB files | ₱1,100 (UploadThing) |
| **SMS** | When needed for order notifications | ₱500 (Semaphore) |

**Infrastructure scaling cost when you hit real traction:** ~₱6,000-₱7,000/month

---

## EQUITY & FOUNDER AGREEMENT

### Recommended Equity Split

**Typical CTO equity stake for early-stage startup:**

| Role | Equity % | Reasoning |
|------|----------|-----------|
| **Your Sister (CEO/Founder)** | 60-70% | Original idea, business development, customer acquisition, funding |
| **You (CTO/Co-Founder)** | 30-40% | Technical build, product development, infrastructure, maintenance |

**Recommendation for your situation:** **35% equity** for you as CTO

**Why 35%?**
- Standard CTO equity range is 20-40% depending on when you join
- You're joining at inception (pre-product) → higher equity
- You're contributing 800+ hours of senior dev work (₱662K value)
- You're not taking salary during development → sweat equity premium
- Your sister is fronting infrastructure costs and owns business risk

---

### Founder Agreement Essentials

**Document these terms (even informally):**

```
PipetGo Founder Agreement — Key Terms

1. Equity Split:
   - [Sister's Name]: 65% (CEO, majority stakeholder)
   - [Your Name]: 35% (CTO, technical co-founder)

2. Roles & Responsibilities:
   CEO (Sister):
   - Business strategy, fundraising, legal/compliance
   - Customer acquisition, sales, marketing
   - Lab partnerships, operations
   - Final decision authority on business matters
   
   CTO (You):
   - Product development (all technical aspects)
   - Infrastructure management, DevOps
   - Hiring/managing future tech team (if funded)
   - Final decision authority on technical architecture

3. Vesting Schedule (CRITICAL):
   - 4-year vesting, 1-year cliff
   - If you leave before 1 year: 0% equity
   - After 1 year: 25% vested (8.75% of company)
   - Remaining vests monthly over 36 months
   
   Why vesting matters: Protects both of you if someone leaves early

4. IP Assignment:
   - All code, designs, documentation created by you = owned by PipetGo
   - No side licensing or forking without mutual consent

5. Capital Contributions:
   - Sister funds infrastructure costs (recorded as company expenses)
   - You contribute sweat equity (recorded as founder contribution)
   - Track your hours (shows valuation for future fundraising)

6. Decision-Making:
   - Day-to-day: Each handles own domain (business vs tech)
   - Major decisions: Mutual agreement (new product lines, fundraising, hiring)
   - Deadlock resolution: CEO has tiebreaker (she has majority equity)

7. Exit Terms:
   - If company is acquired: Equity converts to cash based on % ownership
   - If company raises VC funding: Equity may dilute proportionally
   - If one wants to exit: Right of first refusal for other co-founder

8. Founder Salary (Future):
   - Once company is profitable or raises funding:
     - CEO: ₱80K-₱120K/month (market rate)
     - CTO: ₱80K-₱120K/month (market rate)
   - Until then: sweat equity only

9. Dispute Resolution:
   - Mediation before arbitration
   - PH law governs (if incorporated here)
```

**Legal Note:** Get this reviewed by a startup lawyer once you have revenue (₱15K-₱30K for proper incorporation docs).

---

## VALUATION PERSPECTIVE

### Your Sweat Equity Contribution

| Item | Value |
|------|-------|
| Development labor (800h × ₱827 avg) | ₱662,000 |
| Opportunity cost (could freelance instead) | ₱662,000 |
| Technical expertise (senior-level) | Intangible |
| Future maintenance commitment | Ongoing |
| **Total Value Contributed** | **₱662,000** |

### Your Sister's Capital Contribution

| Item | Value |
|------|-------|
| Infrastructure (Year 1) | ₱86,500 |
| Business development time | ₱200,000+ (if valued) |
| Legal/incorporation costs | ₱30,000+ |
| Risk of capital loss | All on her |
| **Total Value Contributed** | **₱300K+** |

**Combined Startup Valuation (Pre-Revenue):** ~₱1M worth of contributions

**Your 35% equity value:** ₱350,000 (in a pre-revenue startup, so illiquid)

---

## COST-BENEFIT ANALYSIS: IS THIS WORTH IT?

### 1. **Cost–Benefit Analysis**

#### ✅ **Benefits (Why This Makes Sense)**

**Financial:**
- Equity ownership in a real business (35% × future value)
- Potential upside if PipetGo succeeds (₱0 → ₱10M+ valuation not impossible)
- Portfolio project worth ₱662K that you own part of
- Future CTO salary if company gets funded (₱80K-₱120K/month)

**Career:**
- Proven track record: "I built a production marketplace from scratch"
- CTO title + equity on LinkedIn (massive credibility boost)
- Real-world Next.js, TypeScript, PostgreSQL experience
- Case study for future clients/employers
- Escape from geodesy niche into broader tech market

**Personal:**
- Repay sister's generosity (she loaned you money interest-free)
- Family business = flexible work arrangement (ADHD/autism-friendly)
- Less stressful than client work (no external pressure, family trust)
- Skill-building in areas you're expanding into (web dev)

**Opportunity Cost:**
- 800 hours over 8 weeks = could earn ₱662K freelancing
- **BUT:** Freelance gigs are time-limited; equity is perpetual
- **AND:** You get a CTO title, which unlocks higher-paying future work

#### ⚠️ **Risks (What Could Go Wrong)**

**Financial:**
- Startup failure rate: ~90% fail within 5 years
- Your 800 hours might = ₱0 if company doesn't succeed
- Infrastructure costs may grow faster than revenue
- Sister's business could pivot/shut down (you lose equity)

**Personal:**
- Family dynamics: What if you disagree on product direction?
- 800 hours is a LOT (2 months full-time) with zero guaranteed return
- ADHD/autism: Will you maintain motivation through repetitive tasks?
- Could strain relationship if project fails or causes conflict

**Career:**
- Opportunity cost: 2 months not freelancing or job hunting
- If project never launches, you have "nothing to show" (though codebase is still portfolio)

---

### 2. **Context Integration**

**Your Current Situation:**
- 16 years coding experience, but transitioning from geodesy to web dev
- ADHD/autism challenges (focus, executive function, burnout risk)
- Sister has supported you financially (unpaid loans)
- You need portfolio projects to transition careers
- You've completed freeCodeCamp certifications (web, JS, DBs)

**How This Project Fits:**
- ✅ Fills knowledge gaps (authentication, file upload, deployment)
- ✅ Real-world complexity (not a tutorial project)
- ✅ Flexible timeline (no client pressure)
- ✅ Moral obligation to sister (non-financial motivation)
- ✅ CTO title opens doors (especially for mid-level/senior roles)
- ⚠️ 800 hours is daunting for someone with focus challenges
- ⚠️ Family business = harder to walk away if overwhelmed

---

### 3. **Intelligent Recommendation**

**My recommendation: YES, do this project, BUT with modifications to protect yourself.**

#### **Modified Approach: Phased Commitment**

**Phase 1: MVP Validation (4 weeks, 300 hours)**
- Build stripped-down MVP (auth, catalog, basic orders, no payments/logistics)
- Your commitment: 300 hours (₱246K value)
- Sister's commitment: Get 5 labs to beta test
- Decision point: If labs don't engage, pivot or kill project (you've "only" spent 300h)

**Phase 2: Full Build (If Phase 1 succeeds)**
- Complete Stage 1 + Stage 2 (additional 500 hours)
- Equity vesting starts AFTER Phase 1 success
- Sister funds infrastructure scaling (₱6K/month)

**Why This Protects You:**
- Limits downside risk (300h vs 800h if project fails early)
- Tests market demand before you're too invested
- Gives you an "out" if family dynamics become difficult
- Still shows commitment to sister (not abandoning her)

#### **Equity Terms Recommendation**

```
Proposed Equity Structure:

Phase 1 (MVP - 300h):
- 15% equity vests immediately upon launch (₱246K value)
- Sister evaluates: Does product have traction?

Phase 2 (Full Build - 500h):
- Additional 20% equity vests over 2 years (monthly)
- Contingent on Phase 1 success metrics:
  * 10+ active lab users
  * 50+ orders in first 3 months
  * Sister commits to funding infrastructure

Total: 35% CTO equity, but front-loaded to reward early risk
```

**Why Front-Load Equity:**
- You're taking biggest risk in Phase 1 (building with zero proof of demand)
- If project fails after MVP, you still have 15% equity (might be worth something later)
- Protects against "bait and switch" (sister loses interest after you build MVP)

---

## ADHD/AUTISM-FRIENDLY EXECUTION PLAN

### Managing 800 Hours with Executive Function Challenges

**1. Break Into Micro-Milestones (Weekly Sprints)**

Instead of "build authentication in 48 hours," do:
- Week 1 Day 1-2: Install NextAuth, configure Prisma adapter (6h)
- Week 1 Day 3-4: Build registration endpoint + page (8h)
- Week 1 Day 5-6: Build login flow + session management (6h)
- Week 2 Day 1-2: Test auth flows, fix bugs (4h)

**Why This Works:** ADHD brains thrive on frequent wins; 2-3 day tasks feel achievable.

**2. Use AI Heavily (You Already Have Claude Pro)**

- Let Claude write boilerplate code (API routes, Prisma queries)
- Ask Claude to review your code for bugs (rubber duck debugging)
- Use Claude to break down ambiguous tasks into steps
- Offload documentation writing to Claude

**Estimated Time Savings:** 20-30% (800h → 560-640h actual work)

**3. Build in Public (Accountability + Dopamine)**

- Tweet progress daily (#buildinpublic)
- Share screenshots with sister weekly
- Post on r/Philippines dev communities
- The social validation = dopamine hits = sustains motivation

**4. Protect Hyperfocus Sessions**

When you're in flow (hyperfocus), MAXIMIZE IT:
- Block out 4-6 hour chunks
- Turn off all notifications (phone in another room)
- Tell sister "I'm in focus mode, don't disturb"
- These sessions will be your 10x productivity days

**5. Forgive Yourself for Low-Productivity Days**

ADHD is cyclical. Some days you'll write 50 lines; others you'll write 500.
- Track hours, not code output
- 2-3 productive hours = 1 "work day" (totally valid)
- Don't guilt-spiral if you have an off week

**6. Schedule "Boring Task" Days**

Tasks like "write documentation" or "test edge cases" = low dopamine.
- Do these AFTER completing a fun milestone (reward yourself)
- Pair with high-dopamine activity (favorite music, good coffee)
- Break into 25-min Pomodoros

---

## FINAL NUMBERS SUMMARY

### Scenario A: Full 800-Hour Build

| Your Investment | Value |
|-----------------|-------|
| Time commitment | 800 hours (2 months full-time) |
| Labor value (if freelancing) | ₱662,000 |
| Out-of-pocket costs | ₱18,900 (domain + AI + coffee) |
| **Total Investment** | **₱680,900** |
| **Your Equity** | 35% of PipetGo |
| **Break-Even Valuation** | ₱1.95M (company must be worth ₱1.95M for your equity to = your investment) |

### Scenario B: Phased 300-Hour MVP

| Your Investment | Value |
|-----------------|-------|
| Phase 1 time | 300 hours (1 month full-time) |
| Labor value | ₱246,000 |
| Out-of-pocket costs | ₱18,900 |
| **Total Investment** | ₱264,900 |
| **Your Equity** | 15% vests immediately |
| **Break-Even Valuation** | ₱1.77M |

---

## MY HONEST TAKE

**Do this project. Here's why:**

1. **You owe your sister** — This is the right way to repay her (not with cash, but with your highest-value skill).

2. **35% of a working startup > 100% of ₱662K** — If PipetGo even modestly succeeds (₱5M valuation in 3 years), your equity is worth ₱1.75M.

3. **CTO title is career rocket fuel** — Going from "geodesy researcher" to "CTO of SaaS startup" is a MASSIVE LinkedIn upgrade.

4. **Portfolio project = priceless** — Even if PipetGo fails, you have a production-grade codebase to show employers.

5. **Family business = ADHD-friendly** — No asshole clients, no unrealistic deadlines, built-in psychological safety.

**But protect yourself with the phased approach.** Build the 300-hour MVP first, validate demand, THEN commit the remaining 500 hours. This limits your downside while still honoring your commitment to your sister.

**Your out-of-pocket cost is only ₱18,900.** That's a rounding error compared to the potential upside.

**Go build, document your equity agreement, and let's make PipetGo successful. 🚀**