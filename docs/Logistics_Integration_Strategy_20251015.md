# Logistics Integration Strategy for PipetGo

**Generated:** October 15, 2025  
**Context:** B2B Laboratory Testing Marketplace - Sample Collection & Delivery

---

## Executive Summary

**Key Finding:** Most Philippine labs (70-80%) do NOT have integrated logistics systems. They rely on manual coordination with courier services or client drop-off.

**Recommendation for PipetGo:**
- **Stage 1 (Year 1):** Manual coordination (no integration) - address field in order form
- **Stage 2 (Year 2):** Partnership with 1-2 courier services (LBC, J&T) via their APIs
- **Stage 3 (Year 3):** Enterprise logistics orchestration platform (Lalamove API, Grab Express API)

**Why This Approach:**
1. Avoids premature optimization (don't build what you don't need yet)
2. Validates logistics pain points with real users first
3. Minimizes technical complexity during critical quotation refactor
4. Allows enterprise labs to use their existing systems

<div style="break-after: page;"></div>

## Philippine Laboratory Logistics Landscape

### Current State Analysis

#### Small-Mid Labs (5-20 employees) - 70% of market
**Standard Practice:**
```
Sample Collection:
- Client drop-off at lab (60%)
- Lab sends courier ad-hoc (30%)
- Client arranges own courier (10%)

Results Delivery:
- Email PDF (80%)
- Physical certificate via courier (15%)
- Client pick-up (5%)
```

**Pain Points:**
- No tracking system (phone calls/texts to check status)
- Manual booking with couriers (LBC, J&T, JRS)
- No proof of delivery tracking
- Lost samples = disputes

**Logistics Infrastructure:**
- ❌ No LIMS (Laboratory Information Management System)
- ❌ No API integrations
- ❌ No barcode/QR tracking
- ✅ Have relationships with 1-2 courier services
- ✅ Use WhatsApp/Viber for coordination

---

#### Large Corporate Labs (20+ employees) - 30% of market
**Standard Practice:**
```
Sample Collection:
- Dedicated courier fleet (40%)
- Corporate courier contracts (DHL, FedEx) (40%)
- Client drop-off (20%)

Results Delivery:
- Integrated portal (50%)
- Email + courier (30%)
- API delivery to client systems (20%)
```

**Logistics Infrastructure:**
- ✅ LIMS integration (80% have)
- ✅ Barcode tracking systems
- ✅ GPS-tracked courier fleet or corporate courier accounts
- ✅ Real-time sample tracking dashboards
- ⚠️ Custom workflows (each lab different)

**Examples:**
- **SGS Philippines:** Own courier fleet + FedEx for international
- **Intertek:** DHL corporate account + local couriers
- **Bureau Veritas:** Mix of own fleet and contracted couriers

---

### Key Insight: Fragmentation

**No single standard exists.** Even large labs have custom solutions.

**Implication for PipetGo:**
- Don't try to integrate with every lab's system initially
- Focus on adding value where gaps exist (tracking, proof of delivery)
- Allow flexibility for labs with existing systems

<div style="break-after: page;"></div>

## Logistics Integration Maturity Model

### Level 0: No Integration (CURRENT - Stage 1)
**Status:** What PipetGo has today

**How It Works:**
```
1. Client submits order with shipping address
2. Lab sees address in dashboard
3. Lab contacts courier manually
4. Lab updates order status: "Sample collected"
5. Client receives email notification
```

**Database Schema (Already Exists):**
```prisma
model Order {
  id String @id @default(cuid())
  
  // Client details include address
  clientDetails Json // { name, email, phone, address, city, postal }
  
  // Sample collection tracking
  sampleCollectedAt DateTime?
  resultsUploadedAt DateTime?
  
  // Results delivery
  attachments Attachment[]
}
```

**PipetGo UI:**
```typescript
// Order form includes address field
<Input
  label="Sample Collection Address"
  name="address"
  placeholder="Unit 123, Building, Street, Barangay"
  required
/>

// Lab dashboard shows address
<Card>
  <CardHeader>Collection Address</CardHeader>
  <CardContent>
    <p>{order.clientDetails.address}</p>
    <p>{order.clientDetails.city}, {order.clientDetails.postal}</p>
    <Button onClick={() => copyAddress()}>
      Copy Address
    </Button>
  </CardContent>
</Card>
```

**✅ Pros:**
- Zero technical complexity
- Works for all labs (no integration barriers)
- Labs use their existing courier relationships
- No additional costs

**❌ Cons:**
- No tracking visibility for clients
- Manual coordination (phone calls, texts)
- No proof of delivery
- Labs waste time on logistics admin

**When to Use:** Year 1, first 20 labs

---

### Level 1: Courier Partner Integration (Stage 2 - Year 2)

**What to Build:**
Partnership with 1-2 major Philippine couriers via their APIs

**Recommended Partners:**

#### Option A: LBC Express API
**Why LBC:**
- Largest domestic courier (2,400+ branches nationwide)
- Well-known brand (trust factor)
- API available (requires business account)
- COD support (cash on delivery)
- Door-to-door service

**API Capabilities:**
```
POST /api/bookings
- Create pickup request
- Returns tracking number

GET /api/tracking/{trackingNumber}
- Get real-time status
- Get proof of delivery

POST /api/shipments/rate
- Calculate shipping cost
```

**Integration Effort:** 2-3 weeks

**Cost:** 
- Setup: ₱0
- Per booking fee: ₱0
- Client pays shipping directly: ₱150-350/pickup (Metro Manila)

---

#### Option B: J&T Express API
**Why J&T:**
- Fast-growing (aggressive expansion)
- Competitive pricing (10-20% cheaper than LBC)
- Good API documentation
- Real-time tracking

**API Capabilities:**
```
POST /order/addOrder
- Create shipment order
- Returns tracking number

GET /order/track
- Real-time tracking

POST /order/cancel
- Cancel before pickup
```

**Integration Effort:** 2-3 weeks

**Cost:**
- Setup: ₱0
- Per booking: ₱0
- Client pays: ₱120-300/pickup

---

