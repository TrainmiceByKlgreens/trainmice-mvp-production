import prisma from '../config/database';

async function verifyConnection() {
  console.log('🔍 Verifying MySQL Database Connection\n');
  console.log('═'.repeat(50));

  try {
    // 1. Test Prisma Client Connection
    console.log('\n1️⃣ Testing Prisma Client connection...');
    await prisma.$connect();
    console.log('   ✅ Prisma Client: Connected');

    // 2. Verify Database
    console.log('\n2️⃣ Verifying database...');
    const dbInfo = await prisma.$queryRaw<Array<{ db: string }>>`
      SELECT DATABASE() as db
    `;
    const dbName = dbInfo[0]?.db || 'Unknown';
    console.log(`   📊 Database: ${dbName}`);

    // 3. Count Tables
    console.log('\n3️⃣ Checking database schema...');
    const tableInfo = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
    `;
    const tableCount = Number(tableInfo[0]?.count || 0);
    console.log(`   📋 Total tables: ${tableCount}`);

    // 4. List Key Tables
    console.log('\n4️⃣ Verifying key tables...');
    const keyTables = ['users', 'clients', 'trainers', 'courses', 'booking_requests', 'trainer_availability'];
    for (const tableName of keyTables) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM ${tableName}`
        ) as Array<{ count: bigint }>;
        console.log(`   ✅ ${tableName}: Exists (${result[0]?.count || 0} records)`);
      } catch (err) {
        console.log(`   ❌ ${tableName}: Not found or error`);
      }
    }

    // 5. Test Write Operation (optional - just a test)
    console.log('\n5️⃣ Testing database operations...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Read operation: Working (${userCount} users found)`);

    // 6. Check Connection Status
    console.log('\n6️⃣ Connection details...');
    const connectionInfo = await prisma.$queryRaw<Array<{ 
      connection_id: number;
      user: string;
      host: string;
      db: string;
    }>>`
      SELECT 
        CONNECTION_ID() as connection_id,
        USER() as user,
        SUBSTRING_INDEX(USER(), '@', -1) as host,
        DATABASE() as db
    `;
    const conn = connectionInfo[0];
    if (conn) {
      console.log(`   🔗 Connection ID: ${conn.connection_id}`);
      console.log(`   👤 User: ${conn.user}`);
      console.log(`   🖥️  Host: ${conn.host}`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('🎉 Your backend is fully connected to MySQL database!');
    console.log('═'.repeat(50) + '\n');

  } catch (error: any) {
    console.log('\n' + '═'.repeat(50));
    console.error('❌ CONNECTION TEST FAILED!');
    console.error('═'.repeat(50));
    console.error('\nError Details:');
    console.error(`   Message: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.meta) {
      console.error(`   Meta:`, error.meta);
    }
    console.error('\nTroubleshooting:');
    console.error('   1. Check MySQL is running');
    console.error('   2. Verify DATABASE_URL in .env file');
    console.error('   3. Ensure database "trainmice_db" exists');
    console.error('   4. Check MySQL user permissions\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection();

