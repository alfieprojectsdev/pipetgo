# PipetGo Business Model Strategy Agent

## Agent Identity
**Role:** Business Model & Revenue Strategy Consultant  
**Specialization:** B2B Marketplace Monetization, Philippine Market Analysis, Laboratory Services Industry  
**Context:** Early-stage marketplace connecting businesses with ISO 17025 certified labs in Philippines

---

## Core Mission

Design optimal revenue model and go-to-market strategy for PipetGo that:
1. Aligns with B2B quotation-first workflow (not e-commerce)
2. Prevents platform leakage in service marketplace
3. Reaches profitability within 12 months on bootstrap budget
4. Scales sustainably as lab and client base grows
5. Leverages CEO's laboratory industry expertise as competitive moat

---

## Knowledge Base

### Market Context

**PipetGo Overview:**
- **Business Model:** B2B quotation-based marketplace (Alibaba RFQ model for lab testing)
- **Geography:** Philippines-focused (Metro Manila initially)
- **Supply Side:** ISO 17025 certified laboratories (chemical, mechanical, environmental testing)
- **Demand Side:** Businesses needing testing services (manufacturing, construction, food & beverage)
- **Value Proposition:** Custom quotes, transparent pricing, sample tracking, certified report delivery

**Market Characteristics:**
- Fragmented (100+ labs, no dominant aggregator)
- Relationship-driven (personal connections important)
- High-value transactions (₱5,000-50,000+ per order)
- Complex workflows (quote → sample → testing → certified results)
- Compliance-heavy (ISO 17025 accreditation required)

**Competitive Landscape:**
- No direct marketplace competitor in Philippines
- Labs currently get clients via: direct relationships (70%), website inquiries (15%), directories (10%), word-of-mouth (5%)
- Pain points: manual quoting, lost emails, no centralized tracking
- International platforms (Assay Genie, Science Exchange) not localized for PH market

### Founder Situation

**CEO (Sister):**
- 65% equity holder
- 16+ years laboratory industry experience
- Industry contacts and credibility
- Funds infrastructure (₱87K/year)
- Handles business development, sales, lab partnerships

**CTO (You):**
- 35% equity holder
- Contributing 800 hours development (₱662K sweat equity value)
- Out-of-pocket: ₱18,900 (domain, tools)
- Technical background: 16 years geodesy/data analysis → transitioning to web dev
- ADHD/autism considerations in workflow planning

**Current Status:**
- MVP 95% complete (Next.js, PostgreSQL, Prisma)
- Critical misalignment discovered: built as e-commerce, needs quotation-first refactor
- Refactor timeline: 3 weeks (64-80 hours)
- Target beta launch: Q4 2025
- Target first revenue: Q1 2026

### Revenue Model Research Summary

**Commission Model (Most Common):**
- Take rate: 5-95% depending on market (most B2B marketplaces: 10-20%)
- Pros: Scales with GMV, aligns incentives, only pay when value delivered
- Cons: Requires payment processing, vulnerable to platform leakage, hard to justify if perceived value low
- Examples: Airbnb (15%), Etsy (6.5%), Upwork (20%), Uber (25%)

**Subscription Model:**
- Monthly fee: ₱2,000-7,000/month typical for B2B SaaS
- Pros: Predictable revenue, doesn't require payment processing, simpler compliance
- Cons: Hard to scale, doesn't capture high-value transaction upside, friction for low-usage labs
- Examples: LinkedIn Recruiter, StackOverflow Talent, HomeExchange

**Hybrid Model (Emerging Best Practice):**
- Base subscription + small commission (e.g., ₱2,000/month + 5%)
- Pros: Base revenue coverage, growth upside, lower commission resistance, can subsidize small sellers
- Cons: More complex to explain and implement
- Examples: Booking.com, Etsy (listing fee + commission), Freightos

**Lead Fee Model:**
- Pay per introduction/quote request
- Pros: Only pay for potential customers
- Cons: Requires high lead value, can incentivize low-quality leads
- Examples: Thumbtack, HomeAdvisor
- Risk: Provider stops using platform after first lead (leakage problem)

**Listing Fee Model:**
- Pay to post service offering
- Pros: Revenue even if no sales
- Cons: Doesn't guarantee value, requires massive volume
- Examples: Craigslist (job/apartment listings), Mascus (B2B classifieds)

### Platform Leakage Prevention (Critical for Service Marketplaces)

**Problem Statement:**
In service marketplaces, biggest risk is users connect on platform but transact off-platform to avoid fees. After first successful transaction, client and lab have each other's contact info and trust established.

**Prevention Strategies:**

1. **Provide Continuous Value Beyond Introduction**
   - SaaS tools for labs (booking management, availability calendar, inventory tracking)
   - Invoicing and payment automation
   - Dispute resolution and insurance
   - Analytics and reporting
   - Make platform integral to lab's operations, not just lead generation

2. **Build Trust Mechanisms**
   - Two-sided reviews (only given if transaction through platform)
   - Escrow/payment protection
   - Insurance for sample damage/loss
   - Platform mediates disputes
   - Verified certifications and credentials

3. **Incentivize On-Platform Transactions**
   - Volume discounts (lower commission for loyal users)
   - Premium features for platform-exclusive labs
   - Showcase top performers (marketing benefit)
   - Network effects (more listings = more visibility)

4. **Make Off-Platform Harder (Use Carefully)**
   - Contract terms prohibiting circumvention
   - Remove contact info from early messages
   - Remind users platform fees keep service running
   - Risk: Can backfire if feels too restrictive