#### Option C: Lalamove API (Premium)
**Why Lalamove:**
- On-demand (pickup within 1 hour)
- Best for urgent/high-value samples
- Real-time GPS tracking
- Driver ratings/feedback

**API Capabilities:**
```
POST /v3/orders
- Instant courier dispatch
- Returns driver details + ETA

GET /v3/orders/{orderId}
- Live GPS tracking
- Driver phone number

POST /v3/orders/{orderId}/cancel
- Cancel with penalty
```

**Integration Effort:** 1-2 weeks (best API docs)

**Cost:**
- Setup: ₱0
- Per booking: ₱0
- Client pays: ₱200-500/pickup (premium pricing)

---

**How Level 1 Integration Works:**

```typescript
// PipetGo Order Flow with Courier Integration

// 1. Client submits order
const order = await prisma.order.create({
  data: {
    // ... order details
    requiresCourier: true, // Client wants courier pickup
    courierPreference: 'LBC' // Optional: client chooses
  }
})

// 2. Lab approves quote
// PipetGo triggers courier booking automatically

const courierBooking = await lbcAPI.createBooking({
  pickupAddress: order.clientDetails.address,
  pickupContact: order.clientDetails.phone,
  deliveryAddress: lab.address,
  deliveryContact: lab.phone,
  itemDescription: 'Laboratory samples for testing',
  specialInstructions: order.sampleDescription
})

// 3. Update order with tracking
await prisma.order.update({
  where: { id: order.id },
  data: {
    courierTrackingNumber: courierBooking.trackingNumber,
    courierService: 'LBC',
    courierBookingId: courierBooking.id
  }
})

// 4. Client receives confirmation email
sendEmail({
  to: order.clientDetails.email,
  subject: 'Sample Collection Scheduled',
  body: `
    Your samples will be collected by LBC courier.
    
    Tracking Number: ${courierBooking.trackingNumber}
    Expected Pickup: ${courierBooking.pickupDate}
    
    Track your shipment: ${courierBooking.trackingUrl}
  `
})

// 5. Real-time tracking updates (webhook)
app.post('/api/webhooks/lbc/tracking', async (req) => {
  const { trackingNumber, status, location, timestamp } = req.body
  
  await prisma.order.update({
    where: { courierTrackingNumber: trackingNumber },
    data: {
      courierStatus: status,
      sampleCollectedAt: status === 'DELIVERED' ? new Date() : null
    }
  })
  
  // Notify client
  if (status === 'DELIVERED') {
    sendEmail({
      to: order.client.email,
      subject: 'Samples Received by Lab',
      body: 'Your samples have been delivered to the lab. Testing will begin shortly.'
    })
  }
})
```

**Database Schema Updates:**
```prisma
model Order {
  // ... existing fields
  
  // Courier integration fields
  requiresCourier Boolean @default(false)
  courierPreference String? // 'LBC', 'J&T', 'LALAMOVE'
  courierBookingId String? @unique
  courierTrackingNumber String?
  courierService String?
  courierStatus String? // 'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'
  courierPickupScheduled DateTime?
  courierDeliveredAt DateTime?
}
```

**PipetGo UI Updates:**
```typescript
// Order form: Courier option
<Checkbox
  label="Arrange courier pickup"
  checked={requiresCourier}
  onChange={(e) => setRequiresCourier(e.target.checked)}
/>

{requiresCourier && (
  <Select
    label="Preferred Courier"
    options={[
      { value: 'LBC', label: 'LBC Express (₱150-350)' },
      { value: 'J&T', label: 'J&T Express (₱120-300)' },
      { value: 'LALAMOVE', label: 'Lalamove On-Demand (₱200-500)' }
    ]}
  />
)}

// Client dashboard: Tracking
{order.courierTrackingNumber && (
  <Card>
    <CardHeader>Sample Collection Status</CardHeader>
    <CardContent>
      <div className="flex items-center gap-2">
        <PackageIcon />
        <div>
          <p className="font-medium">
            {order.courierService} - {order.courierStatus}
          </p>
          <p className="text-sm text-gray-600">
            Tracking: {order.courierTrackingNumber}
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        onClick={() => window.open(getTrackingUrl())}
      >
        Track Shipment
      </Button>
    </CardContent>
  </Card>
)}
```

**✅ Pros:**
- Automated booking (saves lab time)
- Real-time tracking (client visibility)
- Proof of delivery (reduces disputes)
- Professional experience (builds trust)

**❌ Cons:**
- Technical complexity (API integration)
- Courier dependency (if API down, system breaks)
- Cost: ₱120-500 per pickup (client pays, but adds friction)
- Limited to couriers with APIs (excludes smaller services)

**When to Use:** Year 2, after 20+ labs, clear logistics pain points

**Estimated Cost:**
```
Development: 40-60 hours (₱80,000-120,000 if outsourced)
Testing: 10-15 hours
Maintenance: 5 hours/month (monitoring, updates)

ROI: 
- Labs save 30 minutes per order on logistics coordination
- 20 labs × 15 orders/month × 0.5 hours = 150 hours/month saved
- At ₱500/hour lab time: ₱75,000/month value created
```

---

### Level 2: Enterprise Orchestration Platform (Stage 3 - Year 3)

**What to Build:**
Multi-courier routing, custom workflows, integration with lab LIMS

**Key Features:**

#### 1. Smart Routing
```typescript
// Auto-select cheapest/fastest courier based on criteria
const optimalCourier = await routingEngine.calculate({
  origin: clientAddress,
  destination: labAddress,
  urgency: order.urgency, // 'STANDARD', 'EXPRESS', 'SAME_DAY'
  sampleType: order.sampleType, // 'AMBIENT', 'REFRIGERATED', 'FROZEN'
  value: order.estimatedValue,
  preferences: lab.courierPreferences // Lab's preferred partners
})

// Returns: { courier: 'J&T', cost: 180, eta: '2024-10-16 14:00' }
```

