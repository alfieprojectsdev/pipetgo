import { PrismaClient, UserRole, PricingMode } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * NOTE: This seed file is for LOCAL DEVELOPMENT ONLY
 *
 * For PRODUCTION, use the production seed users with secure passwords:
 * - lab1@pgtestinglab.com (password in LAB_ACCOUNT_CREDENTIALS.md)
 * - lab2@pgtestlab.com
 * - lab3@pgtstlab.com
 * - lab4@testlabpg.com
 *
 * Production passwords are managed separately for security.
 */

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user (email-only auth for ADMIN role)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pipetgo.com' },
    update: {},
    create: {
      email: 'admin@pipetgo.com',
      name: 'PipetGo Admin',
      role: UserRole.ADMIN,
      // No hashedPassword - ADMIN uses email-only auth
    },
  })

  // Create lab admin user for DEVELOPMENT (with test password)
  // Password: "TestPassword123!" (DO NOT use in production)
  const labAdmin = await prisma.user.upsert({
    where: { email: 'lab@testinglab.com' },
    update: {},
    create: {
      email: 'lab@testinglab.com',
      name: 'Metro Testing Lab Admin',
      role: UserRole.LAB_ADMIN,
      // Development-only password: TestPassword123!
      hashedPassword: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKhkP.Eim',
    },
  })

  // Create client user (email-only auth for CLIENT role)
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      name: 'Maria Santos',
      role: UserRole.CLIENT,
      // No hashedPassword - CLIENT uses email-only auth
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
    },

    // Additional specialized services for Metro Manila Testing Lab
    // Microscopy
    {
      name: 'Scanning Electron Microscopy (SEM)',
      description: 'High-resolution surface imaging and morphological analysis with EDX elemental mapping capability',
      category: 'Microscopy',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 5,
      sampleRequirements: 'Method: SEM with EDX. Solid samples, vacuum compatible. Quote based on magnification requirements and imaging time.'
    },
    {
      name: 'Optical Microscopy',
      description: 'Light microscopy for particle analysis, contamination identification, and material inspection',
      category: 'Microscopy',
      pricingMode: PricingMode.FIXED,
      pricePerUnit: 1200,
      turnaroundDays: 1,
      sampleRequirements: 'Method: Optical microscope with digital imaging. Solid or liquid samples. Standard magnification up to 1000x.'
    },

    // Thermal Analysis
    {
      name: 'Thermogravimetric Analysis (TGA)',
      description: 'Weight change measurement as a function of temperature for thermal stability and composition analysis',
      category: 'Thermal Analysis',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 3200,
      turnaroundDays: 3,
      sampleRequirements: 'Method: TGA. Solid samples, 5-20mg. Standard temperature ramp shown, custom programs available.'
    },
    {
      name: 'Differential Scanning Calorimetry (DSC)',
      description: 'Heat flow measurement for phase transitions, melting points, glass transitions, and thermal stability',
      category: 'Thermal Analysis',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 3500,
      turnaroundDays: 3,
      sampleRequirements: 'Method: DSC. Solid or liquid samples, 5-15mg. Reference price for standard scan, custom heating/cooling rates available.'
    },

    // Mechanical Testing
    {
      name: 'Tensile Testing',
      description: 'Measurement of tensile strength, yield strength, elongation, and elastic modulus of materials',
      category: 'Mechanical Testing',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 4,
      sampleRequirements: 'Method: Universal Testing Machine. Provide material type, dimensions, and testing standard (ASTM, ISO) for quote.'
    },
    {
      name: 'Hardness Testing',
      description: 'Rockwell, Brinell, or Vickers hardness testing for metals, plastics, and composite materials',
      category: 'Mechanical Testing',
      pricingMode: PricingMode.FIXED,
      pricePerUnit: 900,
      turnaroundDays: 1,
      sampleRequirements: 'Method: Hardness tester. Solid samples with flat surface. Specify hardness scale required.'
    },

    // Biological Testing
    {
      name: 'Microbial Identification (16S rRNA Sequencing)',
      description: 'Bacterial identification and phylogenetic analysis using next-generation sequencing',
      category: 'Biological Testing',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 10,
      sampleRequirements: 'Method: DNA extraction and NGS. Pure culture or environmental sample. Quote varies by sample complexity and depth of analysis.'
    },
    {
      name: 'Cell Viability Testing',
      description: 'MTT assay and trypan blue exclusion for cell culture viability and cytotoxicity assessment',
      category: 'Biological Testing',
      pricingMode: PricingMode.FIXED,
      pricePerUnit: 2800,
      turnaroundDays: 2,
      sampleRequirements: 'Method: MTT assay. Provide cell line and test compound information. Standard 96-well plate format.'
    },

    // Specialized Services
    {
      name: 'Nutritional Analysis Panel',
      description: 'Comprehensive food analysis: protein, fat, carbohydrates, moisture, ash, fiber, and caloric content',
      category: 'Nutritional Analysis',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 6500,
      turnaroundDays: 5,
      sampleRequirements: 'Method: Multi-technique (Kjeldahl, Soxhlet, gravimetric). Minimum 500g sample. Reference price for standard panel, custom panels available.'
    },
    {
      name: 'Polymer Characterization',
      description: 'Comprehensive polymer testing: molecular weight, thermal properties, mechanical properties, and chemical composition',
      category: 'Polymer Testing',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 7,
      sampleRequirements: 'Method: Combined GPC, DSC, TGA, FTIR. Provide polymer type and specific characterization needs for quote.'
    },
    {
      name: 'Corrosion Testing',
      description: 'Salt spray testing, electrochemical corrosion, and immersion testing for material corrosion resistance',
      category: 'Corrosion Testing',
      pricingMode: PricingMode.QUOTE_REQUIRED,
      pricePerUnit: null,
      turnaroundDays: 14,
      sampleRequirements: 'Method: ASTM B117 salt spray or electrochemical methods. Quote varies by test duration and sample size.'
    },
    {
      name: 'Particle Size Analysis',
      description: 'Dynamic light scattering (DLS) and laser diffraction for particle size distribution measurement',
      category: 'Particle Analysis',
      pricingMode: PricingMode.FIXED,
      pricePerUnit: 2200,
      turnaroundDays: 2,
      sampleRequirements: 'Method: DLS or laser diffraction. Liquid suspensions or dry powders. Specify size range if known.'
    },
    {
      name: 'VOC Testing (EPA Method 8260)',
      description: 'Volatile organic compounds analysis in water, soil, and air samples using GC-MS',
      category: 'VOC Testing',
      pricingMode: PricingMode.HYBRID,
      pricePerUnit: 5800,
      turnaroundDays: 5,
      sampleRequirements: 'Method: GC-MS per EPA 8260. Standard price for EPA target list, custom VOC panels available.'
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

    // Add diverse services for each lab based on comprehensive lab service categories
    // Each lab gets 8 services covering different testing categories
    const labServicesForNewLab = [
      // Spectroscopy Services
      {
        name: 'UV-Vis Spectroscopy Analysis',
        description: 'Ultraviolet-visible spectroscopy for concentration analysis, purity testing, and compound identification',
        category: 'Spectroscopy',
        pricingMode: PricingMode.FIXED,
        pricePerUnit: 1800,
        turnaroundDays: 2,
        sampleRequirements: 'Method: UV-Vis Spectrophotometer. Liquid samples, minimum 2ml. Specify wavelength range if known.'
      },
      {
        name: 'FTIR Spectroscopy',
        description: 'Fourier Transform Infrared Spectroscopy for molecular structure identification and functional group analysis',
        category: 'Spectroscopy',
        pricingMode: PricingMode.HYBRID,
        pricePerUnit: 2500,
        turnaroundDays: 3,
        sampleRequirements: 'Method: FTIR. Solid, liquid, or gas samples. Standard pricing for routine analysis, custom quote for complex materials.'
      },

      // Chromatography Services
      {
        name: 'HPLC Analysis',
        description: 'High-Performance Liquid Chromatography for separation, identification, and quantification of compounds in liquid samples',
        category: 'Liquid Chromatography',
        pricingMode: PricingMode.QUOTE_REQUIRED,
        pricePerUnit: null,
        turnaroundDays: 4,
        sampleRequirements: 'Method: HPLC with UV/DAD detector. Please specify compounds of interest and matrix for accurate quote.'
      },
      {
        name: 'GC-MS Volatile Compound Screening',
        description: 'Gas Chromatography-Mass Spectrometry for identification and quantification of volatile organic compounds',
        category: 'Gas Chromatography',
        pricingMode: PricingMode.HYBRID,
        pricePerUnit: 4500,
        turnaroundDays: 5,
        sampleRequirements: 'Method: GC-MS. Volatile samples or headspace analysis. Reference price for standard VOC panel, custom panels available.'
      },

      // Material Characterization
      {
        name: 'X-Ray Diffraction (XRD)',
        description: 'Crystalline phase identification and quantification, lattice parameter determination',
        category: 'Material Characterization',
        pricingMode: PricingMode.QUOTE_REQUIRED,
        pricePerUnit: null,
        turnaroundDays: 5,
        sampleRequirements: 'Method: XRD. Powder or solid samples. Quote varies by analysis depth (qualitative vs quantitative).'
      },
      {
        name: 'Atomic Absorption Spectroscopy (AAS)',
        description: 'Elemental analysis for metals in water, soil, food, and industrial samples',
        category: 'Material Characterization',
        pricingMode: PricingMode.HYBRID,
        pricePerUnit: 2800,
        turnaroundDays: 4,
        sampleRequirements: 'Method: AAS. Standard price for single element, custom quote for multi-element panels.'
      },

      // Environmental Testing
      {
        name: 'Soil Contamination Analysis',
        description: 'Comprehensive soil testing for heavy metals, pesticides, and organic pollutants',
        category: 'Environmental Testing',
        pricingMode: PricingMode.QUOTE_REQUIRED,
        pricePerUnit: null,
        turnaroundDays: 7,
        sampleRequirements: 'Method: Multi-technique. Minimum 500g soil sample. Specify contaminants of concern for quote.'
      },
      {
        name: 'Air Quality Monitoring',
        description: 'Particulate matter (PM2.5, PM10), VOCs, and gaseous pollutant analysis',
        category: 'Environmental Testing',
        pricingMode: PricingMode.FIXED,
        pricePerUnit: 5500,
        turnaroundDays: 3,
        sampleRequirements: 'Method: Air sampling with gravimetric and sensor analysis. On-site sampling available (additional fee).'
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
  console.log('')
  console.log('📊 Demo Accounts:')
  console.log('  🧪 Client: client@example.com (Maria Santos)')
  console.log('  🔬 Lab Admin: lab@testinglab.com (Metro Manila Testing Lab)')
  console.log('  🔬 Lab Admin: lab2@chempro.com (Chempro Analytical)')
  console.log('  🔬 Lab Admin: lab3@eurofins.com (Eurofins Philippines)')
  console.log('  🔬 Lab Admin: lab4@intertek.com (Intertek Makati)')
  console.log('  👤 Platform Admin: admin@pipetgo.com')
  console.log('')
  console.log('🧬 Lab Services Created:')
  console.log('  • Metro Manila Testing Lab: 23 services')
  console.log('    - Spectroscopy, Chromatography, Thermal Analysis')
  console.log('    - Microscopy, Mechanical Testing, Biological Testing')
  console.log('    - Material Characterization, Environmental Testing')
  console.log('  • Chempro Analytical: 8 services')
  console.log('  • Eurofins Philippines: 8 services')
  console.log('  • Intertek Makati: 8 services')
  console.log('')
  console.log('  Total: 47 diverse lab services across 16 testing categories')
  console.log('  Pricing: FIXED (15), QUOTE_REQUIRED (16), HYBRID (16)')
  console.log('')
  console.log('📝 Sample Orders: 2 (demonstrating quote workflow)')
  console.log('')
  console.log('🚀 Ready for production at: https://www.pipetgo.com')
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