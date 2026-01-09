import { prisma } from '../src/lib/db/prisma';

async function testConnection() {
  try {
    console.log('Testing database connection...');

    const count = await prisma.experiences.count();
    console.log(`✅ Connection successful! Found ${count} experiences.`);

    const sample = await prisma.experiences.findFirst();
    console.log('✅ Sample experience:', sample?.title);

    // Test with active filter
    const activeCount = await prisma.experiences.count({
      where: { status: 'active' }
    });
    console.log(`✅ Active experiences: ${activeCount}`);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
