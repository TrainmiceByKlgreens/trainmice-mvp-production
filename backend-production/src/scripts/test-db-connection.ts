import prisma from '../config/database';

async function testConnection() {
  try {
    console.log('🔌 Testing MySQL database connection...\n');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma Client connected successfully!');

    // Get current database
    const dbInfo = await prisma.$queryRaw<Array<{ db: string }>>`
      SELECT DATABASE() as db
    `;
    console.log(`📊 Current database: ${dbInfo[0]?.db || 'Unknown'}`);

    // Count tables
    const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;
    console.log(`📋 Tables in database: ${tableCount[0]?.count || 0}`);

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);

    // List some tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name
      LIMIT 10
    `;
    console.log('\n📑 Sample tables:');
    tables.forEach((table) => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n✅ Database connection test PASSED!');
    console.log('🎉 Your backend is successfully connected to MySQL!\n');

  } catch (error: any) {
    console.error('\n❌ Database connection test FAILED!');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