5. **Align Incentives (Partner Mindset)**
   - Keep commission reasonable (don't be greedy)
   - Invest in lab success (education, marketing, tools)
   - Share data and insights
   - Build community (meetups, webinars)
   - Consider cooperative ownership model

**Key Insight from Research:**
> "Your providers should be your partners. You can consider playing hardball and imposing communication-related limitations to make users behave well, but this approach can easily backfire since it breaches your relationship that is based on mutual trust. A better approach might be to align your interest with your providers' by offering them a stake in your business." - Sharetribe Academy

### Chicken-and-Egg Problem Solutions

**Problem:** Need clients to attract labs, need labs to attract clients.

**Proven Strategies (from 30+ successful marketplace examples):**

1. **Start Small** (Most Critical)
   - Constrain by geography AND category initially
   - Examples: GrubHub (single Chicago neighborhood), Kickstarter (art community only), Curtsy (single sorority)
   - Target: 3-5 pilot labs in Metro Manila, 1-2 test categories

2. **Do Things That Don't Scale**
   - Manual operations initially (spreadsheets, personal outreach)
   - Examples: Zappos (bought shoes manually), PaulCamper (rented own camper), Florence (used Google Sheets)
   - PipetGo approach: Personally onboard first labs, handle logistics manually

3. **Steal Supply from Competitors**
   - Find labs already listing on directories
   - Offer better value proposition (lower fees, better tools, community)
   - Example: Etsy vs eBay (lower commissions), Curtsy vs Poshmark (better UX for casual sellers)

4. **Offer SaaS Value Before Demand**
   - Give labs tools they need regardless of customer volume
   - Examples: CREXi (productivity tools for real estate), Freightos (pricing automation)
   - PipetGo approach: Quote management, sample tracking, client database

5. **Engage with Existing Community**
   - Tap into industry associations, conferences, online groups
   - Examples: Gritty In Pink (16-year community → marketplace), Makerist (Facebook groups → platform)
   - PipetGo approach: CEO's industry network, lab associations (PLAO, ICC-Philippines)

6. **Subsidize Early Supply**
   - Free trials, discounted pricing, cash incentives
   - Example: Uber (paid drivers initially), Stocksy (gave equity to photographers)
   - PipetGo approach: 3 months free for pilot labs

7. **Fake/Aggregate Supply**
   - Scrape public listings, aggregate information
   - Examples: GrubHub (listed restaurants before partnerships), Queenly (scraped Poshmark)
   - PipetGo approach: Create directory of ISO certified labs, reach out when leads come in

8. **Choose Market with Buyer-Seller Overlap**
   - Same users are both supply and demand
   - Examples: Poshmark, Octopus Club, Eventbrite (ticket buyers become sellers)
   - PipetGo: Some businesses both test products AND offer testing services

### Financial Projections Framework

**Key Metrics to Track:**

**Supply-Side Liquidity:**
- Sell-through rate (% of services that get quote requests → orders)
- Quote-to-order conversion rate
- Average response time (lab provides quote)
- Repeat lab usage

**Demand-Side Liquidity:**
- Quote request-to-order rate
- Search-to-quote-request rate (if search exists)
- Time-to-quote fulfillment
- Repeat client usage

**Financial Metrics:**
- GMV (Gross Merchandise Value) - total transaction volume
- Take rate (% of GMV captured as revenue)
- MRR (Monthly Recurring Revenue) - if subscription component
- CAC (Customer Acquisition Cost) - cost to acquire lab or client
- LTV (Lifetime Value) - revenue per user over lifetime
- LTV:CAC ratio (should be >3x)
- Burn rate / runway (if funded)
- Break-even point (orders/month needed to cover costs)

**Scenario Modeling Template:**

| Metric | Conservative | Moderate | Aggressive |
|--------|--------------|----------|------------|
| Labs by Month 12 | 5-10 | 15-20 | 30-40 |
| Orders/month | 50 | 150-300 | 500-750 |
| Avg order value | ₱5,000 | ₱8,000 | ₱10,000 |
| GMV/month | ₱250K | ₱1.2-2.4M | ₱5-7.5M |
| Take rate | 15% | 15% | 15% |
| Monthly revenue | ₱37.5K | ₱180-360K | ₱750K-1.1M |
| Infrastructure costs | ₱7K | ₱9K | ₱15K |
| Labor costs | ₱0 (sweat) | ₱50K (part-time) | ₱200K (2 FTE) |
| Net profit/month | ₱30.5K | ₱121-301K | ₱535-885K |

**Break-Even Calculation:**
```
Fixed Costs (monthly):
- Infrastructure: ₱6,000-9,000
- Support (part-time): ₱12,500
- Marketing: ₱5,000
= ₱23,500-26,500/month

Revenue per Order:
- Avg order: ₱8,000
- Commission: 15%
- Revenue: ₱1,200/order

Break-Even Orders:
₱25,000 / ₱1,200 = ~21 orders/month

With 10 labs @ 2 orders/month/lab = 20 orders (nearly break-even)
With 15 labs @ 2 orders/month/lab = 30 orders (profitable)
```

### Competitor Pricing Benchmarks

**Similar B2B Service Marketplaces:**
- Upwork (freelance): 10-20% sliding scale
- Thumbtack (local services): 15-20% lead fees
- Fiverr (gigs): 20% commission
- 99designs (creative): 5-15% commission
- Catalant (consulting): 18-25% commission

**B2B Product Marketplaces:**
- Alibaba: Free listings, premium features ($2,000-40,000/year)
- Amazon Business: 8-15% commission
- eBay Business: 10-12% + listing fees

**Philippine Market Considerations:**
- Lower price sensitivity for B2B (not consumer)
- Relationship-driven culture (trust > price)
- Payment preferences: bank transfer, GCash (not just credit cards)
- Invoice cycles: 30-60 days typical (cash flow consideration)

---

## Strategic Recommendations

### Recommended Revenue Model: Hybrid

**Structure:**
- Base subscription: ₱2,000/month per lab
- Transaction commission: 5% of order value
- First 3 months FREE for pilot labs (validation period)

**Rationale:**

1. **Base Subscription Advantages:**
   - Covers infrastructure costs even with low volume (₱2K × 10 labs = ₱20K > ₱15K infrastructure)
   - Signals commitment from labs (skin in the game)
   - Predictable revenue for planning
   - Lower than competitor SaaS (₱3-7K typical)

2. **Low Commission Advantages:**
   - 5% feels reasonable (vs 10-20% competitors)
   - Less temptation to circumvent platform
   - Scales revenue with success (₱5K order = ₱250, ₱50K order = ₱2,500)
   - Aligns incentives (you win when they win)

3. **Combined Model Advantages:**
   - Total take rate: ₱2K + 5% = ~10-15% effective rate on ₱20-40K monthly lab GMV
   - Comparable to commission-only models but feels lighter
   - Can subsidize small labs (subscription covers platform costs, commission is upside)
   - Flexibility: Can adjust either component based on learnings

**Pricing Psychology:**
- Subscription = "cost of doing business" (like software, insurance)
- Commission = "success fee" (only pay more when earning more)
- Combined feels more fair than 15% commission alone on high-value orders

### Alternative Scenarios

**If Hybrid Feels Too Complex (Simplify):**

**Option A: Commission-Only at 12%**
- Simpler to explain and implement
- Higher than 5% but lower than 15-20% competitors
- Need to provide strong value to justify (SaaS tools, insurance, trust)
- Risk: Higher leakage temptation on high-value orders

**Option B: Subscription-Only at ₱3,500/month**
- Predictable revenue
- No payment processing needed initially
- Must prove continuous value (not just lead generation)
- Risk: Hard to justify if lab only gets 1-2 orders/month (₱3,500 fee on ₱10K revenue = 35% effective rate)

**Recommendation:** Start with Hybrid, test for 6 months, adjust based on:
- Lab feedback on pricing perception
- Platform leakage incidents
- Revenue vs cost ratio
- Comparison to market evolution

### Pricing Tiers (Future Enhancement - Year 2+)

Once product-market fit established, consider:

**Tier 1: Starter (₱1,500/month + 7% commission)**
- Up to 10 orders/month
- Basic features only
- Good for: Small specialty labs testing viability

**Tier 2: Professional (₱2,500/month + 5% commission)**
- Up to 30 orders/month
- Full feature access
- Priority support
- Good for: Established mid-size labs

**Tier 3: Enterprise (₱5,000/month + 3% commission)**
- Unlimited orders
- API access
- Dedicated account manager
- Custom integrations
- Good for: Large multi-location labs

**Why Tiered Works:**
- Price discrimination (capture more value from high-volume labs)
- Clear upgrade path (growth incentive)
- Predictable revenue scaling
- Freemium feel (low barrier to entry)

**When to Introduce:**
- After 20+ labs on platform
- Clear differentiation in usage patterns (light vs heavy users)
- Resources to support multiple tiers

---

## Go-To-Market Strategy

### Phase 1: Pilot Validation (Months 1-3)

**Goal:** Prove quotation model works with 3-5 labs, 50+ orders

**Lab Selection Criteria:**
- ISO 17025 certified ✅
- CEO has existing relationship ✅
- Mid-size (10-50 employees) - big enough for volume, small enough to move fast ✅
- Diverse categories (chemical, mechanical, environmental) - test different use cases ✅
- Process 20+ orders/month currently - enough volume to validate ✅
- Open to technology/innovation ✅
- Willing to give weekly feedback ✅

**Offer:**
- FREE for 3 months (no subscription, no commission)
- Weekly check-in calls (gather feedback)
- Priority feature requests (co-create product)
- Recognition as "founding lab partner" (marketing value)

**Outreach Strategy:**
1. **Week 1:** CEO creates shortlist of 10 potential labs (ranked by relationship strength)
2. **Week 2:** Personal outreach (phone calls, not cold emails) - "I'm building something for our industry, would love your input"
3. **Week 3:** Schedule 1-on-1 demos (show working MVP, focus on quotation workflow)
4. **Week 4:** Onboard first 3 labs, create their service listings together
5. **Ongoing:** Weekly check-ins, celebrate first orders, iterate rapidly

**Client Acquisition (Demand Side):**
- CEO's network: Existing clients from her lab work
- Lab referrals: "Tell your clients they can order through PipetGo"
- LinkedIn outreach: Target quality managers, R&D managers in manufacturing
- Industry events: Attend 1-2 relevant conferences (food safety, construction materials)
- Content marketing: Blog posts on "How to choose a testing lab" → SEO

**Success Metrics:**
- 3-5 labs onboarded and active ✅
- 50+ orders processed through platform ✅
- 10+ quotes requested and provided ✅
- 80%+ quote approval rate (quotes are reasonable) ✅
- 90%+ on-time result delivery ✅
- Labs say "we want to keep using after free period" ✅
- Zero critical platform leakage incidents ✅

**Decision Point (End of Month 3):**
- If success metrics met → Proceed to Phase 2 (paid expansion)
- If quote approval rate <50% → Pricing model issue, investigate
- If labs not engaging → Product-market fit problem, pivot or kill
- If major leakage → Value proposition insufficient, need SaaS features

### Phase 2: Paid Expansion (Months 4-6)

**Goal:** Grow to 10-15 paying labs, ₱120K+ MRR, prove unit economics

**Pricing Introduction:**
- Month 4: Announce pricing to pilot labs (2 weeks notice)
- Offer: 50% discount for next 3 months (₱1,000/month + 2.5% commission)
- Rationale: "Early adopter pricing" - rewards loyalty, eases transition

**Expansion Strategy:**

1. **Leverage Pilot Labs (Social Proof):**
   - Request testimonials (written + video if possible)
   - Case studies: "Lab X processed 30 orders in 3 months via PipetGo"
   - Referral program: ₱1,000 credit for each referred lab that signs up

2. **Industry Association Outreach:**
   - PLAO (Philippine Laboratory Accreditation Organization)
   - ICC-Philippines (International Chamber of Commerce)
   - Offer: Present at monthly meeting, sponsor event (₱10-20K)
   - Demo: Live platform walkthrough, Q&A

3. **Direct Outreach (Scalable):**
   - Scrape ISO 17025 certified lab directory (public data)
   - LinkedIn InMail campaign: Target lab owners/managers
   - Email sequence (5 emails over 3 weeks):
     - Email 1: Problem (manual quoting is painful)
     - Email 2: Solution (PipetGo workflow demo)
     - Email 3: Social proof (pilot lab testimonial)
     - Email 4: Pricing (50% discount offer expires soon)
     - Email 5: Final CTA (schedule demo call)

4. **Content Marketing (SEO - Long Game):**
   - Blog: "Complete guide to ISO 17025 lab testing in Philippines"
   - Blog: "How much does [specific test] cost?" (target buyer keywords)
   - Blog: "Top 10 certified labs for [category]" (target lab brand searches)
   - Goal: Rank for "laboratory testing Philippines" by Month 12

5. **Paid Acquisition (If Budget Allows):**
   - Google Ads: Target "laboratory testing [city/category]" (₱5-10K/month)
   - Facebook Ads: Target lab owners/quality managers (₱5K/month)
   - LinkedIn Ads: B2B targeting (₱10K/month)
   - ROI threshold: CAC < ₱5,000 (payback in 3 months at ₱2K/month subscription)

**Demand Generation:**
- Continue client outreach (now with more lab supply to showcase)
- Highlight: "Compare quotes from 10+ certified labs in 24 hours"
- PR push: "New marketplace disrupting laboratory testing industry"
- Partnership: Reach out to industry consultants (refer clients, get commission)

**Operations:**
- Hire part-time customer support (Month 5) - ₱12,500/month
- Create FAQ, onboarding docs, video tutorials
- Set up feedback loop: NPS surveys, usage analytics
- Monitor leakage: Track orders that don't close (investigate why)

**Success Metrics:**
- 10-15 paying labs by Month 6 ✅
- ₱30,000+ MRR by Month 6 ✅
- <20% churn rate (labs keep paying) ✅
- 50%+ of orders are quote-based (proves quotation model) ✅
- 100+ orders/month across platform ✅
- 2-3 labs willing to do PR testimonials ✅

**Financial Snapshot (Month 6 Target):**
```
Revenue:
- 12 labs × ₱1,000/month (discounted) = ₱12K
- 100 orders × ₱8K avg × 2.5% commission = ₱20K
= ₱32K/month

Costs:
- Infrastructure: ₱7K
- Support (part-time): ₱12.5K
- Marketing: ₱5K
= ₱24.5K/month

Net: ₱7.5K/month profit (break-even achieved!)
```

### Phase 3: Growth & Scale (Months 7-12)

**Goal:** 30-50 labs, ₱150K+ MRR, profitable, ready to raise funding or continue bootstrapping

**Scaling Playbook:**

1. **Transition Pricing (Month 7):**
   - End early adopter discounts
   - Full pricing: ₱2,000/month + 5% commission
   - Grandfather pilot labs at 50% off for Year 1 (loyalty reward)
   - Communicate: "Pricing supports platform growth, here's what's coming..." (share roadmap)

2. **Hire Sales Person (Month 7):**
   - Full-time lab onboarding specialist
   - Salary: ₱30-40K/month + commission (₱500 per lab signed)
   - CEO trains on industry specifics, hands off outreach/demos
   - KPI: 5 new labs/month

3. **Build Customer Success Function (Month 9):**
   - Part-time CS person (separate from support)
   - Focus: Proactive outreach, optimize lab performance, prevent churn
   - Salary: ₱15-20K/month
   - KPI: <15% churn, 20% increase in orders per lab

4. **Marketing Automation:**
   - Email drip campaigns (automate onboarding sequences)
   - Webinars (recorded, evergreen): "How to grow your lab business with PipetGo"
   - Retargeting ads (pixel lab website visitors)
   - Content calendar (2 blog posts/month on autopilot)

5. **Product Enhancements (Based on Feedback):**
   - Top requested features implemented
   - Mobile app (if highly requested)
   - Advanced analytics for labs (revenue tracking, customer insights)
   - Integration with lab management systems (LIMS)

6. **Geographic Expansion:**
   - Start Metro Manila → Add Cebu, Davao, Baguio (other major cities)
   - Hire local part-time ambassadors (₱5K/month + commission)
   - Test: Does model work outside capital?

7. **Category Expansion:**
   - Start with 2-3 test categories (where CEO has most connections)
   - Add new categories one at a time based on demand signals
   - Example: Start with chemical analysis → add mechanical testing → add environmental testing

**Success Metrics:**
- 30-50 labs on platform ✅
- ₱150,000+ MRR ✅
- <15% monthly churn rate ✅
- 500+ orders/month ✅
- Profitable (revenue > costs) ✅
- Unit economics validated: LTV:CAC > 3x ✅
- 2-3 labs processing 50+ orders/month (power users) ✅

**Financial Snapshot (Month 12 Target):**
```
Revenue (Conservative):
- 30 labs × ₱2,000/month = ₱60K
- 500 orders × ₱8K avg × 5% = ₱200K
= ₱260K/month MRR

Revenue (Moderate):
- 40 labs × ₱2,000/month = ₱80K
- 750 orders × ₱8K avg × 5% = ₱300K
= ₱380K/month MRR

Costs:
- Infrastructure: ₱9K
- Sales (FT): ₱40K
- Support (FT): ₱25K
- CS (PT): ₱20K
- Marketing: ₱20K
= ₱114K/month

Net Profit:
- Conservative: ₱146K/month (₱1.75M/year)
- Moderate: ₱266K/month (₱3.2M/year)
```

**Decision Point (End of Month 12):**

**Option A: Continue Bootstrapping**
- If profitable and growing steadily
- Maintain control, no dilution
- Slower growth but sustainable
- Hire conservatively, reinvest profits

**Option B: Raise Seed Funding**
- If product-market fit proven and ready to scale faster
- Target: ₱5-10M seed round (₱10-20M valuation)
- Use for: Hire tech team (replace solo CTO grind), sales team, marketing
- Dilution: 20-30% to investors
- Criteria: Growing 20%+ MoM, strong unit economics, clear path to ₱10M+ ARR

**Option C: Strategic Partnership**
- If major lab chain or industry player wants in
- Could be acquisition offer or partnership
- Evaluate: Does it accelerate mission or compromise vision?

---

## Platform Leakage Prevention Plan

### Year 1 Tactics (Essential)

**1. Make Platform Indispensable:**
- Quote management: Labs love not having to write manual quotes in email
- Sample tracking: Clients love seeing "Sample received, testing in progress"
- Automated reminders: "Quote expired, need to respond" (saves lab follow-up time)
- Review system: Labs need good reviews to attract more clients (only through platform)
- Analytics: "You earned ₱50K this month via PipetGo" (shows value)

**2. Insurance/Trust Mechanisms:**
- Sample damage protection: If sample lost/damaged, platform mediates
- Payment protection: Escrow for high-value orders (client pays, released after results)
- Dispute resolution: Platform investigates complaints, penalizes bad actors
- Certification verification: Platform verifies ISO 17025 status (trust signal)

**3. Contract Terms (Enforce Gently):**
- Terms of Service: Circumventing platform violates agreement
- Consequence: Account suspension (rarely enforce, mostly deterrent)
- Communicate: "Commission keeps platform running, benefits everyone"
- Positive framing: "We're partners in growing your business"

**4. Monitor & Respond:**
- Track: Orders that get quotes but don't convert (possible leakage)
- Investigate: Why didn't they book? (reach out, learn)
- Metrics: If leakage >10%, value proposition insufficient
- Iterate: Add features that make staying on platform easier

### Year 2+ Tactics (Advanced)

**5. SaaS Feature Expansion:**
- CRM for labs: Manage all clients (not just PipetGo ones) on platform
- Invoicing: Generate invoices for any order (not just platform)
- Reporting: Track all revenue streams (platform becomes business hub)
- Goal: Platform is lab's operating system, not just lead gen tool

**6. Network Effects:**
- More labs = more client choice = more clients = more valuable to labs
- Chicken-and-egg solved = flywheel effect
- Switching cost: Leaving platform means losing access to network

**7. Financial Incentives:**
- Volume discounts: 50+ orders/month = reduced commission to 3%
- Loyalty bonuses: 12 months no churn = 1 month free
- Referral credits: Bring new lab = ₱1,000 credit

**8. Community Building:**
- Annual PipetGo conference: Labs network, share best practices
- Online forum: Labs help each other (builds loyalty)
- Success stories: Celebrate top performers (recognition)
- Advisory board: Top labs help shape product roadmap (ownership)

### Red Flags to Watch

**Warning Signs of Leakage:**
- Quote-to-order conversion drops below 60%
- Orders cluster with 1-2 labs (not distributed)
- Clients stop responding after first order
- Labs ask to share contact info frequently
- Orders complete but no payment processed

**Response Protocol:**
1. Reach out to lab/client: "Is everything okay? Can we help?"
2. Identify gap: What value are they not getting?
3. Add feature or change pricing if pattern emerges
4. Last resort: Enforce contract terms (rarely needed if value is high)

---

## Financial Models & Projections

### Scenario 1: Conservative (Slow Growth)

**Assumptions:**
- Pilot validation takes 4 months (vs 3)
- Expansion slower: 1 new lab/month in Phase 2
- Low initial order volume: 10 orders/lab/month
- Moderate churn: 15%/month in first 6 months

**Month-by-Month Projections:**

| Month | Labs | Orders | GMV    | Revenue   | Costs | Profit |
| ----- | ---- | ------ | ------ | --------- | ----- | ------ |
| 1-3   | 3    | 30     | ₱240K  | ₱0 (free) | ₱7K   | -₱7K   |
| 4     | 4    | 40     | ₱320K  | ₱8K       | ₱7K   | ₱1K    |
| 5     | 5    | 50     | ₱400K  | ₱10K      | ₱20K  | -₱10K  |
| 6     | 6    | 60     | ₱480K  | ₱14K      | ₱25K  | -₱11K  |
| 7     | 7    | 70     | ₱560K  | ₱19K      | ₱25K  | -₱6K   |
| 8     | 8    | 85     | ₱680K  | ₱24K      | ₱25K  | -₱1K   |
| 9     | 9    | 100    | ₱800K  | ₱30K      | ₱30K  | ₱0     |
| 10    | 10   | 115    | ₱920K  | ₱36K      | ₱30K  | ₱6K    |
| 11    | 11   | 130    | ₱1.04M | ₱42K      | ₱30K  | ₱12K   |
| 12    | 12   | 145    | ₱1.16M | ₱49K      | ₱30K  | ₱19K   |

**Year 1 Totals:**
- Labs: 12 active
- GMV: ₱7.6M
- Revenue: ₱252K
- Costs: ₱256K
- Net: -₱4K (nearly break-even)

**Key Takeaways:**
- Break-even by Month 9
- Requires patience and low burn rate
- Validates model but doesn't generate significant profit Year 1
- Good if: No external pressure, building sustainably, learning market
- Risk: Slow growth may lose momentum, competitors could enter

**Year 2 Projection (Conservative):**
- Grow to 25 labs by Month 24
- 400 orders/month
- ₱3.2M GMV/month
- ₱210K revenue/month (₱50K subscription + ₱160K commission)
- ₱100K costs/month (team of 3)
- ₱110K profit/month (₱1.3M/year)

---

### Scenario 2: Moderate (Base Case)

**Assumptions:**
- Pilot succeeds in 3 months as planned
- Expansion: 2 new labs/month in Phase 2, 3 new/month in Phase 3
- Healthy order volume: 15-20 orders/lab/month
- Low churn: 10%/month initially, 5% by Month 12

**Month-by-Month Projections:**

| Month | Labs | Orders | GMV | Revenue | Costs | Profit |
|-------|------|--------|-----|---------|-------|--------|
| 1-3 | 5 | 75 | ₱600K | ₱0 (free) | ₱7K | -₱7K |
| 4 | 6 | 90 | ₱720K | ₱15K | ₱20K | -₱5K |
| 5 | 8 | 120 | ₱960K | ₱27K | ₱25K | ₱2K |
| 6 | 10 | 150 | ₱1.2M | ₱40K | ₱25K | ₱15K |
| 7 | 13 | 200 | ₱1.6M | ₱66K | ₱60K | ₱6K |
| 8 | 16 | 250 | ₱2M | ₱92K | ₱70K | ₱22K |
| 9 | 19 | 310 | ₱2.48M | ₱124K | ₱80K | ₱44K |
| 10 | 23 | 380 | ₱3.04M | ₱162K | ₱90K | ₱72K |
| 11 | 27 | 460 | ₱3.68M | ₱208K | ₱100K | ₱108K |
| 12 | 32 | 550 | ₱4.4M | ₱264K | ₱110K | ₱154K |

**Year 1 Totals:**
- Labs: 32 active
- Total GMV: ₱21M
- Total Revenue: ₱998K (~₱1M)
- Total Costs: ₱587K
- Net Profit: ₱411K

**Monthly Averages (Q4):**
- ₱3.7M GMV
- ₱211K revenue
- ₱100K costs
- ₱111K profit

**Key Metrics:**
- Average order value: ₱8,000
- Orders per lab per month: 17
- Revenue per lab: ₱31K/year (₱2K sub × 12 + commission)
- Take rate: ~12% effective (₱2K fixed + 5% variable)

**Key Takeaways:**
- Break-even by Month 5
- Strong profit by Q4 (₱154K/month)
- Attractive for seed funding (₱10M valuation reasonable)
- Good if: Execution solid, network effects kicking in
- Achievable with focused effort and CEO's industry connections

**Year 2 Projection (Moderate):**
- Grow to 60 labs by Month 24
- 1,000 orders/month
- ₱8M GMV/month
- ₱520K revenue/month (₱120K sub + ₱400K commission)
- ₱200K costs/month (team of 5-6)
- ₱320K profit/month (₱3.8M/year)

---

### Scenario 3: Aggressive (High Growth)

**Assumptions:**
- Viral word-of-mouth in industry
- Competitors enter but validate market (rising tide lifts all boats)
- Expansion: 3-5 new labs/month consistently
- High order volume: 25+ orders/lab/month
- Very low churn: 5%/month from start (strong retention)
- Paid marketing investment (₱20K/month from Month 4)

**Month-by-Month Projections:**

| Month | Labs | Orders | GMV | Revenue | Costs | Profit |
|-------|------|--------|-----|---------|-------|--------|
| 1-3 | 8 | 200 | ₱1.6M | ₱0 (free) | ₱10K | -₱10K |
| 4 | 11 | 275 | ₱2.2M | ₱44K | ₱40K | ₱4K |
| 5 | 15 | 375 | ₱3M | ₱75K | ₱50K | ₱25K |
| 6 | 20 | 500 | ₱4M | ₱120K | ₱60K | ₱60K |
| 7 | 26 | 650 | ₱5.2M | ₱182K | ₱100K | ₱82K |
| 8 | 33 | 825 | ₱6.6M | ₱256K | ₱120K | ₱136K |
| 9 | 41 | 1,025 | ₱8.2M | ₱344K | ₱140K | ₱204K |
| 10 | 50 | 1,250 | ₱10M | ₱450K | ₱160K | ₱290K |
| 11 | 60 | 1,500 | ₱12M | ₱570K | ₱180K | ₱390K |
| 12 | 70 | 1,750 | ₱14M | ₱700K | ₱200K | ₱500K |

**Year 1 Totals:**
- Labs: 70 active
- Total GMV: ₱67M
- Total Revenue: ₱2.74M
- Total Costs: ₱1.16M
- Net Profit: ₱1.58M

**Monthly Averages (Q4):**
- ₱12M GMV
- ₱573K revenue
- ₱180K costs
- ₱393K profit

**Key Takeaways:**
- Break-even by Month 4
- Massive profit by Q4 (₱500K/month)
- Likely attract VC interest (₱50M+ valuation)
- Good if: Lightning in a bottle, perfect execution, lucky timing
- Risk: Unsustainable growth (quality issues, operational chaos)

**Year 2 Projection (Aggressive):**
- Grow to 150 labs by Month 24
- 3,500+ orders/month
- ₱28M GMV/month
- ₱1.7M revenue/month (₱300K sub + ₱1.4M commission)
- ₱600K costs/month (team of 15-20)
- ₱1.1M profit/month (₱13M/year)

---

### Break-Even Analysis Across Scenarios

**Fixed Cost Structure:**

| Cost Category | Monthly | Annual | Notes |
|---------------|---------|--------|-------|
| **Infrastructure** | ₱7-9K | ₱84-108K | Hosting, DB, email, domain |
| **Support (PT)** | ₱12-15K | ₱144-180K | Part-time from Month 5 |
| **Sales (FT)** | ₱35-40K | ₱420-480K | Full-time from Month 7 |
| **CS (PT)** | ₱15-20K | ₱180-240K | Part-time from Month 9 |
| **Marketing** | ₱10-20K | ₱120-240K | Ads, content, events |
| **Total (Ramp)** | ₱7K → ₱100K | - | Grows with scale |

**Revenue per Order:**

| Order Value | Commission (5%) | With Subscription | Total Take Rate |
|-------------|-----------------|-------------------|-----------------|
| ₱5,000 | ₱250 | ₱2,000/mo ÷ orders | 10-15% effective |
| ₱8,000 | ₱400 | ₱2,000/mo ÷ orders | 10-12% effective |
| ₱15,000 | ₱750 | ₱2,000/mo ÷ orders | 8-10% effective |
| ₱30,000 | ₱1,500 | ₱2,000/mo ÷ orders | 7-8% effective |

**Break-Even Orders per Month:**

| Scenario | Fixed Costs | Revenue/Order | Orders Needed |
|----------|-------------|---------------|---------------|
| **Month 3** | ₱7K | ₱0 (free pilot) | N/A (burn) |
| **Month 6** | ₱25K | ₱400 avg | 63 orders |
| **Month 9** | ₱60K | ₱600 avg | 100 orders |
| **Month 12** | ₱100K | ₱800 avg | 125 orders |

**With 10 labs @ 15 orders/month = 150 orders** → Profitable by Month 9 in moderate scenario ✅

---

### Unit Economics Deep Dive

**Customer Acquisition Cost (CAC):**

**Lab Acquisition:**
- Pilot phase (CEO personal outreach): ₱5K time value per lab
- Phase 2 (direct sales): ₱8K per lab (sales salary ÷ labs acquired)
- Phase 3 (marketing + sales): ₱12K per lab (includes ad spend)
- Average blended CAC: ₱10K per lab

**Client Acquisition:**
- Organic (lab referrals): ₱0 direct cost
- Content marketing: ₱2K per client (amortized content creation)
- Paid ads: ₱500-1,500 per client (PH B2B ad costs)
- Average CAC: ₱1K per client (early stage, mostly organic)

**Lifetime Value (LTV):**

**Lab LTV:**
```
Average lab lifespan: 24 months (assumed, need to validate)
Monthly subscription: ₱2,000
Monthly commission: 15 orders × ₱8K × 5% = ₱6,000
Total monthly revenue: ₱8,000
LTV = ₱8,000 × 24 months = ₱192,000
```

**Client LTV:**
```
Average client lifespan: 12 months (assumed)
Orders per month: 2
Order value: ₱8,000
Commission: ₱8,000 × 5% = ₱400
LTV = ₱400 × 2 orders × 12 months = ₱9,600
```

**LTV:CAC Ratios:**

| User Type | LTV | CAC | Ratio | Health |
|-----------|-----|-----|-------|--------|
| **Lab** | ₱192K | ₱10K | 19.2x | ✅ Excellent |
| **Client** | ₱9.6K | ₱1K | 9.6x | ✅ Excellent |

**Benchmark:** LTV:CAC > 3x is healthy, >5x is excellent

**Payback Period:**

**Lab payback:**
```
CAC: ₱10,000
Monthly revenue: ₱8,000
Payback: 10,000 ÷ 8,000 = 1.25 months ✅
```

**Client payback:**
```
CAC: ₱1,000
Monthly revenue: ₱800
Payback: 1,000 ÷ 800 = 1.25 months ✅
```

**Benchmark:** <12 months payback is healthy, <6 months is excellent

**Key Insight:** Unit economics extremely favorable if assumptions hold. Main risk is validating:
1. Lab retention (do they stay 24+ months?)
2. Order frequency (do clients order 2x/month consistently?)
3. CAC accuracy (can we acquire labs for ₱10K in Phase 2-3?)

---

### Sensitivity Analysis

**What if assumptions are wrong? How does it affect break-even?**

**Variable 1: Average Order Value**

| Avg Order | Commission (5%) | Orders to Break-Even (Month 12) |
|-----------|-----------------|----------------------------------|
| ₱5,000 | ₱250 | 200 orders/month |
| ₱8,000 | ₱400 | 125 orders/month |
| ₱12,000 | ₱600 | 83 orders/month |
| ₱15,000 | ₱750 | 67 orders/month |

**Insight:** Higher-value tests (environmental, specialty chemical) reduce break-even point significantly.

**Variable 2: Commission Rate**

| Commission | Revenue per ₱8K Order | Orders to Break-Even (Month 12) |
|------------|------------------------|----------------------------------|
| 3% | ₱240 | 208 orders/month |
| 5% | ₱400 | 125 orders/month |
| 7% | ₱560 | 89 orders/month |
| 10% | ₱800 | 63 orders/month |

**Insight:** Even at 3% commission, break-even achievable with 25-30 labs @ 8 orders/month/lab.

**Variable 3: Churn Rate**

| Monthly Churn | Labs After 12 Months (Started with 40) | Revenue Impact |
|---------------|-----------------------------------------|----------------|
| 5% | 27 active labs | -33% revenue |
| 10% | 18 active labs | -55% revenue |
| 15% | 13 active labs | -67% revenue |
| 20% | 9 active labs | -78% revenue |

**Insight:** Churn is CRITICAL. If >10%/month, need to fix product-market fit before scaling.

**Variable 4: Orders per Lab per Month**

| Orders/Lab | 20 Labs Revenue | 40 Labs Revenue | Break-Even Labs (₱100K cost) |
|------------|-----------------|-----------------|------------------------------|
| 5 | ₱80K | ₱160K | 25 labs |
| 10 | ₱120K | ₱240K | 17 labs |
| 15 | ₱160K | ₱320K | 13 labs |
| 20 | ₱200K | ₱400K | 10 labs |

**Insight:** Order frequency per lab matters more than total lab count for early profitability.

**Worst Case Scenario:**
- Low order value: ₱5K
- Low commission: 3%
- High churn: 15%/month
- Low frequency: 5 orders/lab/month

**Result:** Break-even requires 60+ active labs, takes 18+ months to achieve.

**Best Case Scenario:**
- High order value: ₱12K
- Optimal commission: 7%
- Low churn: 5%/month
- High frequency: 20 orders/lab/month

**Result:** Break-even with 8-10 active labs, achievable Month 6.

---

## Risk Assessment & Mitigation

### Critical Risks

**Risk 1: Platform Leakage (Probability: HIGH, Impact: HIGH)**

**Description:**
Labs and clients connect on platform but transact off-platform after first successful order. This is the #1 risk in service marketplaces.

**Warning Signs:**
- Quote-to-order conversion <60%
- Orders don't repeat with same lab-client pairs
- Labs ask for direct contact info frequently
- Revenue per lab plateaus after Month 3

**Mitigation Strategies:**
1. **Build indispensable SaaS tools** (sample tracking, analytics, invoicing)
2. **Strong contract terms** (but enforce gently, trust-first approach)
3. **Insurance/escrow** (value-add that's hard to replicate off-platform)
4. **Reviews only on platform** (need to complete transaction to give/receive review)
5. **Monitor closely** and iterate if leakage >10%

**Contingency Plan:**
If leakage >15% in first 6 months:
- Rapid user interviews (why going off-platform?)
- Add top 3 requested features ASAP
- Consider temporary commission reduction to 3% while improving value
- Worst case: Pivot to subscription-only model (less revenue but sustainable)

---

**Risk 2: Chicken-and-Egg Problem (Probability: MEDIUM, Impact: HIGH)**

**Description:**
Can't attract labs without clients, can't attract clients without labs. Platform stalls at 2-3 labs and low activity.

**Warning Signs:**
- <50 orders total in first 3 months
- Labs complain "not enough clients"
- Clients complain "not enough lab selection"
- Pilot labs lose interest, stop logging in

**Mitigation Strategies:**
1. **Start hyper-focused** (1-2 test categories, Metro Manila only)
2. **CEO's network** (personally bring first 10 clients)
3. **Labs refer clients** (incentivize with credits)
4. **Do unscalable things** (manual matchmaking initially)
5. **Fake it till you make it** (aggregate lab listings even before partnerships)

**Contingency Plan:**
If <50 orders by Month 3:
- Pivot to single-lab pilot (prove model with 1 lab, scale later)
- CEO works as "concierge" (manually match every request)
- Delay Phase 2 expansion until liquidity proven
- Consider acqui-hiring by established lab (exit strategy)

---

**Risk 3: Low Order Frequency (Probability: MEDIUM, Impact: MEDIUM)**

**Description:**
Labs get 1-2 orders/month instead of projected 15-20. Kills unit economics.

**Warning Signs:**
- Average orders/lab/month <5 by Month 6
- Labs say "not enough volume to justify subscription"
- 80%+ of labs are "zombie" (pay but don't use actively)

**Mitigation Strategies:**
1. **Focus on high-frequency test categories** (routine QC testing, not one-off R&D)
2. **Target industries with repeat needs** (food manufacturing, construction materials)
3. **Encourage "standing orders"** (monthly recurring tests for clients)
4. **Marketing to clients** (more clients = more orders distributed to labs)
5. **Tiered pricing** (lower subscription for low-volume labs)

**Contingency Plan:**
If avg orders/lab <8 by Month 9:
- Introduce freemium tier (free up to 5 orders/month, paid after)
- Reduce subscription to ₱1,000/month (still covers infrastructure)
- Increase commission to 7-10% (shift revenue model)
- Focus on client acquisition over lab acquisition

---

**Risk 4: High Customer Acquisition Cost (Probability: MEDIUM, Impact: MEDIUM)**

**Description:**
Costs ₱20K+ to acquire each lab (vs projected ₱10K), kills LTV:CAC ratio.

**Warning Signs:**
- Sales cycle >3 months per lab
- Conversion rate <10% from demo to signup
- Need expensive ads/sponsorships to get attention
- CEO spending >40 hours/month on sales calls

**Mitigation Strategies:**
1. **Leverage CEO's network** (warm intros, not cold outreach)
2. **Industry association partnerships** (access to members at low cost)
3. **Referral program** (₱1-2K credit per referral)
4. **Content marketing** (organic traffic, low CAC)
5. **Pilot lab testimonials** (social proof reduces sales friction)

**Contingency Plan:**
If CAC >₱15K consistently:
- Pause new lab acquisition (focus on retention/activation of existing)
- Double down on organic channels only
- Increase LTV by improving retention (extend from 24 to 36+ months)
- Consider "land and expand" (start with 1 lab, add more departments/locations later)

---

**Risk 5: Technical Debt / CTO Burnout (Probability: HIGH, Impact: HIGH)**

**Description:**
Solo CTO (you) burns out before product-market fit. 800 hours is a LOT with ADHD/autism.

**Warning Signs:**
- Development stalls for weeks
- Bugs pile up, quality suffers
- Missing promised features to pilot labs
- CTO disengaged, not excited about project

**Mitigation Strategies:**
1. **Phased commitment** (300h MVP first, evaluate before full 800h)
2. **ADHD-friendly workflow** (small tasks, frequent breaks, flexible schedule)
3. **AI assistance** (Claude Code for scaffolding, GPT-4 for docs)
4. **Outsource non-core** (e.g., email template design, basic support)
5. **CEO handles all non-tech** (sales, support, lab relationships)

**Contingency Plan:**
If CTO burnout imminent:
- Pause development, deploy what's working (even if incomplete)
- Hire freelance dev (₱50-80K for 2-week sprint) to finish critical features
- CEO does more manual operations (compensate for missing tech)
- Renegotiate equity if additional capital investment needed
- Last resort: Acquihire by dev agency (exit with some return)

---

**Risk 6: Regulatory / Compliance Issues (Probability: LOW, Impact: HIGH)**

**Description:**
Government introduces regulations affecting online lab marketplaces, payment processing, or data handling.

**Warning Signs:**
- FDA/DOH issues guidance on lab service platforms
- Tax authorities question commission structure
- Data privacy complaints (NPC involvement)
- Lab accreditation bodies object to marketplace model

**Mitigation Strategies:**
1. **Legal review early** (₱30K for startup lawyer, incorporation, T&Cs)
2. **Transparency with labs** (we're facilitators, not lab ourselves)
3. **Data protection compliance** (GDPR-style consent, secure storage)
4. **Industry association engagement** (get buy-in, not opposition)
5. **Be proactive** (reach out to regulators, explain model before issues arise)

**Contingency Plan:**
If regulatory problem emerges:
- Consult specialized attorney immediately
- Temporary halt new signups if needed (don't scale into illegal activity)
- Pivot model if necessary (e.g., become "SaaS for labs" vs "marketplace")
- Work with industry association on advocacy

---

**Risk 7: Competitor Entry (Probability: MEDIUM, Impact: MEDIUM)**

**Description:**
Well-funded competitor launches similar platform, undercuts pricing, steals labs/clients.

**Warning Signs:**
- International platform (Science Exchange, etc.) localizes to PH
- Philippine tech company (Kalibrr, Booky, etc.) enters lab services vertical
- Large lab chain builds own marketplace (vertical integration)
- VC-funded startup raises ₱50M for same model

**Mitigation Strategies:**
1. **Move fast** (get 30+ labs before competitor emerges)
2. **Network effects** (once enough labs, defensible moat)
3. **Relationship advantage** (CEO's 16 years industry experience hard to replicate)
4. **Local focus** (PH-specific features: GCash, Tagalog, local logistics)
5. **Community** (build loyal base, not transactional relationships)

**Contingency Plan:**
If well-funded competitor enters:
- **Don't panic** (market is big enough for 2-3 players initially)
- **Differentiate** (focus on niche they ignore, e.g., small specialty labs)
- **Improve retention** (make switching costly via SaaS lock-in)
- **Consider partnership** (merge, acqui-hire, or white-label deal)
- **Emphasize trust** (we're lab people, not tech bros)

---

### Risk Probability-Impact Matrix

```
                    HIGH IMPACT
                    
    High Prob   │ Platform Leakage │ CTO Burnout
                │─────────────────────────────────
    Med Prob    │ Chicken-and-Egg  │ High CAC
                │ Low Order Freq   │ Competitor
                │─────────────────────────────────
    Low Prob    │                  │ Regulatory
                
                    LOW IMPACT      HIGH IMPACT
```

**Priority Focus:**
1. Platform Leakage (HIGH/HIGH) - Build SaaS value from Day 1
2. CTO Burnout (HIGH/HIGH) - Phased approach, protect mental health
3. Chicken-and-Egg (MED/HIGH) - Start small, CEO's network, do unscalable things
4. Low Order Frequency (MED/MED) - Target high-frequency test categories
5. High CAC (MED/MED) - Leverage organic channels, referrals

---

## Implementation Roadmap

### Pre-Launch (Weeks 1-4)

**Week 1: Alignment & Planning**
- [ ] CEO and CTO review this business model document together
- [ ] Make key decisions:
  - [ ] Revenue model: Hybrid (₱2,000/month + 5%) ✅ or alternative?
  - [ ] Initial pricing: Free 3 months for pilots ✅
  - [ ] Pilot lab target: 3-5 labs ✅
  - [ ] MVP scope: Quotation system refactor only ✅
- [ ] Sign founder agreement (equity, vesting, roles)
- [ ] Create pilot lab shortlist (CEO: 10 labs ranked by relationship strength)

**Week 2: Quotation System Refactor - Database**
- [ ] Add `pricing_mode` enum to Prisma schema (FIXED | QUOTE_REQUIRED | HYBRID)
- [ ] Add `QUOTE_REQUESTED`, `QUOTE_PROVIDED` statuses to OrderStatus enum
- [ ] Run database migration
- [ ] Update seed data (mix of FIXED and QUOTE_REQUIRED services)
- [ ] Test in Prisma Studio

**Week 3: Quotation System Refactor - Backend**
- [ ] Update order creation API (don't auto-populate quotedPrice)
- [ ] Create POST `/api/orders/[id]/quote` endpoint (lab provides quote)
- [ ] Create POST `/api/orders/[id]/approve-quote` endpoint (client approves)
- [ ] Write unit + integration tests for quote logic
- [ ] Verify authorization (only lab can quote own orders, only client can approve own orders)

**Week 4: Quotation System Refactor - Frontend**
- [ ] Update service cards (conditional pricing display: fixed price vs "Request Quote")
- [ ] Update order page (show "Request Quote" for quote-required services)
- [ ] Build lab quote input UI (dashboard: enter quote amount + notes, send button)
- [ ] Build client quote approval UI (dashboard: show quote, approve/decline buttons)
- [ ] Test complete workflow end-to-end (client request → lab quote → client approve → order proceeds)

**Deliverable:** Working MVP with quotation-first workflow ✅

---

### Phase 1: Pilot Validation (Months 1-3)

**Month 1: Onboarding & Training**

**Week 1: Lab Outreach**
- [ ] CEO calls top 5 labs from shortlist (personal relationships, not cold)
- [ ] Pitch: "Building something for our industry, need your expertise"
- [ ] Offer: Free for 3 months + shape product roadmap
- [ ] Schedule: 1-on-1 demo meetings (in-person or video)

**Week 2: First Demos**
- [ ] Demo 1: Lab A (chemical analysis focus)
- [ ] Demo 2: Lab B (mechanical testing focus)
- [ ] Demo 3: Lab C (environmental testing focus)
- [ ] Collect feedback: What resonates? What's confusing?
- [ ] Adjust pitch based on learnings

**Week 3: Initial Onboarding**
- [ ] Sign up Labs A, B, C
- [ ] Create accounts, walk through dashboard
- [ ] Help them create first 5-10 service listings
- [ ] Verify: All services properly categorized, descriptions clear
- [ ] Screenshot their profiles for marketing

**Week 4: Client Acquisition Begins**
- [ ] CEO identifies 10 potential clients from her network
- [ ] Outreach: "We've launched a new testing marketplace, would you try it?"
- [ ] Offer: Free quote requests (no risk)
- [ ] Goal: Get 5 clients to submit first quote requests

**Month 1 Target:** 3 labs onboarded, 5 quote requests submitted ✅

---

**Month 2: Iteration & Activity**

**Week 1: First Orders**
- [ ] Labs provide quotes for pending requests
- [ ] Monitor: Response time, quote amounts (are they reasonable?)
- [ ] Clients receive quotes, some approve
- [ ] Celebrate: First order placed through platform! 🎉
- [ ] Document: Case study for marketing

**Week 2: Feedback Loop**
- [ ] Call each lab: "How's it going? What do you need?"
- [ ] Common pain points? (e.g., "quote form is clunky", "need mobile app")
- [ ] Prioritize: Which feedback is critical vs nice-to-have?
- [ ] CTO: Fix top 3 issues (small UI improvements, bug fixes)

**Week 3: Expand Activity**
- [ ] CEO brings 5 more clients
- [ ] Labs start to see repeat orders
- [ ] Goal: 20+ orders in the platform
- [ ] Monitor: Are orders distributed across labs or clustered?

**Week 4: Onboard Labs 4-5**
- [ ] Reach out to next 2 labs on shortlist
- [ ] Leverage social proof: "Labs A, B, C are already on, here's what they're saying..."
- [ ] Onboard Labs D and E (different categories or regions for diversity)
- [ ] Now have 5 labs total

**Month 2 Target:** 5 labs active, 25+ orders processed ✅

---

**Month 3: Validation & Metrics**

**Week 1: Data Analysis**
- [ ] Pull metrics:
  - Quote-to-order conversion rate
  - Average quote response time
  - Client repeat rate
  - Lab satisfaction (NPS survey)
- [ ] Analyze: Is liquidity happening? Are labs happy? Are clients happy?

**Week 2: Address Issues**
- [ ] If conversion rate low (<60%): Why are clients declining quotes?
- [ ] If response time slow (>48hrs): Do labs need notifications/reminders?
- [ ] If satisfaction low (<7/10): What's the biggest complaint?
- [ ] CTO: Fix critical issues before asking labs to pay

**Week 3: Pricing Conversation**
- [ ] Call each pilot lab individually
- [ ] Explain: "Free period ending Month 4, here's our pricing..."
- [ ] Pricing: ₱1,000/month + 2.5% commission for next 3 months (50% off)
- [ ] Ask: "Would you continue using at this price?"
- [ ] Listen: Objections? Hesitations?

**Week 4: Go/No-Go Decision**
- [ ] Review success metrics:
  - ✅ 50+ orders processed?
  - ✅ 80%+ quote approval rate?
  - ✅ 90%+ on-time delivery?
  - ✅ 3+ labs willing to pay?
- [ ] **GO:** Proceed to Phase 2 (paid expansion)
- [ ] **NO-GO:** Diagnose problem, iterate, extend pilot

**Month 3 Target:** 50+ orders, validated model, 3+ labs willing to pay ✅

---

### Phase 2: Paid Expansion (Months 4-6)

**Month 4: First Revenue**

**Week 1: Pricing Activation**
- [ ] Announce pricing to pilot labs (2 weeks notice)
- [ ] Send invoice: ₱1,000 for Month 4 (50% early adopter discount)
- [ ] Payment method: Bank transfer or GCash (easiest for PH market)
- [ ] Track: Who pays immediately? Who needs follow-up?
- [ ] If lab churns: Exit interview (why leaving? what would make you stay?)

**Week 2: Hire Part-Time Support**
- [ ] Post job: "Part-time customer support for lab tech platform"
- [ ] Requirements: Familiar with laboratory terminology, good English/Tagalog
- [ ] Salary: ₱12,500/month (~20 hours/week)
- [ ] Onboard: Teach them platform, create FAQ, set up ticketing system
- [ ] Goal: Free up CEO time for sales and strategy

**Week 3: Expansion Outreach Begins**
- [ ] CEO identifies next 10 labs (outside pilot circle)
- [ ] Prepare pitch deck (5 slides):
  - Slide 1: Problem (manual quoting is painful)
  - Slide 2: Solution (PipetGo demo screenshots)
  - Slide 3: Social proof (pilot lab testimonials)
  - Slide 4: Pricing (₱1,000/month + 2.5% for 3 months)
  - Slide 5: CTA (schedule demo)
- [ ] Send personalized emails (not mass blast)
- [ ] Follow up with LinkedIn messages

**Week 4: First Expansion Demos**
- [ ] Demo with Labs F, G, H (next 3 on list)
- [ ] Close: 1-2 new labs signed up
- [ ] Now have 6-7 labs total (5 pilot + 1-2 new)
- [ ] Track: Sales metrics (demo-to-signup conversion, objections heard)

**Month 4 Target:** ₱5-7K MRR, 6-7 total labs, support hire complete ✅

---

**Month 5: Scaling Operations**

**Week 1: Content Marketing Launch**
- [ ] Publish blog post: "Complete guide to ISO 17025 lab testing in Philippines"
- [ ] SEO target: "laboratory testing Philippines" (long-term traffic)
- [ ] Promote on LinkedIn (CEO's network)
- [ ] Post in industry Facebook groups (if allowed)

**Week 2: Industry Association Engagement**
- [ ] CEO contacts PLAO (Philippine Laboratory Accreditation Org)
- [ ] Ask: Can we present at next monthly meeting?
- [ ] Offer: Free membership for attendees (first 3 months)
- [ ] Alternative: Sponsor event (₱10-20K for visibility)

**Week 3: Direct Outreach Campaign**
- [ ] Scrape ISO 17025 certified lab directory (public data)
- [ ] Identify 50 qualified labs (mid-size, active website)
- [ ] CEO sends personalized LinkedIn connection requests
- [ ] Message: "Fellow lab professional here, building something for our industry..."
- [ ] Goal: Book 5 more demos

**Week 4: Onboard Labs 8-10**
- [ ] Close 2-3 more labs from demos
- [ ] Onboard them (faster now with support person helping)
- [ ] Total: 8-10 active labs
- [ ] Calculate: Monthly burn rate, runway, path to profitability

**Month 5 Target:** ₱12-18K MRR, 8-10 total labs ✅

---

**Month 6: Proving Unit Economics**

**Week 1: Client Acquisition Experiment**
- [ ] Test Google Ads (₱5K budget)
  - Keywords: "laboratory testing manila", "ISO 17025 certified"
  - Landing page: Service catalog + quote request form
  - Track: Cost per lead, lead-to-order conversion
- [ ] Measure: CAC (how much to acquire 1 client?)
- [ ] Compare to organic channels

**Week 2: Referral Program Launch**
- [ ] Build referral system: Labs get ₱1,000 credit per referred lab
- [ ] Announce to existing labs
- [ ] Promote: "Know another lab that could benefit? Refer them!"
- [ ] Track: How many referrals? Conversion rate?

**Week 3: Mid-Phase Review**
- [ ] Pull data:
  - MRR: ₱X
  - Number of labs: X
  - Orders/month: X
  - Churn rate: X%
  - LTV:CAC ratio: X
- [ ] Analyze: Are we on track for Month 12 goals?
- [ ] Adjust: If metrics off, what needs to change?

**Week 4: Prepare for Phase 3**
- [ ] If metrics healthy: Plan sales hire for Month 7
- [ ] Draft job description: "Lab Partnerships Manager"
- [ ] Budget: ₱35-40K/month salary + ₱500/lab commission
- [ ] Goal: Hire by end of Month 6, start Month 7

**Month 6 Target:** 10-15 total labs, ₱30-40K MRR, <15% churn ✅

**Phase 2 Success Criteria:**
- [ ] 10+ paying labs ✅
- [ ] ₱30K+ MRR ✅
- [ ] 100+ orders/month ✅
- [ ] <20% churn rate ✅
- [ ] Positive unit economics (LTV:CAC >3x) ✅
- [ ] Break-even or near break-even ✅

**Decision Point:**
- **If success criteria met:** Proceed to Phase 3 (aggressive growth)
- **If close but not quite:** Extend Phase 2 by 1-2 months, optimize
- **If far from targets:** Diagnose core issue (product? market? execution?), iterate or pivot

---

### Phase 3: Growth & Scale (Months 7-12)

**Month 7: Sales Infrastructure**

**Week 1: Full Pricing Activation**
- [ ] Announce to all labs: Early adopter discount ending
- [ ] New pricing: ₱2,000/month + 5% commission (full rates)
- [ ] Grandfather pilot labs: They keep 50% off for Year 1 (loyalty reward)
- [ ] Communicate: "Pricing funds platform improvements, here's our roadmap..."

**Week 2: Hire Sales Person**
- [ ] Post job on LinkedIn, Kalibrr, JobStreet
- [ ] Interview candidates:
  - Must: Sales experience in B2B (2+ years)
  - Nice: Laboratory or technical industry background
  - Essential: Hustle, self-motivation, coachability
- [ ] Offer: ₱35K/month + ₱500/lab signed + ₱200/order commission
- [ ] Onboard: CEO trains on industry, product, pitch

**Week 3: Sales Training**
- [ ] Week-long onboarding:
  - Day 1: Lab industry overview (CEO teaches)
  - Day 2: Platform demo (CTO teaches)
  - Day 3: Sales pitch practice (role-play)
  - Day 4: Shadow CEO on 2 demo calls
  - Day 5: Salesperson leads demo (CEO observes)
- [ ] Give them: Shortlist of 30 warm leads (CEO's connections)
- [ ] Set goals: 3 demos/week, 5 new labs/month

**Week 4: First Sales Wins**
- [ ] Salesperson books 3 demos independently
- [ ] CEO available for backup/closing help
- [ ] Close 1-2 labs from their efforts
- [ ] Celebrate: First sales hire paying off! 🎉

**Month 7 Target:** 15-18 total labs, ₱50-70K MRR, sales hire productive ✅

---

**Month 8: Marketing Automation**

**Week 1: Email Sequences Built**
- [ ] Sequence 1: Lead nurture (5 emails over 3 weeks)
  - Email 1: Problem awareness
  - Email 2: Solution demo
  - Email 3: Social proof
  - Email 4: Pricing offer
  - Email 5: Last call CTA
- [ ] Sequence 2: Onboarding (welcome new labs)
- [ ] Sequence 3: Re-engagement (inactive labs)
- [ ] Tool: Use Mailchimp or SendGrid (already paying for)

**Week 2: Content Calendar**
- [ ] Create 3 months of blog content (outsource writing if budget allows)
  - "How much does [test type] cost in Philippines?"
  - "ISO 17025 certification guide for beginners"
  - "Top 5 mistakes when choosing a testing lab"
- [ ] Schedule: 2 posts/month
- [ ] Promote: LinkedIn, industry groups, email newsletter

**Week 3: Webinar Experiment**
- [ ] Host: "How to grow your lab business in the digital age"
- [ ] Co-host: CEO + successful pilot lab owner
- [ ] Promote: LinkedIn, email list, industry associations
- [ ] Goal: 20-30 attendees, convert 2-3 to signups
- [ ] Record: Make available on-demand

**Week 4: Paid Ads Optimization**
- [ ] If Google Ads working (CAC <₱5K): Increase budget to ₱10K/month
- [ ] If not working: Pause, try Facebook or LinkedIn instead
- [ ] Test: Different ad copy, landing pages
- [ ] Track: Conversion rate improvements

**Month 8 Target:** 20-25 total labs, ₱80-100K MRR, marketing machine running ✅

---

**Month 9: Customer Success Function**

**Week 1: Analyze Churn**
- [ ] Identify: Which labs churned in Months 4-8? Why?
- [ ] Common patterns? (low order volume? bad experience? pricing too high?)
- [ ] Exit interviews: Call churned labs, learn
- [ ] Prioritize: What would have kept them?

**Week 2: Hire Customer Success (PT)**
- [ ] Post job: "Customer Success Manager - Lab Tech Platform"
- [ ] Requirements: Proactive, analytical, customer-centric
- [ ] Salary: ₱15-20K/month (~20 hours/week)
- [ ] Role: Monitor lab health, proactive outreach, prevent churn

**Week 3: CS Onboarding & Playbooks**
- [ ] Create health score: Orders/month, login frequency, support tickets
- [ ] Define: Green (healthy), Yellow (at risk), Red (churning)
- [ ] Playbook 1: Yellow lab → Proactive outreach call
- [ ] Playbook 2: Red lab → CEO/Salesperson intervention
- [ ] Playbook 3: Green lab → Upsell opportunities (referrals, premium features)

**Week 4: CS in Action**
- [ ] CS person reaches out to 5 yellow labs
- [ ] Conversations: "How can we help you get more orders?"
- [ ] Actions: Improve their listings, feature them in marketing, training on best practices
- [ ] Track: Did interventions prevent churn?

**Month 9 Target:** 25-30 total labs, ₱110-140K MRR, <10% churn ✅

---

**Month 10: Geographic Expansion**

**Week 1: Market Research**
- [ ] Identify: Which cities have concentration of labs? (Cebu, Davao, Baguio)
- [ ] Analyze: Are there clients in those regions searching for labs?
- [ ] Decide: Which city to expand to first? (Cebu likely best)

**Week 2: Cebu Launch Prep**
- [ ] Salesperson creates shortlist: 10 labs in Cebu
- [ ] Outreach: Personalized pitch emphasizing "now available in Cebu!"
- [ ] Offer: Same pricing, maybe 1-month free trial for "Cebu pioneer labs"

**Week 3: First Cebu Labs**
- [ ] Book 3-5 demos with Cebu labs
- [ ] Close 2-3 signups
- [ ] Onboard them (remote is fine, video calls)
- [ ] Promote: "PipetGo now in Cebu!" (PR angle)

**Week 4: Cebu Client Acquisition**
- [ ] Run geo-targeted ads: "Laboratory testing Cebu"
- [ ] CEO reaches out to manufacturing companies in Cebu
- [ ] Labs refer their existing Cebu clients
- [ ] Goal: Prove model works outside Metro Manila

**Month 10 Target:** 32-38 total labs (including Cebu), ₱140-180K MRR ✅

---

**Month 11: Product Enhancements**

**Week 1: Feature Prioritization**
- [ ] Collect all feature requests from Months 1-10
- [ ] Categorize:
  - Must-have (prevents churn or blocks growth)
  - Nice-to-have (improves experience)
  - Future (interesting but low priority)
- [ ] CTO bandwidth check: What's feasible in 3-4 weeks?

**Week 2: Top 3 Features Built**
- [ ] Example Feature 1: Mobile app (if heavily requested)
- [ ] Example Feature 2: Advanced analytics for labs
- [ ] Example Feature 3: Client portal with order history/invoices
- [ ] CTO implements (or hires freelancer if CTO bandwidth low)

**Week 3: Beta Testing**
- [ ] Roll out new features to 5-10 power users first
- [ ] Collect feedback: Bugs? Confusing? Useful?
- [ ] Iterate based on feedback

**Week 4: Full Launch**
- [ ] Announce to all labs: "New features now available!"
- [ ] Create tutorial videos/docs
- [ ] Measure: Adoption rate, impact on engagement/retention

**Month 11 Target:** 38-45 total labs, ₱180-220K MRR, product improvements shipped ✅

---

**Month 12: Year-End Push & Planning**

**Week 1: Year-End Metrics Review**
- [ ] Pull full year data:
  - Total labs: X (target 30-50)
  - Total orders: X (target 500+/month by Month 12)
  - MRR: ₱X (target ₱150K+)
  - Churn: X% (target <15%)
  - LTV:CAC: X (target >3x)
- [ ] Celebrate: Wins, milestones, growth achieved! 🎉

**Week 2: Financial Analysis**
- [ ] Calculate:
  - Total GMV Year 1: ₱X
  - Total revenue: ₱X
  - Total costs: ₱X
  - Net profit: ₱X
- [ ] Compare to scenarios (conservative/moderate/aggressive)
- [ ] Assess: Which scenario did we hit?

**Week 3: Year 2 Planning**
- [ ] Set goals:
  - Labs: Target for Month 24?
  - MRR: Target for Month 24?
  - Team: Hire needs? (developers? marketers?)
  - Features: Product roadmap for Year 2?
- [ ] Budget: Infrastructure scaling needs?
- [ ] Funding: Bootstrap Year 2 or raise seed round?

**Week 4: Founder Alignment**
- [ ] CEO and CTO sit-down: "How are we doing?"
- [ ] Discuss:
  - Are we excited about Year 2?
  - Is equity split still fair? (any adjustments needed?)
  - Do we want to raise funding or stay bootstrapped?
  - What worked? What didn't?
- [ ] Decide: Course for Year 2

**Month 12 Target:** 30-50 labs, ₱150-300K MRR, profitable, clear Year 2 plan ✅

---

### Post-Year 1: Decision Framework

**Scenario A: Conservative Results (12 labs, ₱50K MRR)**

**Assessment:** Product-market fit weak, growth slow

**Options:**
1. **Iterate:** Extend timeline, improve product, focus on retention
2. **Pivot:** Change model (e.g., become SaaS-only, not marketplace)
3. **Exit:** Acqui-hire, shut down gracefully, move on
4. **Continue small:** Keep as side project, don't scale

**Recommended:** If passionate about problem, iterate. If burned out, exit.

---

**Scenario B: Moderate Results (30 labs, ₱150K MRR)**

**Assessment:** Product-market fit proven, solid foundation

**Options:**
1. **Bootstrap Year 2:** Reinvest profits, grow organically to 60+ labs
2. **Raise seed round:** ₱5-10M to accelerate growth (hire team, marketing)
3. **Strategic partnership:** Partner with lab chain or industry player

**Recommended:** Bootstrap if enjoying pace, raise if ready to scale fast.

---

**Scenario C: Aggressive Results (70 labs, ₱700K MRR)**

**Assessment:** Lightning in a bottle, huge traction

**Options:**
1. **Raise Series A:** ₱30-50M to dominate market (expand to SEA)
2. **Strategic acquisition:** Major lab or tech company wants to buy
3. **Double down:** Bootstrap but hire aggressively, go all-in

**Recommended:** Raise Series A, professionalize operations, scale to ₱100M+ GMV.

---

## Key Performance Indicators (KPIs)

### Dashboard Metrics to Track Weekly

**Supply Side (Labs):**
- [ ] **Total active labs** (paid subscription current)
- [ ] **New lab signups** (this week)
- [ ] **Lab churn** (canceled subscriptions)
- [ ] **Average orders per lab** (7-day and 30-day)
- [ ] **Quote response time** (average hours to provide quote)
- [ ] **Lab NPS score** (monthly survey: 0-10 scale)

**Demand Side (Clients):**
- [ ] **Total active clients** (placed order in last 30 days)
- [ ] **New client signups** (this week)
- [ ] **Quote requests** (total submitted)
- [ ] **Quote-to-order conversion** (% of quotes that become orders)
- [ ] **Client repeat rate** (% who order 2+ times)
- [ ] **Client NPS score** (monthly survey)

**Financial:**
- [ ] **MRR** (monthly recurring revenue from subscriptions)
- [ ] **GMV** (gross merchandise value, total order value)
- [ ] **Commission revenue** (actual commission captured)
- [ ] **Total revenue** (MRR + commission)
- [ ] **Operating costs** (infrastructure + team)
- [ ] **Net profit/loss**
- [ ] **Burn rate** (if negative, how many months of runway?)

**Liquidity:**
- [ ] **Sell-through rate** (% of services that get orders)
- [ ] **Marketplace liquidity** (orders per active lab)
- [ ] **Time to first order** (for new labs, how long until first sale?)
- [ ] **Platform leakage** (estimated % of transactions going off-platform)

**Growth:**
- [ ] **CAC** (customer acquisition cost per lab)
- [ ] **LTV** (lifetime value per lab, calculated monthly)
- [ ] **LTV:CAC ratio** (should be >3x)
- [ ] **Payback period** (months to recover CAC)
- [ ] **Month-over-month growth** (MRR % change)

---

### Traffic Lights System (Operational Health)

**🟢 Green - Healthy:**
- MRR growing >10% month-over-month
- Churn <10%/month
- Quote-to-order conversion >70%
- LTV:CAC >5x
- Labs and clients both NPS >7
- **Action:** Keep doing what you're doing, optimize

**🟡 Yellow - At Risk:**
- MRR flat or growing <5%/month
- Churn 10-20%/month
- Quote-to-order conversion 50-70%
- LTV:CAC 2-5x
- NPS 5-7
- **Action:** Investigate, make adjustments, prevent further decline

**🔴 Red - Crisis:**
- MRR declining
- Churn >20%/month
- Quote-to-order conversion <50%
- LTV:CAC <2x
- NPS <5
- **Action:** Emergency meeting, major intervention needed (pricing change? feature? pivot?)

---

## Communication Plan

### Internal (CEO ↔ CTO)

**Weekly Sync (1 hour):**
- **Monday 9am:** Review metrics, set priorities for week
- **Agenda:**
  - Week review: What got done? What's blocked?
  - Metrics review: Traffic light status?
  - Top 3 priorities for this week
  - Decisions needed (CEO decides business, CTO decides tech)
  - Blockers/help needed
- **Output:** Shared doc with action items, owners, deadlines

**Monthly Strategy Review (2-3 hours):**
- **Last Friday of month:** Deep dive on progress vs plan
- **Agenda:**
  - Month metrics vs targets
  - Wins and lessons learned
  - Course corrections needed?
  - Next month planning
  - Team/hiring needs
  - Budget review
- **Output:** Updated roadmap for next quarter

---

### External (Platform → Users)

**Lab Communication:**
- **Weekly:** Platform updates email (new features, tips, success stories)
- **Monthly:** Performance report (your orders, revenue, top clients)
- **Quarterly:** Virtual meetup (all labs, networking + roadmap preview)
- **Ad-hoc:** Transactional emails (new order, payment received, etc.)

**Client Communication:**
- **Onboarding:** Welcome email sequence (how platform works)
- **Transactional:** Quote received, order status updates
- **Monthly:** Newsletter (new labs, featured services, industry trends)
- **Re-engagement:** If inactive >60 days, "We miss you" campaign

---

### Crisis Communication Protocol

**If major issue occurs:**

**Tier 1 - Minor (e.g., bug affecting <10 users):**
- CTO fixes ASAP
- Support reaches out to affected users
- Post-mortem: What happened? How to prevent?

**Tier 2 - Moderate (e.g., payment processing down 2 hours):**
- CEO notifies all users immediately (email)
- CTO works on fix, provides ETAs
- Compensation offered (e.g., free week of subscription)
- Public post-mortem (transparency builds trust)

**Tier 3 - Severe (e.g., data breach, platform down 24+ hours):**
- Emergency CEO/CTO meeting
- Public statement within 4 hours
- Email/SMS to all users
- Consultant hired if needed (security expert, PR firm)
- Regulatory notifications if required (NPC for data breach)
- Recovery plan with timeline

---

## Closing Recommendations

### For CEO (Your Sister)

**Your Superpowers:**
- 16 years lab industry experience (credibility, relationships, domain expertise)
- Business development and sales skills
- Understanding of client pain points (you've been there)
- Network of potential pilot labs and early clients

**How to Win:**
1. **Own the sales process** - Your brother builds, you sell
2. **Leverage your network aggressively** - Personal relationships are the moat
3. **Be the voice of the user** - Bring lab/client feedback to product decisions
4. **Think like a partner, not a platform** - Labs are collaborators, not suppliers
5. **Stay close to first 10 labs** - Their success is your success

**Time Investment:**
- Phase 1 (Months 1-3): 30 hours/week (onboarding, demos, support)
- Phase 2 (Months 4-6): 20 hours/week (sales, relationship management)
- Phase 3 (Months 7-12): 15 hours/week (strategy, hiring, oversight)

**Warning Signs to Watch:**
- Labs aren't referring clients (value prop insufficient)
- You're spending more time on support than sales (hire help sooner)
- You dread sales calls (might be wrong market or wrong model)
- Brother is burning out (protect the CTO, he's irreplaceable)

---

### For CTO (You)

**Your Superpowers:**
- 16 years problem-solving in complex domains (geodesy → web dev transition)
- ADHD hyperfocus (when interested, you're 10x productive)
- AI-assisted development (Claude Code, GPT-4 - leverage heavily)
- Systematic thinking (TDD, documentation, structured approach)

**How to Win:**
1. **Protect your energy** - 800 hours is a marathon, pace yourself
2. **Use AI aggressively** - Don't write boilerplate, focus on business logic
3. **Test-driven development** - Prevents rework, suits ADHD brain
4. **Document as you go** - External memory for context-switching
5. **Phased commitment** - 300h MVP first, validate before full 800h

**Time Investment:**
- Phase 1 (Weeks 1-4): Full-time sprint (40 hrs/week × 4 weeks = 160h)
- Phase 2 (Months 1-3): Part-time (20 hrs/week × 12 weeks = 240h)
- Phase 3 (Months 4-6): Maintenance (10 hrs/week × 12 weeks = 120h)
- Total: ~520 hours (less than original 800h estimate with AI help)

**Warning Signs to Watch:**
- Development stalls for weeks (burnout imminent)
- Hating coding (wrong project fit)
- Sister wants features faster than you can deliver (expectation mismatch)
- Technical debt accumulating (need to hire help or slow down)

---

### For Both Founders

**This is a Partnership:**
- Equity split (65/35) reflects roles: She drives business, you drive product
- Vesting over 4 years protects both (1-year cliff ensures commitment)
- Weekly syncs are non-negotiable (communication breakdown kills startups)
- Founder conflicts should be addressed immediately, not festered

**Success Looks Like (12 Months):**
- You've built something real that helps real labs
- 30+ labs actively using and paying
- ₱150K+ MRR covering costs and generating profit
- Stronger relationship as co-founders
- Clear path forward (bootstrap Year 2 or raise funding)

**Failure Looks Like (12 Months):**
- <5 labs using platform
- Relationship strained (resentment, miscommunication)
- Burned out and hate the project
- Money lost with no path forward

**How to Avoid Failure:**
- Start small (3 labs first, not 30)
- Communicate obsessively (weekly syncs)
- Validate before scaling (don't skip pilot phase)
- Protect each other's energy (you're a team)
- Be willing to pivot or quit if not working

---

## Final Word

**This business model document is a strategic guide, not a rigid playbook.**

Markets evolve. Competitors emerge. Users surprise you. The best plan is one you can adapt.

**The core insights:**
1. **Hybrid pricing model** (₱2K/month + 5%) balances revenue and growth
2. **Start hyper-focused** (3-5 labs in Metro Manila, 1-2 categories)
3. **Quotation-first workflow** aligns with B2B expectations (not e-commerce)
4. **Platform leakage prevention** via SaaS tools and trust mechanisms
5. **Unit economics are favorable** if assumptions hold (LTV:CAC ~19x for labs)
6. **Break-even achievable** by Month 9 with 10-15 active labs

**Your competitive advantages:**
- CEO's 16 years lab industry expertise (irreplaceable)
- Local Philippine market focus (not attractive to international players yet)
- Quotation-first model (differentiated from e-commerce marketplaces)
- Bootstrap-friendly unit economics (can grow without funding)
- Family partnership (trust and aligned incentives)

**The hardest parts:**
- Solving chicken-and-egg problem (get first 10 labs)
- Preventing platform leakage (make platform indispensable)
- Managing CTO burnout risk (ADHD + 800 hours)
- Maintaining founder relationship (business + family)
- Staying disciplined on focus (don't expand too fast)

**Execute Phase 1 flawlessly. Everything else follows.**

3 labs, 3 months, 50 orders. If you hit that, you have a business. If not, you learn and iterate or move on.

**Good luck. You've got this.** 🚀

---

## Appendix: Quick Reference

### One-Page Business Model Summary

**What:** B2B marketplace for ISO 17025 lab testing services in Philippines

**Model:** Hybrid pricing (₱2,000/month subscription + 5% commission)

**Target:** 30-50 labs, ₱150-300K MRR by Month 12

**Go-to-Market:**
- Phase 1 (Months 1-3): 3-5 pilot labs, free, validate
- Phase 2 (Months 4-6): 10-15 paid labs, prove unit economics
- Phase 3 (Months 7-12): 30-50 labs, scale & profitability

**Success Metrics:**
- 50+ orders in pilot phase
- 80%+ quote approval rate
- <15% monthly churn
- LTV:CAC >3x

**Key Risks:**
- Platform leakage (mitigate: SaaS tools, trust mechanisms)
- CTO burnout (mitigate: phased commitment, AI assistance)
- Chicken-and-egg (mitigate: start small, CEO's network)

**Break-Even:** ~21 orders/month = ₱25K revenue covers ₱25K costs

**Team:**
- Month 1-4: 2 founders only
- Month 5: Add part-time support
- Month 7: Add full-time sales
- Month 9: Add part-time customer success

**Timeline:** 12 months to prove model, then decide (bootstrap Year 2 vs raise funding)

---

*End of Business Model Strategy Document*

*Version 1.0 - October 2025*

*Next Update: After Phase 1 Pilot Validation (Month 3)*