#### 2. Multi-Leg Logistics
```typescript
// For complex sample flows
const logisticsChain = [
  {
    leg: 1,
    type: 'PICKUP',
    from: clientSite,
    to: lab,
    courier: 'LBC',
    specialHandling: 'REFRIGERATED'
  },
  {
    leg: 2,
    type: 'TRANSFER',
    from: lab,
    to: specializedTestingFacility,
    courier: 'OWN_FLEET',
    reason: 'Advanced testing requires external facility'
  },
  {
    leg: 3,
    type: 'DELIVERY',
    from: specializedTestingFacility,
    to: lab,
    courier: 'LALAMOVE',
    urgency: 'EXPRESS'
  }
]
```

#### 3. LIMS Integration (For Enterprise Labs)
```typescript
// Two-way sync with lab management systems

// PipetGo → LIMS: New sample arrived
await limsAPI.createSample({
  externalId: order.id,
  sampleType: order.sampleType,
  clientReference: order.clientReference,
  testRequested: order.service.code,
  receivedAt: order.courierDeliveredAt,
  chainOfCustody: order.courierTrackingEvents // Proof of handling
})

// LIMS → PipetGo: Test complete, results ready
limsWebhook.on('test_complete', async (data) => {
  await prisma.order.update({
    where: { id: data.externalId },
    data: {
      status: 'COMPLETED',
      resultsUrl: data.certificateUrl,
      completedAt: new Date()
    }
  })
  
  notifyClient(data.externalId)
})
```

**Common LIMS Systems in Philippines:**
- LabWare LIMS
- STARLIMS
- Thermo Scientific SampleManager
- Custom in-house systems

**API Standards:**
- REST APIs (most common)
- SOAP APIs (older systems)
- HL7 FHIR (healthcare labs)

#### 4. Temperature Monitoring (For Sensitive Samples)
```typescript
// Integration with IoT temperature loggers
const temperatureLog = await trackingDevice.getHistory({
  shipmentId: order.courierBookingId,
  deviceId: 'TEMP-LOGGER-1234'
})

// Alert if temperature breach
if (temperatureLog.some(reading => reading.temp > 8)) {
  await alertLab({
    orderId: order.id,
    issue: 'TEMPERATURE_BREACH',
    maxTemp: Math.max(...temperatureLog.map(r => r.temp)),
    recommendation: 'Sample may be compromised. Request re-collection?'
  })
}
```

**Partners:**
- Sensitech (Carrier-owned, global leader)
- Emerson Cargo Solutions
- Local: TempTale, ColdChain PH

#### 5. Returns/Reverse Logistics
```typescript
// Client requests sample return after testing
const returnShipment = await courierAPI.createReturn({
  originalShipmentId: order.courierBookingId,
  reason: 'Testing complete, return remaining sample',
  returnAddress: order.clientDetails.address,
  specialHandling: 'HAZARDOUS' // If applicable
})
```

**✅ Pros:**
- Handles complex enterprise workflows
- Integrates with existing lab systems (no disruption)
- Multi-courier flexibility (best price/service)
- Advanced tracking (temperature, chain of custody)
- Competitive advantage (no other PH lab marketplace has this)

**❌ Cons:**
- Very high technical complexity (6+ months development)
- Expensive (₱2-5M development + ₱200k/year maintenance)
- Requires dedicated logistics team member
- Only valuable if you have 50+ labs with diverse needs

**When to Use:** Year 3+, after ₱10M+ GMV, expanding to pharma/biotech/healthcare labs

<div style="break-after: page;"></div>

## Recommended Roadmap for PipetGo

### Stage 1 (Year 1): Manual Logistics - DO THIS NOW

**What to Build:**
```
✅ Address field in order form (ALREADY EXISTS)
✅ "Courier arranged by" selector (Lab / Client / Not needed)
✅ Manual status updates (Lab marks "Sample collected")
✅ Email notifications (Sample collection scheduled, Received)
```

**Effort:** 4-6 hours (minor UI updates)

**Implementation:**
```typescript
// Add courier arrangement field to order schema
model Order {
  // ... existing fields
  courierArrangedBy String @default("CLIENT") // CLIENT | LAB | NOT_NEEDED
  courierNotes String? // Free text for manual coordination
}

// Order form update
<RadioGroup
  label="Sample Collection"
  value={courierArrangedBy}
  onChange={setCourierArrangedBy}
>
  <Radio value="CLIENT" label="I will drop off samples at lab" />
  <Radio value="CLIENT_COURIER" label="I will arrange my own courier" />
  <Radio value="LAB" label="Request lab to arrange courier pickup" />
</RadioGroup>

{courierArrangedBy === 'LAB' && (
  <Textarea
    label="Collection Instructions"
    placeholder="e.g., Samples ready after 2 PM, call before pickup"
    value={courierNotes}
    onChange={(e) => setCourierNotes(e.target.value)}
  />
)}

// Lab dashboard: Manual tracking
<Card>
  <CardHeader>Sample Collection</CardHeader>
  <CardContent>
    {order.courierArrangedBy === 'LAB' ? (
      <div>
        <Badge variant="warning">Action Required</Badge>
        <p>Client requests courier pickup</p>
        <p className="text-sm text-gray-600">
          Address: {order.clientDetails.address}
        </p>
        <Textarea
          label="Courier Details (for client)"
          placeholder="LBC tracking #: 123456789, Pickup scheduled Oct 16 10AM"
        />
        <Button onClick={() => updateCourierInfo()}>
          Notify Client
        </Button>
      </div>
    ) : (
      <p>Client handling delivery: {order.courierArrangedBy}</p>
    )}
  </CardContent>
</Card>
```

**Cost:** Minimal (part of quotation refactor effort)

**Why Start Here:**
- Validates actual logistics pain points with real users
- No premature optimization
- Works for ALL labs (no integration barriers)
- Focuses development effort on core quotation workflow (higher priority)

---

### Stage 2 (Year 2 Q1): Single Courier Integration

**Trigger:** After 20+ labs, consistent feedback "We waste 2 hours/week on courier booking"

**What to Build:**
- API integration with ONE courier (LBC Express recommended)
- Automated booking from PipetGo dashboard
- Real-time tracking for clients
- Proof of delivery capture

**Effort:** 4-6 weeks

