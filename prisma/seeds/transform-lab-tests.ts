// prisma/seeds/transform-lab-tests.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Raw lab tests data from your SQL file
const rawLabTests = [
  {
    id: 1,
    name: 'Fatty Acid Composition Analysis',
    keywords: 'Fatty acids',
    description: 'Determination and profiling of fatty acid composition in food or biological samples.',
    method: 'Combines GC and HPLC techniques',
    price: 150,
    turnaroundTime: '3 days'
  },
  {
    id: 2,
    name: 'Gas Chromatography Screening',
    keywords: 'gas chromatography',
    description: 'Qualitative and quantitative analysis of volatile compounds using gas chromatography.',
    method: 'Gas Chromatography (GC)',
    price: 200,
    turnaroundTime: '2 days'
  },
  {
    id: 3,
    name: 'Trace Elements Analysis',
    keywords: 'trace elements',
    description: 'Measurement of trace elements and heavy metals in samples with sensitivity.',
    method: 'ICP-MS/ICP-OES',
    price: 250,
    turnaroundTime: '4 days'
  },
  {
    id: 4,
    name: 'Acid Value Determination',
    keywords: 'acid value',
    description: 'Evaluation of acid value to measure free fatty acids in oils and fats.',
    method: 'Titrimetric analysis',
    price: 100,
    turnaroundTime: '2 days'
  },
  {
    id: 5,
    name: 'High Performance Liquid Chromatography (HPLC) Analysis',
    keywords: 'HPLC',
    description: 'Separation and quantification of compounds using HPLC techniques.',
    method: 'HPLC',
    price: 220,
    turnaroundTime: '3 days'
  },
  // ... rest of your data
]

// Category mapping based on your test names and methods
const categoryMapping: Record<string, string> = {
  'Fatty': 'Food Analysis',
  'Gas Chromatography': 'Chemical Analysis',
  'Trace Elements': 'Environmental Testing',
  'Acid Value': 'Food Quality',
  'HPLC': 'Chemical Analysis',
  'Glass Transition': 'Materials Testing',
  'TFA': 'Food Analysis',
  'Protein': 'Food Analysis',
  'Moisture': 'Food Quality',
  'Vitamin': 'Nutritional Analysis',
  'Pesticide': 'Environmental Testing',
  'Microbial': 'Food Safety',
  'Sugar': 'Food Analysis'
}

// Transform turnaround time string to days integer
function parseTurnaroundDays(timeString: string): number {
  const match = timeString.match(/(\d+)\s*day/i)
  return match ? parseInt(match[1]) : 3 // default to 3 days
}

// Determine category from test name
function determineCategory(name: string, keywords: string): string {
  const searchText = `${name} ${keywords}`.toLowerCase()
  
  for (const [key, category] of Object.entries(categoryMapping)) {
    if (searchText.includes(key.toLowerCase())) {
      return category
    }
  }
  
  return 'General Testing' // fallback
}

// Determine unit type based on test characteristics
function determineUnitType(name: string, method: string): string {
  const text = `${name} ${method}`.toLowerCase()
  
  if (text.includes('composition') || text.includes('profile')) {
    return 'per_sample'
  }
  if (text.includes('screening') || text.includes('residue')) {
    return 'per_sample'
  }
  if (text.includes('content') || text.includes('quantification')) {
    return 'per_sample'
  }
  
  return 'per_sample' // most lab tests are per sample
}

export async function seedLabTests() {
  console.log('🧪 Transforming and seeding lab test data...')
  
  // First, create some sample labs to associate tests with
  const sampleLabs = await createSampleLabs()
  
  // Transform and create lab services
  const transformedServices = rawLabTests.map((test, index) => ({
    name: test.name,
    description: test.description,
    category: determineCategory(test.name, test.keywords),
    pricePerUnit: test.price,
    unitType: determineUnitType(test.name, test.method),
    turnaroundDays: parseTurnaroundDays(test.turnaroundTime),
    sampleRequirements: `Method: ${test.method}. Contact lab for specific requirements.`,
    // Distribute tests across sample labs
    labId: sampleLabs[index % sampleLabs.length].id,
    active: true
  }))
  
  // Create all services
  const createdServices = await prisma.labService.createMany({
    data: transformedServices,
    skipDuplicates: true
  })
  
  console.log(`✅ Created ${createdServices.count} lab services`)
  
  // Create search index data for keywords (stored as JSON for now)
  await updateSearchKeywords(transformedServices)
  
  return createdServices
}

async function createSampleLabs() {
  // Create sample labs to associate tests with
  const labsData = [
    {
      name: 'Metro Manila Analytical Laboratory',
      description: 'Full-service analytical testing for food and environmental samples',
      location: {
        address: '123 Science Street, Diliman',
        city: 'Quezon City',
        coordinates: { lat: 14.6760, lng: 121.0437 }
      },
      certifications: ['ISO 17025', 'DOH Licensed', 'BPI Accredited']
    },
    {
      name: 'Advanced Chemical Testing Services',
      description: 'Specialized in chromatography and trace analysis',
      location: {
        address: '456 Research Avenue, BGC',
        city: 'Taguig City', 
        coordinates: { lat: 14.5176, lng: 121.0509 }
      },
      certifications: ['ISO 17025', 'FDA Accredited']
    },
    {
      name: 'Philippines Food Safety Lab',
      description: 'Food safety and nutritional analysis experts',
      location: {
        address: '789 Health Boulevard, Ortigas',
        city: 'Pasig City',
        coordinates: { lat: 14.5832, lng: 121.0634 }
      },
      certifications: ['DOH Licensed', 'HACCP Certified', 'BPI Accredited']
    }
  ]
  
  const createdLabs = []
  
  for (const labData of labsData) {
    // Create admin user for each lab
    const labAdmin = await prisma.user.upsert({
      where: { email: `admin@${labData.name.toLowerCase().replace(/\s+/g, '')}.com` },
      update: {},
      create: {
        email: `admin@${labData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        name: `${labData.name} Admin`,
        role: 'LAB_ADMIN'
      }
    })
    
    const lab = await prisma.lab.upsert({
      where: { id: `lab-${createdLabs.length + 1}` },
      update: {},
      create: {
        id: `lab-${createdLabs.length + 1}`,
        ownerId: labAdmin.id,
        ...labData
      }
    })
    
    createdLabs.push(lab)
  }
  
  return createdLabs
}

async function updateSearchKeywords(services: any[]) {
  // For now, we'll store search keywords in a simple way
  // Later, implement full-text search with PostgreSQL or Elasticsearch
  
  console.log('📝 Search optimization data prepared')
  // This could populate a search_keywords table or update search vectors
}

// Export individual tests for reference in other seed files
export const labTestsData = rawLabTests