import prisma from '../config/database';

async function setupTriggers() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');

        // 1. Create the notification function
        console.log('📜 Creating notification function...');
        await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION notify_table_update()
      RETURNS trigger AS $$
      DECLARE
        payload JSON;
      BEGIN
        payload = json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'data', CASE WHEN TG_OP = 'DELETE' THEN old ELSE "new" END
        );
        PERFORM pg_notify('table_update', payload::text);
        RETURN "new";
      END;
      $$ LANGUAGE plpgsql;
    `);

        // 2. Create triggers for main tables
        const tables = ['booking_requests', 'courses', 'events', 'notifications', 'messages', 'trainer_messages', 'event_enquiries'];

        for (const table of tables) {
            console.log(`📜 Setting up trigger for ${table}...`);
            await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${table}_realtime_trigger ON ${table}`);
            await prisma.$executeRawUnsafe(`
        CREATE TRIGGER ${table}_realtime_trigger 
        AFTER INSERT OR UPDATE OR DELETE ON ${table} 
        FOR EACH ROW EXECUTE FUNCTION notify_table_update()
      `);
        }

        console.log('✅ Real-time triggers setup successfully');

        await prisma.$disconnect();
    } catch (error: any) {
        console.error('❌ Error setting up triggers:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

setupTriggers();