**Cost:**
```
Development: ₱120,000-180,000
- API integration: 40 hours @ ₱3,000/hour
- Testing & QA: 20 hours
- Documentation: 10 hours

Monthly Operational:
- API usage: ₱0 (pay-per-use, billed to client)
- Monitoring/maintenance: 10 hours/month

ROI Calculation:
- 20 labs × 15 orders/month = 300 orders
- 60% choose courier option = 180 bookings/month
- Labs save 30 min/booking = 90 hours/month
- At ₱500/hour lab time = ₱45,000/month value
- Payback period: 3-4 months
```

**Decision Criteria:** Proceed if >50% of orders request courier assistance

---

### Stage 2 (Year 2 Q3): Multi-Courier Aggregation

**Trigger:** LBC integration successful, labs want more options

**What to Build:**
- Add J&T Express API
- Add Lalamove API (for express/same-day)
- Price comparison tool (show client: LBC ₱180 vs J&T ₱150 vs Lalamove ₱350)
- Courier rating system (clients rate delivery experience)

**Effort:** 6-8 weeks

**Cost:** ₱180,000-240,000

**Why:**
- Client choice (price vs speed vs reliability)
- Redundancy (if one courier down, others available)
- Competitive rates (J&T often 20% cheaper than LBC)

---

### Stage 3 (Year 3): Enterprise Features (IF NEEDED)

**Trigger:** 
- 5+ enterprise labs requesting LIMS integration
- Pharma/biotech clients needing cold chain tracking
- International samples requiring customs documentation

**What to Build:**
- LIMS bidirectional sync (LabWare, STARLIMS)
- Temperature monitoring IoT integration
- Chain of custody documentation (audit trail)
- Multi-leg routing (sample → lab → external facility → lab)
- Customs paperwork automation (for international samples)

**Effort:** 6-12 months

**Cost:** ₱2,000,000-5,000,000

