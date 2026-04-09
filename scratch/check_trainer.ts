import prisma from '../backend-production/src/config/database';

async function checkTrainer() {
  try {
    const trainer = await prisma.trainer.findFirst({
      where: {
        OR: [
          { fullName: 'Alam Rafiul' },
          { customTrainerId: 'TR0219' }
        ]
      }
    });
    
    if (trainer) {
      console.log('Trainer found:');
      console.log('ID:', trainer.id);
      console.log('Full Name:', trainer.fullName);
      console.log('Custom ID:', trainer.customTrainerId);
      console.log('Profile Pic Path:', trainer.profilePic);
    } else {
      console.log('Trainer not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainer();
