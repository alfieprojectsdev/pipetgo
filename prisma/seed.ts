import { PrismaClient, UserRole, PricingMode } from '@prisma/client'

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

  // Create lab services with different pricing modes
  // ADR requirement: 2 FIXED, 5 QUOTE_REQUIRED, 3 HYBRID
  const labServices = [
    // FIXED pricing (2 services) - Instant booking available
    {
      name: 'Microbial Load Assessment',
      description: 'Enumeration of total viable microorganisms in samples. Standard test with fixed pricing.',
      category: 'Food Safety',
      pricingMode: PricingMode.FIXED,
      pricePerUnit: 1300, // ₱1,300
      turnaroundDays: 3,
      sampleRequirements: 'Method: Plate count method. Sterile container required. Standard sample size: 100g.'
    },
    {
      name: 'pH Testing',
      description: 'Measurement of pH levels in liquid or semi-solid samples.',
      category: 'Chemical Analysis',
      pricingMode: PricingMode.FIXED,
      pricePerUnit: 500, // ₱500
      turnaroundDays: 1,
      sampleRequirements: 'Method: pH meter. Minimum 50ml liquid sample or 50g solid sample.'
    },

    // QUOTE_REQUIRED pricing (5 services) - Always requires custom quote
    {
      name: 'Fatty Acid Composition Analysis',
      description: 'Determination and profiling of fatty acid composition in food or biological samples. Pricing varies based on sample complexity.',
      category: 'Food Analysis',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null, // No fixed price
      turnaroundDays: 3,
      sampleRequirements: 'Method: Combines GC and HPLC techniques. Sample requirements vary - please submit RFQ for quote.'
    },
    {
      name: 'Trace Elements Analysis',
      description: 'Measurement of trace elements and heavy metals in samples with high sensitivity. Custom quote based on elements tested.',
      category: 'Environmental Testing',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 4,
      sampleRequirements: 'Method: ICP-MS/ICP-OES. Please specify elements to test for accurate quote.'
    },
    {
      name: 'Pesticide Residue Screening',
      description: 'Screening for pesticide residues in agricultural products. Pricing depends on pesticide panel and sample matrix.',
      category: 'Environmental Testing',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 6,
      sampleRequirements: 'Method: GC-MS/LC-MS. Please provide sample details for quote.'
    },
    {
      name: 'Allergen Testing Panel',
      description: 'Comprehensive allergen detection for food safety. Custom panel pricing.',
      category: 'Food Safety',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 5,
      sampleRequirements: 'Method: ELISA/PCR. Please specify allergens to test for accurate quote.'
    },
    {
      name: 'Mycotoxin Analysis',
      description: 'Detection of mycotoxins in food and feed samples. Quote based on mycotoxin types and sample complexity.',
      category: 'Food Safety',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 7,
      sampleRequirements: 'Method: HPLC/LC-MS. Sample requirements vary - submit RFQ for details.'
    },

    // HYBRID pricing (3 services) - Reference price OR custom quote
    {
      name: 'Gas Chromatography Screening',
      description: 'Qualitative and quantitative analysis of volatile compounds using gas chromatography. Standard pricing shown, custom quotes available for complex matrices.',
      category: 'Chemical Analysis',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 2000, // ₱2,000 (reference price)
      turnaroundDays: 2,
      sampleRequirements: 'Method: Gas Chromatography (GC). Standard: 100ml liquid or 50g solid. Request custom quote for non-standard samples.'
    },
    {
      name: 'Moisture Content Analysis',
      description: 'Determination of moisture content in food and agricultural products. Fixed rate for standard samples, custom quote for large batches.',
      category: 'Food Analysis',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 800, // ₱800 (reference price)
      turnaroundDays: 1,
      sampleRequirements: 'Method: Oven drying method. Standard sample size: 100g. Request quote for batch testing (>20 samples).'
    },
    {
      name: 'Protein Content Analysis',
      description: 'Quantification of protein content using Kjeldahl method. Standard pricing for routine testing, custom quotes for research projects.',
      category: 'Food Analysis',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 1500, // ₱1,500 (reference price)
      turnaroundDays: 2,
      sampleRequirements: 'Method: Kjeldahl method. Standard sample: 50g. Request custom quote for research-grade analysis.'
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

  // Create sample orders demonstrating different workflows
  const services = await prisma.labService.findMany()

  // Order 1: QUOTE_REQUIRED service - awaiting lab quote
  const quoteRequiredService = services.find(s => s.pricingMode === PricingMode.QUOTE_REQUIRED)
  if (quoteRequiredService) {
    await prisma.order.create({
      data: {
        clientId: client.id,
        labId: lab.id,
        serviceId: quoteRequiredService.id,
        status: 'QUOTE_REQUESTED', // Awaiting lab admin quote
        sampleDescription: 'Coconut oil sample for fatty acid composition analysis. Need full profile including saturated and unsaturated fatty acids.',
        specialInstructions: 'Temperature sensitive sample - requires cold storage. Urgent analysis needed for research paper.',
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

  // Order 2: FIXED service - instant booking (for backward compatibility testing)
  const fixedService = services.find(s => s.pricingMode === PricingMode.FIXED)
  if (fixedService) {
    await prisma.order.create({
      data: {
        clientId: client.id,
        labId: lab.id,
        serviceId: fixedService.id,
        status: 'PENDING', // Instant booking, skip quote workflow
        quotedPrice: fixedService.pricePerUnit,
        quotedAt: new Date(),
        sampleDescription: 'Water sample from municipal supply for pH testing.',
        specialInstructions: 'Standard testing, no special requirements.',
        clientDetails: {
          contactEmail: client.email,
          contactPhone: '+63917123456',
          shippingAddress: {
            street: '456 Research Avenue',
            city: 'Makati City',
            postal: '1223',
            country: 'Philippines'
          },
          organization: 'Water Quality Monitoring Team'
        }
      },
    })
  }

  // Create additional realistic labs from TestingConsolidated.JSON
  const additionalLabs = [
    {
      email: 'lab2@chempro.com',
      name: 'Chempro Analytical',
      labName: 'Chempro Analytical Services Laboratories, Inc.',
      description: 'Full-service analytical laboratory specializing in water quality testing and environmental analysis',
      location: {
        address: '2F-3F P1 Bldg. No. 131-135 Shaw Blvd., Brgy. Oranbo',
        city: 'Pasig City',
        coordinates: { lat: 14.5764, lng: 121.0851 }
      },
      certifications: ['ISO 17025:2017', 'DOH Licensed', 'DENR Accredited']
    },
    {
      email: 'lab3@eurofins.com',
      name: 'Eurofins Philippines',
      labName: 'Eurofins Analytical and Assurance Services Philippines, Inc.',
      description: 'International laboratory network providing comprehensive food safety and environmental testing services',
      location: {
        address: '8th Floor Azure Business Center, 1197 EDSA Brgy. Katipunan',
        city: 'Quezon City',
        coordinates: { lat: 14.6760, lng: 121.0437 }
      },
      certifications: ['ISO 17025:2017', 'FDA Registered', 'BPI Accredited', 'Eurofins Global Network']
    },
    {
      email: 'lab4@intertek.com',
      name: 'Intertek Makati',
      labName: 'Analytical Assessment Division - Makati Laboratory Intertek Testing Services Philippines, Inc.',
      description: 'Global quality and safety solutions provider specializing in fuels, lubricants, and petrochemical testing',
      location: {
        address: '2307 Chino Roces Avenue Extension',
        city: 'Makati City',
        coordinates: { lat: 14.5547, lng: 121.0244 }
      },
      certifications: ['ISO 17025:2017', 'DOE Accredited', 'Intertek Global Network']
    }
  ]

  for (const labData of additionalLabs) {
    const labAdminUser = await prisma.user.upsert({
      where: { email: labData.email },
      update: {},
      create: {
        email: labData.email,
        name: labData.name,
        role: UserRole.LAB_ADMIN,
      },
    })

    const newLab = await prisma.lab.create({
      data: {
        name: labData.labName,
        description: labData.description,
        ownerId: labAdminUser.id,
        location: labData.location,
        certifications: labData.certifications
      },
    })

    // Add diverse services for each lab
    const labServicesForNewLab = [
      {
        name: 'Water Quality Analysis',
        description: 'Comprehensive water testing for potable water, wastewater, and industrial effluent',
        category: 'Environmental Testing',
        pricingMode: PricingMode.QUOTE_REQUIRED,
        pricePerUnit: null,
        turnaroundDays: 5,
        sampleRequirements: 'Method: Multiple parameters. Please specify testing requirements for accurate quote.'
      },
      {
        name: 'Total Coliform Testing',
        description: 'Microbiological testing for total coliform and E. coli in water samples',
        category: 'Water Safety',
        pricingMode: PricingMode.FIXED,
        pricePerUnit: 1200,
        turnaroundDays: 3,
        sampleRequirements: 'Method: Membrane filtration. Sterile bottle required, minimum 500ml.'
      },
      {
        name: 'Heavy Metals Panel',
        description: 'Detection of heavy metals (lead, mercury, cadmium, arsenic) in various matrices',
        category: 'Environmental Testing',
        pricingMode: PricingMode.HYBRID,
        pricePerUnit: 3500,
        turnaroundDays: 5,
        sampleRequirements: 'Method: AAS/ICP-MS. Standard panel price shown, custom panels available.'
      }
    ]

    for (const serviceData of labServicesForNewLab) {
      await prisma.labService.create({
        data: {
          ...serviceData,
          labId: newLab.id,
        },
      })
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log('📊 Demo accounts created:')
  console.log('  Client: client@example.com')
  console.log('  Lab Admin: lab@testinglab.com')
  console.log('  Platform Admin: admin@pipetgo.com')
  console.log('  Additional Labs: lab2@chempro.com, lab3@eurofins.com, lab4@intertek.com')
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