// prisma/seeds/seed.ts
import { PrismaClient } from '@prisma/client'
import { seedLabTests } from './transform-lab-tests'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  try {
    // Seed lab tests with associated labs and users
    await seedLabTests()
    
    // Create additional sample client users
    await createSampleClients()
    
    // Create sample orders for demonstration
    await createSampleOrders()
    
    console.log('✅ Database seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

async function createSampleClients() {
  const clients = [
    {
      email: 'client1@example.com',
      name: 'Maria Santos',
      role: 'CLIENT' as const
    },
    {
      email: 'client2@example.com', 
      name: 'Juan dela Cruz',
      role: 'CLIENT' as const
    },
    {
      email: 'researcher@up.edu.ph',
      name: 'Dr. Ana Reyes',
      role: 'CLIENT' as const
    }
  ]
  
  for (const clientData of clients) {
    await prisma.user.upsert({
      where: { email: clientData.email },
      update: {},
      create: clientData
    })
  }
  
  console.log('👥 Created sample client users')
}

async function createSampleOrders() {
  // Get some services and clients to create realistic orders
  const services = await prisma.labService.findMany({
    take: 3,
    include: { lab: true }
  })
  
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    take: 2
  })
  
  if (services.length === 0 || clients.length === 0) {
    console.log('⚠️ Skipping sample orders - no services or clients found')
    return
  }
  
  const sampleOrders = [
    {
      clientId: clients[0].id,
      labId: services[0].labId,
      serviceId: services[0].id,
      status: 'PENDING' as const,
      clientDetails: {
        contactEmail: clients[0].email,
        contactPhone: '+63917123456',
        shippingAddress: {
          street: '123 Sample Street',
          city: 'Quezon City',
          postal: '1101',
          country: 'Philippines'
        },
        organization: 'Sample Research Institute'
      },
      sampleDescription: 'Coconut oil sample for fatty acid analysis',
      specialInstructions: 'Please handle with care, temperature sensitive'
    },
    {
      clientId: clients[1].id,
      labId: services[1].labId,
      serviceId: services[1].id,
      status: 'QUOTED' as const,
      clientDetails: {
        contactEmail: clients[1].email,
        contactPhone: '+63918765432',
        shippingAddress: {
          street: '456 Research Ave',
          city: 'Makati City', 
          postal: '1223',
          country: 'Philippines'
        },
        organization: 'Food Manufacturing Corp'
      },
      sampleDescription: 'Water sample from production line for trace elements',
      quotedPrice: services[1].pricePerUnit,
      quotedAt: new Date()
    }
  ]
  
  for (const orderData of sampleOrders) {
    await prisma.order.create({
      data: orderData
    })
  }
  
  console.log('📋 Created sample orders')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })