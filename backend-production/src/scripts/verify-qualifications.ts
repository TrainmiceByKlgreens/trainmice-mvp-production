import prisma from '../config/database';

async function verifyQualifications() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    const totalRecords = await prisma.qualification.count();
    console.log(`📊 Total qualification records: ${totalRecords}\n`);

    // Count by trainer
    const recordsByTrainer = await prisma.qualification.groupBy({
      by: ['trainerId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    console.log('📋 Top 10 trainers by qualification entries:');
    for (const record of recordsByTrainer) {
      const trainer = await prisma.trainer.findUnique({
        where: { id: record.trainerId },
        select: { fullName: true, customTrainerId: true },
      });
      console.log(`   ${trainer?.fullName || 'Unknown'} (${trainer?.customTrainerId || 'N/A'}): ${record._count.id} qualifications`);
    }

    // Count by qualification type
    const byType = await prisma.qualification.groupBy({
      by: ['qualificationType'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    console.log('\n📋 Qualifications by type:');
    for (const record of byType) {
      const type = record.qualificationType || 'Not specified';
      console.log(`   ${type}: ${record._count.id}`);
    }

    // Sample qualifications
    console.log('\n📋 Sample qualifications (latest 5):');
    const sampleQualifications = await prisma.qualification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        trainer: {
          select: { fullName: true, customTrainerId: true },
        },
      },
    });

    sampleQualifications.forEach((qual, index) => {
      console.log(`   ${index + 1}. ${qual.title} - ${qual.trainer?.fullName || 'Unknown'} (${qual.qualificationType || 'N/A'})`);
    });

  } catch (error: any) {
    console.error('❌ Error verifying qualifications:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyQualifications();

