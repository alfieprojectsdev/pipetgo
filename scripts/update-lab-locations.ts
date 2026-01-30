import { prisma } from '../src/lib/db';

const LOCATION_UPDATES = [
  {
    email: 'lab2@pgtestlab.com',
    labName: 'Testing Lab 2',
    address: '200 Testing Street, Brgy. Sample',
    city: 'Pasig City',
    coordinates: { lat: 14.5995, lng: 120.9842 }
  },
  {
    email: 'lab3@pgtstlab.com',
    labName: 'Testing Lab 3',
    address: '300 Laboratory Avenue, Brgy. Demo',
    city: 'Quezon City',
    coordinates: { lat: 14.6042, lng: 120.9822 }
  },
  {
    email: 'lab4@testlabpg.com',
    labName: 'Testing Lab 4',
    address: '400 Analysis Road, Brgy. Test',
    city: 'Makati City',
    coordinates: { lat: 14.5888, lng: 120.9903 }
  }
];

async function updateLocations() {
  const dryRun = !process.argv.includes('--execute');
  
  console.log(dryRun ? '\n⚠️  DRY RUN MODE\n' : '\n🚨 EXECUTE MODE\n');
  
  for (const update of LOCATION_UPDATES) {
    const user = await prisma.user.findUnique({
      where: { email: update.email },
      include: { ownedLabs: true }
    });
    
    if (!user || user.ownedLabs.length === 0) {
      console.log(`❌ ${update.email} - Not found`);
      continue;
    }
    
    const lab = user.ownedLabs[0];
    console.log(`\n📍 ${lab.name}`);
    console.log(`   Current: ${lab.location.address}`);
    console.log(`            (${lab.location.coordinates.lat}, ${lab.location.coordinates.lng})`);
    console.log(`   New:     ${update.address}`);
    console.log(`            (${update.coordinates.lat}, ${update.coordinates.lng})`);
    
    if (!dryRun) {
      await prisma.lab.update({
        where: { id: lab.id },
        data: {
          location: {
            address: update.address,
            city: update.city,
            coordinates: update.coordinates
          }
        }
      });
      console.log(`   ✅ Updated`);
    }
  }
  
  if (dryRun) {
    console.log(`\n⚠️  Run with --execute to apply changes\n`);
  } else {
    console.log(`\n✅ All locations updated!\n`);
  }
  
  await prisma.$disconnect();
}

updateLocations().catch(console.error);
