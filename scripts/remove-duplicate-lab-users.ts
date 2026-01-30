import { prisma } from '../src/lib/db';

const OLD_EMAILS = ['lab2@chempro.com', 'lab3@eurofins.com', 'lab4@intertek.com'];

async function cleanup() {
  const dryRun = !process.argv.includes('--execute');
  
  console.log('🔍 Finding old duplicate records...\n');
  
  let foundCount = 0;
  
  for (const email of OLD_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedLabs: {
          include: {
            services: { select: { id: true } },
            orders: { select: { id: true } }
          }
        }
      }
    });
    
    if (!user) {
      console.log(`✅ ${email} - Already removed`);
      continue;
    }
    
    foundCount++;
    console.log(`⚠️  ${email} - Found`);
    for (const lab of user.ownedLabs) {
      console.log(`   Lab: ${lab.name}`);
      console.log(`   Services: ${lab.services.length}, Orders: ${lab.orders.length}`);
    }
    
    if (dryRun) {
      console.log(`   Action: Would DELETE this user and all associated data\n`);
    } else {
      console.log(`   Deleting...`);
      
      // Transaction: Delete services, labs, then user
      await prisma.$transaction(async (tx) => {
        for (const lab of user.ownedLabs) {
          // Delete services
          await tx.labService.deleteMany({
            where: { labId: lab.id }
          });
          
          // Delete lab
          await tx.lab.delete({
            where: { id: lab.id }
          });
        }
        
        // Delete user
        await tx.user.delete({
          where: { id: user.id }
        });
      });
      
      console.log(`   ✅ Deleted\n`);
    }
  }
  
  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('Run with --execute to apply changes\n');
  } else {
    console.log(`\n✅ Cleanup complete! Removed ${foundCount} duplicate user(s)\n`);
  }
  
  await prisma.$disconnect();
}

cleanup().catch(console.error);