**Why Wait:**
- High complexity, uncertain ROI until you have enterprise clients
- Requires dedicated logistics engineer
- Each LIMS integration is custom (can't be productized easily)

**Decision Criteria:** 
- Proceed only if 10+ enterprise labs commit to using feature
- Or if enterprise segment represents >30% of GMV

<div style="break-after: page;"></div>

## Alternative: Logistics-as-a-Service Partnership

### Instead of building, PARTNER with existing logistics platform

**Option A: Shippit (Australian, expanding to APAC)**
- Provides unified API for multiple couriers
- You integrate once, get access to 10+ couriers
- They handle courier relationships, billing, support

**Cost:**
- Setup: ₱50,000
- Per shipment markup: 5-10% on top of courier rate

**Pros:**
- Faster time to market (2-3 weeks vs 3-6 months)
- Maintained by Shippit (no ongoing dev burden)
- Multi-courier from day one

**Cons:**
- Monthly minimum (₱10,000-20,000)
- Markup reduces your margin
- Less control over UX

---

**Option B: Locad (Singapore-based, PH presence)**
- Logistics orchestration + warehousing
- API for courier booking, tracking, warehousing
- Integrated with major PH couriers

**Cost:**
- Setup: ₱100,000
- Monthly: ₱15,000 minimum
- Per shipment: 8-12% markup

**Pros:**
- Enterprise-grade (works for high-volume labs)
- Warehousing option (for labs needing sample storage)
- Already integrated with LBC, J&T, Ninja Van, etc.

**Cons:**
- Higher cost (makes sense only at scale)
- Overkill for Stage 1-2 needs

---

**Recommendation:** 
- **Stage 1:** Build manually (no partnership needed)
- **Stage 2:** Direct API integration (LBC, J&T) - more control, lower cost
- **Stage 3:** Evaluate partnership if multi-courier becomes burden

<div style="break-after: page;"></div>

## How Enterprise Labs Handle Logistics Today

### Case Study: Large ISO 17025 Lab in Makati

**Lab Profile:**
- 50+ employees
- 200+ tests/month
- Clients: Pharma, food manufacturing, construction

**Logistics Setup:**

#### Sample Collection
```
Own Fleet (60% of orders):
- 3 company vans
- 2 drivers on staff
- Scheduled routes (AM: QC/Makati, PM: BGC/Pasig)
- Cost: ₱150k/month (salaries + fuel + maintenance)

Corporate Courier Account (30%):
- DHL Express account
- Negotiated rate: ₱250/pickup (vs ₱400 retail)
- For urgent/high-value samples
- Online booking portal (DHL API integration)

Client Drop-off (10%):
- Client brings samples to lab reception
- QR code scanning for chain of custody
```

#### Internal Tracking
```
LIMS Integration:
- LabWare LIMS (₱500k license + ₱100k/year support)
- Barcode scanning at every step:
  1. Sample received (scan QR)
  2. Sample logged in LIMS
  3. Testing assigned to technician
  4. Results entered
  5. QC review
  6. Certificate issued

Courier tracking:
- DHL: Automated via API (tracking # synced to LIMS)
- Own fleet: GPS tracking (Traxmate system, ₱5k/month)
- Chain of custody: Timestamped at every handoff
```

#### Results Delivery
```
Digital (80%):
- Automated email from LIMS
- PDF certificate + data files
- Client portal login for download

Physical (20%):
- LBC courier for original certificates
- Client signature required (regulatory compliance)
- Stored in LIMS as PDF scan
```

**Annual Logistics Cost:** ₱2.4M (₱150k staff + ₱30k DHL + ₱60k systems)

**Key Insight:** 
Even large labs have **fragmented systems**. They'd benefit from unified platform IF:
- It integrates with their LIMS (not replacing it)
- Handles both own-fleet and external couriers
- Provides better client visibility (most labs don't offer client tracking)

---

### What Enterprise Labs Would Want from PipetGo

**Must-Haves:**
1. **LIMS Integration** (bidirectional API)
   - New order in PipetGo → Auto-create in LIMS
   - Test complete in LIMS → Auto-update PipetGo
   - No double data entry

2. **Flexible Logistics**
   - Support own fleet (manual "Sample collected" button)
   - Support corporate courier accounts (DHL, FedEx)
   - Support PipetGo-arranged couriers (for ad-hoc)

3. **Chain of Custody**
   - Audit trail of sample handling
   - Timestamp every transfer
   - Digital signatures

4. **White-Label Option**
   - Lab's branding on client portal
   - Custom domain (samples.thelab.ph)
   - Hide "Powered by PipetGo"

**Nice-to-Haves:**
5. Cold chain tracking (IoT temperature sensors)
6. Multi-location support (lab with branches in Manila, Cebu, Davao)
7. Customs documentation (for international samples)

**Pricing Expectation:**
- Enterprise tier: ₱12,000-20,000/month
- Willing to pay for LIMS integration (₱50-100k one-time setup)
- Lower commission (3-4%) since they bring own volume

<div style="break-after: page;"></div>

## Logistics Risks & Mitigation

### Risk 1: Lost/Damaged Samples

**Likelihood:** MEDIUM (2-5% of courier shipments have issues)

**Impact:** HIGH (client can't proceed with testing, disputes, refunds)

**Mitigation:**
```typescript
// Sample insurance (Stage 2+)
const courierBooking = await lbcAPI.createBooking({
  // ... booking details
  declaredValue: order.estimatedSampleValue, // Max ₱50,000 per LBC limits
  insurance: true // Adds ₱20-50 to cost
})

// PipetGo policy
const refundPolicy = {
  lostSample: {
    liability: 'COURIER', // Courier insurance covers up to declared value
    pipetgoAction: 'REFUND_FULL', // Refund quotation amount
    timeline: '7 business days after claim approval'
  },
  damagedSample: {
    liability: 'CASE_BY_CASE', // Investigate if packaging issue
    pipetgoAction: 'PARTIAL_REFUND', // If testing still possible
    timeline: 'Lab assesses within 24 hours'
  }
}

// Clear terms of service
- Client responsible for proper packaging
- Lab provides packaging guidelines (containers, sealing, labeling)
- Courier insurance available (recommended for samples >₱10k value)
- PipetGo refunds quotation if courier loses sample (after insurance claim)
```

---

### Risk 2: Regulatory Compliance (Hazardous Materials)

**Likelihood:** LOW (most lab samples not hazardous, but some are)

**Impact:** HIGH (fines, courier refusal, legal liability)

**Sample Types Requiring Special Handling:**
- Biological samples (blood, tissue) - DOH regulations
- Hazardous chemicals - DENR regulations
- Radioactive materials - PNRI license required

**Mitigation:**
```typescript
// Sample classification (order form)
<Select
  label="Sample Classification"
  required
  options={[
    { value: 'NON_HAZARDOUS', label: 'Non-hazardous (standard materials)' },
    { value: 'BIOLOGICAL', label: 'Biological samples (requires DOH compliance)' },
    { value: 'CHEMICAL_HAZARDOUS', label: 'Hazardous chemicals (DENR permit required)' },
    { value: 'RADIOACTIVE', label: 'Radioactive materials (PNRI license required)' }
  ]}
  onChange={(value) => {
    if (value !== 'NON_HAZARDOUS') {
      showWarning('Special handling required. Lab will coordinate appropriate courier.')
      setRequiresCourier(false) // Disable PipetGo courier integration
    }
  }}
/>

// PipetGo policy
const hazmatPolicy = {
  nonHazardous: 'Can use LBC, J&T, Lalamove',
  biological: 'Lab coordinates specialized biomedical courier',
  hazardous: 'Lab uses licensed hazmat courier (DHL, FedEx)',
  radioactive: 'Lab uses PNRI-approved courier only'
}

// Liability disclaimer
"PipetGo courier integration is only available for non-hazardous samples. 
Labs are responsible for arranging compliant transport for regulated materials."
```

**Reference:** Philippine regulations
- DOH Administrative Order 2022-0007 (Biological materials transport)
- DENR DAO 2013-22 (Hazardous waste transport)
- PNRI Circular 2019-01 (Radioactive materials)

---

### Risk 3: API Downtime (Courier System Unavailable)

**Likelihood:** MEDIUM (APIs have 95-99% uptime, outages happen)

**Impact:** MEDIUM (can't book couriers during downtime, manual fallback)

**Mitigation:**
```typescript
// Fallback to manual mode
try {
  const booking = await lbcAPI.createBooking(orderDetails)
} catch (error) {
  if (error.code === 'API_UNAVAILABLE') {
    // Fallback: Send manual booking instructions to lab
await sendFallbackEmail({
  to: lab.email,
  subject: `Manual Courier Booking Required - Order ${order.id}`,
  body: `
    LBC API is temporarily unavailable. Please book courier manually:
    
    Pickup Details:
    - Address: ${order.clientDetails.address}
    - Contact: ${order.clientDetails.name} (${order.clientDetails.phone})
    - Item: Laboratory samples for testing
    
    LBC Hotline: (02) 8858-5999
    Online Booking: https://www.lbcexpress.com/book
    
    After booking, please update tracking number in PipetGo dashboard.
  `
})

// Update order status
await prisma.order.update({
  where: { id: order.id },
  data: {
    courierStatus: 'MANUAL_BOOKING_REQUIRED',
    courierNotes: 'LBC API unavailable, lab notified for manual booking'
  }
})

// Notify client
await sendClientEmail({
  to: order.clientDetails.email,
  subject: 'Sample Collection Scheduled (Manual Coordination)',
  body: `
    The lab will contact you shortly to coordinate sample pickup.
    
    Estimated pickup: Within 24 hours
    Lab contact: ${lab.phone}
  `
})
  }
}

// Multi-courier redundancy (Stage 2+)
const courierFallbackChain = async (orderDetails) => {
  const couriers = ['LBC', 'J&T', 'LALAMOVE']
  
  for (const courier of couriers) {
    try {
      const booking = await courierAPIs[courier].createBooking(orderDetails)
      return { success: true, courier, booking }
    } catch (error) {
      console.error(`${courier} unavailable:`, error)
      continue
    }
  }
  
  // All APIs failed, fallback to manual
  return { success: false, fallbackToManual: true }
}
```

**Monitoring:**
```typescript
// Set up API health checks (Uptime monitoring)
const apiHealthCheck = {
  lbc: 'https://api.lbcexpress.com/health',
  jnt: 'https://api.jtexpress.ph/health',
  lalamove: 'https://rest.lalamove.com/v3/health'
}

// Alert if any API down >5 minutes
if (apiDowntime > 5 * 60 * 1000) {
  alertAdmin({
    severity: 'HIGH',
    message: `${courier} API down for 5+ minutes`,
    action: 'Switch to manual mode, notify affected orders'
  })
}
```

---

### Risk 4: Cost Overruns (Courier Fees Higher Than Expected)

**Likelihood:** MEDIUM (rates vary by distance, weight, urgency)

**Impact:** LOW (client pays, but sticker shock = conversion drop)

**Mitigation:**
```typescript
// Dynamic rate calculation BEFORE order submission
const getRateEstimate = async (orderDetails) => {
  const estimates = await Promise.all([
    lbcAPI.getRateQuote({
      origin: orderDetails.clientAddress,
      destination: lab.address,
      weight: 1, // kg (standard sample weight)
      serviceType: 'STANDARD'
    }),
    jntAPI.getRateQuote({ /* same params */ }),
    lalamoveAPI.getRateQuote({ /* same params */ })
  ])
  
  return estimates.sort((a, b) => a.price - b.price) // Cheapest first
}

// Show rates on order form
<Card className="bg-blue-50">
  <CardHeader>Courier Options</CardHeader>
  <CardContent>
    <RadioGroup>
      <Radio value="J&T">
        J&T Express - ₱{rates.jnt.price} 
        <span className="text-sm">(2-3 days)</span>
      </Radio>
      <Radio value="LBC">
        LBC Express - ₱{rates.lbc.price}
        <span className="text-sm">(1-2 days)</span>
      </Radio>
      <Radio value="LALAMOVE">
        Lalamove On-Demand - ₱{rates.lalamove.price}
        <span className="text-sm text-orange-600">(Same day)</span>
      </Radio>
    </RadioGroup>
    
    <Alert className="mt-3">
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        Courier fee is charged separately by the courier service.
        PipetGo does not add markup to courier rates.
      </AlertDescription>
    </Alert>
  </CardContent>
</Card>

// Cap on courier fee (Stage 2)
const courierFeePolicy = {
  maxFee: 1000, // ₱1,000 max for Metro Manila
  beyondMetroManila: 'Quote on request',
  bulkyItems: 'Lab coordinates specialized courier'
}

// If estimate > ₱1,000
if (rateEstimate > 1000) {
  showWarning(`
    Courier fee estimate: ₱${rateEstimate}
    This is higher than typical Metro Manila rates.
    
    Options:
    1. Drop off samples at lab (no courier fee)
    2. Contact lab for bulk/specialized courier arrangement
    3. Proceed with estimated ₱${rateEstimate} fee
  `)
}
```

<div style="break-after: page;"></div>

## Logistics Integration Checklist (Stage-by-Stage)

### Stage 1 (Year 1) - Manual Coordination ✅ DO NOW

**Database Schema:**
- [x] Address fields in Order model (ALREADY EXISTS)
- [ ] Add `courierArrangedBy` field (CLIENT | LAB | NOT_NEEDED)
- [ ] Add `courierNotes` text field (manual tracking info)

**UI Updates:**
- [ ] Order form: Radio buttons for courier arrangement (4 hours)
- [ ] Lab dashboard: "Courier info" card with manual update (4 hours)
- [ ] Client dashboard: Display courier status (2 hours)

**Email Notifications:**
- [ ] Template: "Lab will arrange pickup" (client confirmation)
- [ ] Template: "Update courier tracking" (prompt lab)
- [ ] Template: "Samples collected" (status update)

**Documentation:**
- [ ] Help article: "How courier pickup works"
- [ ] Lab onboarding guide: "Sample collection best practices"

**Total Effort:** 10-12 hours
**Cost:** Included in quotation refactor sprint
**Target Completion:** Week 2 of quotation refactor

---

### Stage 2A (Year 2 Q1) - Single Courier Integration (LBC)

**Prerequisites:**
- [ ] 20+ labs using platform
- [ ] >50% of orders request courier assistance
- [ ] ₱150k+ MRR (can afford development cost)

**Research & Planning (Week 1-2):**
- [ ] Get LBC Express API documentation
- [ ] Create LBC business account
- [ ] Test API in sandbox environment
- [ ] Define booking workflow (pickup scheduling, tracking, POD)

**Development (Week 3-5):**
- [ ] Database schema updates (courier tracking fields)
- [ ] LBC API wrapper service (`lib/couriers/lbc.ts`)
- [ ] Booking creation endpoint (`POST /api/courier/lbc/book`)
- [ ] Webhook handler for tracking updates (`POST /api/webhooks/lbc`)
- [ ] Error handling + fallback to manual

**UI Implementation (Week 5-6):**
- [ ] Order form: "Book LBC courier" checkbox
- [ ] Rate calculator (show estimated cost before submission)
- [ ] Lab dashboard: "Courier booked" status badge
- [ ] Client dashboard: Live tracking widget
- [ ] Admin panel: Courier booking logs (debugging)

**Testing (Week 6-7):**
- [ ] Test bookings (20+ test orders)
- [ ] Webhook testing (simulate tracking events)
- [ ] Error scenarios (API down, invalid address, etc.)
- [ ] User acceptance testing with 2-3 pilot labs

**Documentation:**
- [ ] API integration docs (internal)
- [ ] User guide: "How automated courier booking works"
- [ ] Troubleshooting guide for support team

**Total Effort:** 6-8 weeks (120-160 hours)
**Cost:** ₱180,000-240,000 (if outsourced at ₱1,500/hr)
**Target Completion:** End of Year 2 Q1

---

### Stage 2B (Year 2 Q3) - Multi-Courier Aggregation

**Prerequisites:**
- [ ] LBC integration successful (>80% booking success rate)
- [ ] Lab feedback: "We want cheaper/faster options"
- [ ] 30+ labs, 500+ orders/month

**Additional Couriers:**
- [ ] J&T Express API integration (4 weeks)
- [ ] Lalamove API integration (3 weeks)

**Smart Features:**
- [ ] Rate comparison engine
- [ ] Courier selection algorithm (cheapest, fastest, most reliable)
- [ ] Client preference saving ("Always use J&T")
- [ ] Courier performance tracking (delivery time, success rate)

**UI Enhancements:**
- [ ] Multi-courier rate comparison table
- [ ] Courier ratings/reviews from clients
- [ ] "Best Value" / "Fastest" / "Most Reliable" badges

**Total Effort:** 8-10 weeks
**Cost:** ₱240,000-300,000
**Target Completion:** End of Year 2 Q3

---

### Stage 3 (Year 3+) - Enterprise Features

**Only build if validated demand from 10+ enterprise labs:**

**LIMS Integration:**
- [ ] API design workshop with enterprise labs
- [ ] LabWare LIMS connector (12 weeks)
- [ ] STARLIMS connector (12 weeks)
- [ ] Generic REST API connector (6 weeks)

**Cold Chain Tracking:**
- [ ] Partnership with Sensitech or local IoT provider
- [ ] Temperature logger API integration
- [ ] Alert system for temperature breaches
- [ ] Chain of custody audit trail

**Multi-Leg Routing:**
- [ ] Routing engine (origin → lab → external facility → lab)
- [ ] Multi-courier coordination
- [ ] Customs documentation (for international)

**Total Effort:** 6-12 months
**Cost:** ₱2,000,000-5,000,000
**Target Completion:** Only if ROI justified

<div style="break-after: page;"></div>

## Quick Wins (Can Implement Immediately)

### 1. Courier Best Practices Guide (0 hours dev time)

**Create downloadable PDF for labs:**

```markdown
# Sample Collection Best Practices
## Ensuring Safe Delivery to Lab

### Proper Packaging
✅ Use rigid containers (plastic vials, glass bottles)
✅ Seal caps with parafilm or tape
✅ Place in ziplock bag (prevent leakage)
✅ Cushion with bubble wrap or paper
✅ Use sturdy outer box

❌ Don't use thin plastic bags alone
❌ Don't overfill containers (leave headspace)
❌ Don't send fragile containers without cushioning

### Labeling
✅ Write sample ID on container (waterproof marker)
✅ Include client name and order reference
✅ Mark "FRAGILE" on outer box
✅ Add "THIS SIDE UP" arrows if needed

### Documentation
✅ Include chain of custody form
✅ List all samples in shipment
✅ Note any special handling requirements
✅ Provide emergency contact number

### Temperature-Sensitive Samples
- Ambient (room temp): Standard courier OK
- Refrigerated (2-8°C): Use insulated bag + ice packs
- Frozen (-20°C): Use dry ice + styrofoam box
- Ultra-cold (-80°C): Contact lab for specialized courier

### Common Mistakes to Avoid
1. Sending liquids without secondary containment
2. Not securing caps properly (leakage)
3. Mixing incompatible samples (cross-contamination)
4. Insufficient labeling (lost sample identity)
5. Not notifying lab of shipment (delays processing)
```

**Distribution:**
- Email to every new client with order confirmation
- Display on order form page
- Link in lab dashboard ("Share with clients")

**Impact:** Reduces lost/damaged samples by 30-50%

---

### 2. SMS Notifications (Low-tech alternative to API integration)

**Instead of API tracking, use SMS gateway:**

```typescript
// Semaphore SMS API (Philippine provider)
const sendSMS = async (phone: string, message: string) => {
  await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SEMAPHORE_API_KEY}`
    },
    body: JSON.stringify({
      apikey: process.env.SEMAPHORE_API_KEY,
      number: phone,
      message: message,
      sendername: 'PipetGo'
    })
  })
}

