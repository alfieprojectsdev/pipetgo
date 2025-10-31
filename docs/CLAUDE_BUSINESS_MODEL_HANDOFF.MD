# PipetGo Business Model Context Handoff

## Thread Purpose
Design optimal business model and revenue strategy for PipetGo - a B2B marketplace connecting businesses with ISO 17025 certified Philippine laboratory testing services.

## Critical Context

### What PipetGo Is
- **Model:** B2B quotation-based marketplace (like Alibaba RFQ, NOT e-commerce)
- **Geography:** Philippines-focused
- **Market:** Laboratory testing services (chemical analysis, mechanical testing, environmental testing)
- **Users:** 
  - Businesses (demand side) - request custom quotes for testing
  - ISO 17025 certified labs (supply side) - provide custom pricing
  
### Current Business Reality (Oct 2025)
**Technical Foundation:** 95% complete MVP
- Next.js 14, PostgreSQL, Prisma ORM
- Database schema supports quotation workflow ✅
- 111 passing tests (foundation only)

**Critical Misalignment Discovered:** System built as e-commerce (fixed pricing) but CEO expects B2B quotation model
- Alignment score: 22.5%
- Refactor required: 64-80 hours over 3 weeks
- See: `QUOTATION_SYSTEM_AUDIT_20251013.md`

### Founder Situation
**CEO (Your Sister):**
- Laboratory industry expert (16+ years)
- Owns PipetGo business concept
- Holds 65% equity
- Funds infrastructure (~₱87K/year)

**You (CTO/Co-Founder):**
- 35% equity for sweat equity contribution
- Contributing 800 hours development (₱662K value)
- Out-of-pocket: ₱18,900 (domain, AI tools, coffee)
- Transitioning from geodesy to web dev
- ADHD/autism considerations in workflow

## Business Model Decision Needed

### Revenue Model Options

**Option A: Commission Only (10-15%)**
- Take % of each transaction
- Pro: Scales with usage, aligns incentives
- Con: Requires payment processing, vulnerable to platform leakage
- Best for: High-volume standardized tests

**Option B: Subscription Only (₱2,000-7,000/month)**
- Labs pay monthly fee
- Pro: Predictable revenue, simpler compliance
- Con: Hard to justify if low usage, doesn't scale with order value
- Best for: Labs wanting internal workflow tools

**Option C: Hybrid (₱2,000/month + 5% commission) [RECOMMENDED]**
- Base subscription + small transaction fee
- Pro: Base revenue coverage + growth upside, lower resistance than high commission
- Con: More complex to implement and explain
- Best for: Early-stage marketplace balancing risk and growth

### Key Market Research Documents Analyzed
1. `Marketplace business models definition + guide.md` - Sharetribe's analysis of top 100 marketplaces
2. `How to prevent marketplace leakage.md` - Strategies to keep transactions on-platform
3. `Marketplace pricing How to define your ideal take rate.md` - Setting optimal commission rates
4. `How to onboard initial marketplace supply.md` - Supply-side growth tactics
5. `What is marketplace liquidity.md` - Measuring and improving transaction success rates
6. `What is the chicken and egg problem.md` - 30+ examples of solving early-stage user acquisition

### Critical Success Metrics

**Break-Even Analysis (Hybrid Model):**
- Fixed costs: ₱15,500/month (infrastructure + support)
- Revenue per order: ₱750 (₱5,000 avg order × 15% total take)
- Orders needed: 21/month to break even
- Post-development: Only 8-10 orders/month sustains operations

**Liquidity Metrics to Track:**
- Sell-through rate (% of listings leading to sales)
- Purchase rate (% of visits leading to transactions)
- Seller-to-buyer ratio (market-specific)

**Target by Month 12:**
- 15-30 labs using platform
- 50+ orders/month
- ₱120,000-300,000 monthly revenue
- Positive cash flow

## What This Thread Should Produce

### Primary Deliverable
Detailed business model recommendation document covering:

1. **Revenue Strategy**
   - Chosen model (commission/subscription/hybrid) with justification
   - Pricing structure specifics
   - Competitor benchmarking
   - Financial projections (3 scenarios: conservative, moderate, aggressive)

