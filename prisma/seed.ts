import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pipetgo.com' },
    update: {},
    create: {
      email: 'admin@pipetgo.com',
      name: 'PipetGo Admin',
      role: UserRole.ADMIN,
    },
  })

  // Create lab admin user
  const labAdmin = await prisma.user.upsert({
    where: { email: 'lab@testinglab.com' },
    update: {},
    create: {
      email: 'lab@testinglab.com',
      name: 'Metro Testing Lab Admin',
      role: UserRole.LAB_ADMIN,
    },
  })

  // Create client user
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      name: 'Maria Santos',
      role: UserRole.CLIENT,
    },
  })

  // Create lab
  const lab = await prisma.lab.upsert({
    where: { id: 'lab-1' },
    update: {},
    create: {
      id: 'lab-1',
      name: 'Metro Manila Testing Laboratory',
      description: 'Full-service analytical laboratory specializing in food safety and environmental testing',
      ownerId: labAdmin.id,
      location: {
        address: '123 Science Street, Diliman',
        city: 'Quezon City',
        coordinates: { lat: 14.6760, lng: 121.0437 }
      },
      certifications: ['ISO 17025', 'DOH Licensed', 'BPI Accredited']
    },
  })

  // Create lab services using your lab tests data
  const labServices = [
    {
      name: 'Fatty Acid Composition Analysis',
      description: 'Determination and profiling of fatty acid composition in food or biological samples.',
      category: 'Food Analysis',
      pricePerUnit: 150,
      turnaroundDays: 3,
      sampleRequirements: 'Method: Combines GC and HPLC techniques. Minimum 50ml sample required.'
    },
    {
      name: 'Gas Chromatography Screening',
      description: 'Qualitative and quantitative analysis of volatile compounds using gas chromatography.',
      category: 'Chemical Analysis',
      pricePerUnit: 200,
      turnaroundDays: 2,
      sampleRequirements: 'Method: Gas Chromatography (GC). 100ml liquid sample or 50g solid sample.'
    },
    {
      name: 'Trace Elements Analysis',
      description: 'Measurement of trace elements and heavy metals in samples with high sensitivity.',
      category: 'Environmental Testing',
      pricePerUnit: 250,
      turnaroundDays: 4,
      sampleRequirements: 'Method: ICP-MS/ICP-OES. 200ml liquid sample or 100g solid sample.'
    },
    {
      name: 'Microbial Load Assessment',
      description: 'Enumeration of total viable microorganisms in samples.',
      category: 'Food Safety',
      pricePerUnit: 130,
      turnaroundDays: 3,
      sampleRequirements: 'Method: Plate count method. Sterile container required.'
    },
    {
      name: 'Pesticide Residue Screening',
      description: 'Screening for common pesticide residues in agricultural products.',
      category: 'Environmental Testing',
      pricePerUnit: 300,
      turnaroundDays: 6,
      sampleRequirements: 'Method: GC-MS. 500g fresh sample required.'
    }
  ]

  for (const serviceData of labServices) {
    await prisma.labService.create({
      data: {
        ...serviceData,
        labId: lab.id,
      },
    })
  }

  // Create sample order
  const firstService = await prisma.labService.findFirst()
  if (firstService) {
    await prisma.order.create({
      data: {
        clientId: client.id,
        labId: lab.id,
        serviceId: firstService.id,
        status: 'PENDING',
        sampleDescription: 'Coconut oil sample for fatty acid composition analysis',
        specialInstructions: 'Please handle with care, temperature sensitive sample',
        clientDetails: {
          contactEmail: client.email,
          contactPhone: '+63917123456',
          shippingAddress: {
            street: '456 Research Avenue',
            city: 'Makati City',
            postal: '1223',
            country: 'Philippines'
          },
          organization: 'Food Research Institute'
        }
      },
    })
  }

  console.log('✅ Database seeded successfully!')
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