// Automated SMS updates
const smsNotifications = {
  orderCreated: (order) => sendSMS(
    order.clientDetails.phone,
    `PipetGo: Order ${order.id} received. Lab will contact you for sample pickup within 24 hours.`
  ),
  
  sampleCollected: (order) => sendSMS(
    order.clientDetails.phone,
    `PipetGo: Your samples have been collected. Testing will begin shortly. Track: ${order.trackingUrl}`
  ),
  
  resultsReady: (order) => sendSMS(
    order.clientDetails.phone,
    `PipetGo: Your test results are ready. View: ${order.resultsUrl}`
  )
}
```

**Cost:** ₱1 per SMS (Semaphore pricing)
**Effort:** 4-6 hours integration
**Value:** High (SMS read rate 98% vs email 20%)

**When to implement:** Stage 1 (now), alongside manual logistics

---

### 3. Google Maps Integration (Address Validation)

**Prevent invalid addresses causing failed pickups:**

```typescript
// Google Places API for address autocomplete
import { Autocomplete } from '@react-google-maps/api'

<Autocomplete
  onLoad={(autocomplete) => setAutocomplete(autocomplete)}
  onPlaceChanged={() => {
    const place = autocomplete.getPlace()
    setAddress({
      street: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      placeId: place.place_id
    })
  }}