2. **Go-To-Market Plan**
   - Phase 1: Pilot (0-3 months) - 3-5 labs, validation
   - Phase 2: Expansion (4-6 months) - 10-15 labs, paid customers
   - Phase 3: Growth (7-12 months) - 30-50 labs, ₱150K+ MRR

3. **Competitive Strategy**
   - Market positioning
   - Defensible advantages (industry expertise, local focus, quotation model)
   - Platform leakage prevention tactics

4. **Implementation Roadmap**
   - Week-by-week action items
   - Resource requirements
   - Decision points and pivots

### Decision Framework Needed
Help CEO answer:
- Which revenue model maximizes long-term value?
- What pricing won't scare away early adopters but scales profitably?
- How to prevent labs from going around the platform after first transaction?
- Should we start with one model and transition later?

## Key Constraints

**Technical:**
- Quotation system refactor required before monetization (3 weeks)
- Payment integration in Stage 2 (Stripe/Paymongo)
- No subscription billing system yet built

**Market:**
- Philippine B2B laboratory services (fragmented, relationship-driven)
- Average order value: ₱5,000-15,000
- Transaction complexity: custom quotes, sample handling, certified reports

**Resources:**
- Bootstrap phase (no external funding yet)
- Solo CTO development (part-time, 20 hrs/week)
- CEO handles all business development

**Timeline:**
- MVP refactor: 4-8 weeks
- Beta launch target: End of Q4 2025
- First paying customers: Q1 2026

## Repository Context

**Key Files for This Discussion:**
- `docs/brainstorm_20251015_CEO.md` - CEO-focused business strategy guide
- `docs/brainstorm_20251015_CTO.md` - Technical implementation perspective
- `docs/QUOTATION_SYSTEM_AUDIT_20251013.md` - System alignment analysis
- `docs/Marketplace business models definition + guide.md` - Revenue model research
- `docs/PipetGo Cost Analysis.md` - Full cost breakdown and equity agreement

**Business Model Research:**
- Commission rates: 5-95% range depending on market
- Top marketplaces: 50%+ use commission as primary model
- Hybrid gaining popularity for early-stage platforms
- Platform leakage biggest risk in service marketplaces

## My Working Style Needs

**As a neurodivergent developer:**
- Break complex business analysis into clear decision trees
- Provide concrete examples over abstract theory
- Use tables, comparisons, and scenarios heavily
- Give actionable next steps, not just analysis
- Acknowledge ADHD challenges in execution planning

**Output Preferences:**
- Start with executive summary (what decision to make and why)
- Then detailed analysis supporting that recommendation
- Use markdown formatting extensively (headers, lists, tables)
- Include implementation timeline with specific milestones
- Flag risks clearly and suggest mitigations

## Session Goal

Generate a comprehensive business model recommendation that:
1. Explains which revenue model fits PipetGo's market and constraints
2. Provides specific pricing numbers with justification
3. Projects realistic financial outcomes (3 scenarios)
4. Maps tactical steps for go-to-market execution
5. Addresses platform leakage prevention proactively
6. Considers both CEO's business expertise and CTO's technical realities

**Expected Output Format:**
- Executive summary (1-2 pages)
- Revenue model recommendation with competitive analysis (3-5 pages)
- Financial projections and break-even analysis (2-3 pages)
- Go-to-market roadmap (3-4 pages)
- Risk assessment and mitigation strategies (2-3 pages)
- Implementation timeline and action items (1-2 pages)

**Total:** 12-20 page strategic business model document

---

## To Resume This Work:

```bash
# In your local git repo:
cd ~/pipetgo
code docs/  # Open documentation folder

# Read this context document first
# Then prompt Claude Code:

"Based on the context in CLAUDE_BUSINESS_MODEL_HANDOFF.md, 
generate a comprehensive business model recommendation for PipetGo. 
Focus on revenue strategy, pricing structure, and go-to-market plan 
tailored to Philippine B2B laboratory testing marketplace.

Use the marketplace research documents in docs/ folder as references.
Address platform leakage prevention and financial projections.
Format as strategic document for CEO decision-making."
```

---

**Context Handoff Complete** ✅  
**Thread Ready for Restart in Claude Code** 🚀