import prisma from '../config/database';

async function verifyPasswordResetFields() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check if we can query the new fields
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        passwordResetToken: true,
        passwordResetExpiry: true,
      },
    });

    if (sampleUser) {
      console.log('✅ Password reset fields are accessible!');
      console.log(`   Sample user: ${sampleUser.email}`);
      console.log(`   passwordResetToken: ${sampleUser.passwordResetToken ? 'Field exists' : 'null (expected)'}`);
      console.log(`   passwordResetExpiry: ${sampleUser.passwordResetExpiry ? 'Field exists' : 'null (expected)'}`);
    } else {
      console.log('⚠️  No users found in database');
    }

    console.log('\n✅ Migration successfully applied! Password reset fields are ready to use.');

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Unknown column')) {
      console.error('   The password reset fields may not have been added to the database.');
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyPasswordResetFields();