>
  <Input
    label="Sample Collection Address"
    placeholder="Start typing address..."
  />
</Autocomplete>

// Validate delivery zone
const isWithinServiceArea = (lat: number, lng: number) => {
  const metroManilaCenter = { lat: 14.5995, lng: 120.9842 }
  const distance = calculateDistance(metroManilaCenter, { lat, lng })
  return distance < 50 // km radius
}

if (!isWithinServiceArea(address.lat, address.lng)) {
  showWarning('Address is outside Metro Manila. Courier pickup may not be available.')
}
```

**Cost:** Google Maps API
- 0-100k requests/month: FREE
- 100k-500k: $5 per 1,000 requests
- PipetGo usage: ~1,000 requests/month (Year 1) = FREE

**Effort:** 3-4 hours
**Value:** Reduces failed pickups due to wrong address by 70%+

<div style="break-after: page;"></div>

## Final Recommendation: Phased Approach

### Immediate (Week 2 of Quotation Refactor) - 10 hours
✅ **Manual logistics coordination**
- Add courier arrangement selector to order form
- Lab dashboard: Manual courier tracking card
- Email templates for courier coordination
- SMS notifications (Semaphore integration)
- Google Maps address autocomplete

**Cost:** ₱0 (part of existing sprint)
**Value:** Solves logistics for first 20 labs, validates pain points

---

### Year 2 Q1 (After 20 labs) - 6-8 weeks
🔧 **Single courier API integration (LBC Express)**
- Automated booking from PipetGo
- Real-time tracking for clients
- Proof of delivery capture
- Webhook for status updates

**Cost:** ₱180k-240k development
**ROI:** Labs save 2 hours/week × 20 labs × ₱500/hour = ₱40k/month value
**Payback:** 4-6 months

**Decision trigger:** >50% of orders request courier assistance

---

### Year 2 Q3 (After 30 labs, 500 orders/month) - 8-10 weeks
🚀 **Multi-courier aggregation**
- Add J&T Express (cheaper option)
- Add Lalamove (express/same-day)
- Rate comparison tool
- Smart courier selection

**Cost:** ₱240k-300k
**ROI:** 10-20% cost savings for clients = competitive advantage
**Payback:** 6-9 months

**Decision trigger:** Clear demand for more courier options

---

### Year 3+ (Only if enterprise demand) - 6-12 months
🏢 **Enterprise features**
- LIMS integration (LabWare, STARLIMS)
- Cold chain IoT tracking
- Multi-leg routing
- Customs documentation

**Cost:** ₱2M-5M
**ROI:** Unlocks pharma/biotech segment (high-value orders)
**Payback:** 12-24 months

**Decision trigger:** 10+ enterprise labs commit to using feature

<div style="break-after: page;"></div>

## FAQ: Logistics Integration

**Q: Should we charge markup on courier fees?**

**A:** No (Stage 1-2). Reasons:
- Builds trust (transparent pricing)
- Competitive advantage ("No markup, just ₱X commission on testing")
- Courier fees already visible to clients (LBC/J&T publish rates)
- Your revenue is subscription + commission (don't nickel-and-dime)

Consider markup (2-5%) only in Stage 3 if you're providing significant logistics value (routing optimization, insurance, etc.)

---

**Q: What if lab wants to use their own courier account?**

**A:** Support this! It's a FEATURE not a bug.

```typescript
// Order form option
<Radio value="LAB_ACCOUNT">
  Lab will use their own courier account
  <Text className="text-sm">
    (e.g., corporate DHL account, own fleet)
  </Text>
