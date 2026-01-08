import { prisma } from '../src/lib/db/prisma';

async function checkIds() {
  try {
    const experiences = await prisma.experiences.findMany({
      where: { status: 'active' },
      select: { id: true, title: true },
      take: 10,
    });

    console.log('Sample Experience IDs from database:');
    experiences.forEach((exp, idx) => {
      console.log(`${idx + 1}. ${exp.title}`);
      console.log(`   ID: "${exp.id}"`);
      console.log(`   ID Length: ${exp.id.length}`);
      console.log(`   ID Type: ${typeof exp.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIds();
