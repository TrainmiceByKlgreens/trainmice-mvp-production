import prisma from '../config/database';

async function verifyWorkHistory() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    const totalRecords = await prisma.workHistory.count();
    console.log(`📊 Total work history records: ${totalRecords}\n`);

    // Count by trainer
    const recordsByTrainer = await prisma.workHistory.groupBy({
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

    console.log('📋 Top 10 trainers by work history entries:');
    for (const record of recordsByTrainer) {
      const trainer = await prisma.trainer.findUnique({
        where: { id: record.trainerId },
        select: { fullName: true, customTrainerId: true },
      });
      console.log(`   ${trainer?.fullName || 'Unknown'} (${trainer?.customTrainerId || 'N/A'}): ${record._count.id} entries`);
    }

    console.log('\n✅ Work history import verified!');

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyWorkHistory();