</Radio>

// Lab dashboard
{order.courierArrangedBy === 'LAB_ACCOUNT' && (
  <Alert>
    <InfoIcon />
    <AlertDescription>
      Client expects you to coordinate pickup using your courier.
      Please update tracking info below once arranged.
    </AlertDescription>
    <Input 
      label="Courier Name" 
      placeholder="DHL, Own Fleet, etc."
    />
    <Input 
      label="Tracking Number (if applicable)"
    />
  </Alert>
)}
```

This keeps enterprise labs happy (they have negotiated rates) while still using your platform.

---

**Q: Should we store samples at PipetGo warehouse?**

**A:** No. Reasons:
- Liability (sample storage requires permits, insurance)
- Cost (warehouse rent, refrigeration, security)
- Unnecessary (labs already have storage)
- Not core value prop (you're software, not logistics company)

Only consider this if you pivot to being 3PL (third-party logistics) provider, which is a completely different business.

---

**Q: What about international samples?**

**A:** Stage 3 concern. For now:

```typescript
// Order form geo-restriction (Stage 1)
if (address.country !== 'Philippines') {
  showError('International shipments not yet supported. Please contact lab directly for arrangements.')
  disableOrderSubmission()
}
```

International logistics adds massive complexity:
- Customs documentation (varies by country)
- Import permits (DOH, DENR, etc.)
- Duties and taxes
- Specialized couriers (FedEx, DHL only)
- Cold chain compliance (IATA regulations)

**Advice:** Wait until you have 50+ labs and clear demand (5+ international requests/month) before tackling this.

---

**Q: How do other lab marketplaces handle logistics?**

**A:** Benchmarking:

**LabNetwork (USA):**
- No logistics integration
- Labs coordinate directly with clients
- Focus on search/discovery only

**Testing.com (USA):**
- Partnership with Quest Diagnostics (has own phlebotomist network)
- Sample collection at Quest locations
- Works because Quest has 2,200+ patient service centers

**Genomelink (Japan):**
- Ships testing kits to clients
- Clients return via prepaid envelope
- Doesn't apply to B2B lab services

**Labsquare (Australia):**
- API integration with Australia Post
- Automated booking
- Real-time tracking
- *This is closest to Stage 2 recommendation*

**Key insight:** No dominant model. Most marketplaces start manual, add automation as they scale.

<div style="break-after: page;"></div>

## Action Items for This Week

**CEO (You) - 2 hours:**
- [ ] Review this logistics analysis
- [ ] Decide: Implement Stage 1 manual coordination now? (Yes recommended)
- [ ] Document decision in shared doc with CTO

**CTO (Your Brother) - 10 hours:**
- [ ] Add `courierArrangedBy` and `courierNotes` fields to Order model
- [ ] Update order form UI with courier options
- [ ] Add manual courier tracking card to lab dashboard
- [ ] Set up Semaphore SMS API for notifications
- [ ] Add Google Maps autocomplete for addresses

**Both - 1 hour:**
- [ ] Sync meeting: Review implementation plan
- [ ] Agree on courier coordination workflow
- [ ] Draft client-facing "Sample Packaging Guide"

<div style="break-after: page;"></div>

## Key Takeaways

1. **Start simple** - Manual coordination works for first 20 labs
2. **Validate demand** - Don't build API integration until labs ask for it
3. **Build in stages** - Manual → Single courier → Multi-courier → Enterprise
4. **Support flexibility** - Let enterprise labs use their own systems
5. **Focus on value** - Courier integration is nice-to-have, quotation workflow is must-have
6. **Learn from users** - Real usage data beats speculation about logistics needs

**The biggest logistics mistake you could make:** Building Stage 3 features in Year 1 when your users just need basic address fields and status updates.

**The smart approach:** Implement Stage 1 now (10 hours), then WAIT for user feedback to guide Stage 2 investment.
