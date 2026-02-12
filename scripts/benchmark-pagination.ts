import { createPrismaMock, seedMockDatabase, resetMockDatabase } from '../src/lib/db-mock'

async function benchmark() {
  console.log('🚀 Starting Benchmark: Order Pagination')

  // 1. Setup Mock DB
  console.log('📦 Initializing Mock Database...')
  const prisma = await createPrismaMock()
  await resetMockDatabase()

  // 2. Seed Data
  console.log('🌱 Seeding 10,000 orders...')
  const BATCH_SIZE = 1000
  const TOTAL_ORDERS = 10000

  // Create a base order object
  const baseOrder = {
    clientId: 'client-1',
    labId: 'lab-1',
    serviceId: 'service-1',
    status: 'PENDING',
    quotedPrice: 500,
    quotedAt: new Date(),
    sampleDescription: 'Benchmark Sample',
    specialInstructions: 'None',
    clientDetails: {
      contactEmail: 'client@test.com',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        postal: '12345',
        country: 'Philippines'
      }
    }
  }

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    await prisma.order.create({
      data: {
        ...baseOrder,
        id: `bench-order-${i}`,
        sampleDescription: `Benchmark Sample ${i}`
      }
    })
    if ((i + 1) % BATCH_SIZE === 0) {
      process.stdout.write('.')
    }
  }
  console.log('\n✅ Seeding complete.')

  // 3. Measure Full Fetch (Baseline)
  console.log('\n⏱️  Measuring Full Fetch (Baseline)...')
  const startFull = performance.now()
  const fullOrders = await prisma.order.findMany()
  const endFull = performance.now()
  const timeFull = endFull - startFull
  console.log(`   Fetched ${fullOrders.length} orders in ${timeFull.toFixed(2)}ms`)

  // 4. Measure Paginated Fetch (Optimized)
  console.log('\n⏱️  Measuring Paginated Fetch (Target)...')
  const startPage = performance.now()
  // Note: This relies on db-mock being updated to support skip/take
  const pageOrders = await prisma.order.findMany({
    skip: 0,
    take: 50
  })
  const endPage = performance.now()
  const timePage = endPage - startPage
  console.log(`   Fetched ${pageOrders.length} orders in ${timePage.toFixed(2)}ms`)

  // 5. Results
  console.log('\n📊 Results:')
  console.log(`   Baseline (10k): ${timeFull.toFixed(2)}ms`)
  console.log(`   Paginated (50): ${timePage.toFixed(2)}ms`)

  if (pageOrders.length === fullOrders.length) {
     console.warn('⚠️  WARNING: Pagination not implemented in mock DB yet! Both returned same count.')
  } else {
     const improvement = timeFull / timePage
     console.log(`   ⚡ Speedup: ${improvement.toFixed(1)}x`)
  }
}

benchmark().catch(console.error)
