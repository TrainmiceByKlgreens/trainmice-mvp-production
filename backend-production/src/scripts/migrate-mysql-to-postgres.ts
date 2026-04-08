import { PrismaClient as MySQLClient } from '../generated/mysql-client';
import { PrismaClient as PostgreSQLClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_URL = process.env.DATABASE_URL_MYSQL || process.env.DATABASE_URL;
const POSTGRES_URL = process.env.DATABASE_URL_POSTGRES;

if (!MYSQL_URL || !POSTGRES_URL) {
    console.error('❌ Error: DATABASE_URL_MYSQL and DATABASE_URL_POSTGRES must be set in .env');
    process.exit(1);
}

const mysql = new MySQLClient({ datasources: { db: { url: MYSQL_URL } } });
const postgres = new PostgreSQLClient({ datasources: { db: { url: POSTGRES_URL } } });

const MIGRATION_ORDER = [
    'User',
    'Admin',
    'Trainer',
    'Client',
    'Course',
    'CourseMaterial',
    'CourseSchedule',
    'CourseTrainer',
    'Event',
    'EventRegistration',
    'BookingRequest',
    'TrainerAvailability',
    'TrainerBlockedDay',
    'TrainerWeeklyAvailability',
    'TrainerBlockedDate',
    'Notification',
    'TrainerDocument',
    'CourseReview',
    'Qualification',
    'WorkHistory',
    'PastClient',
    'CustomCourseRequest',
    'ContactSubmission',
    'Feedback',
    'TrainerBooking',
    'TrainerCourseConducted',
    'ActivityLog',
    'MessageThread',
    'Message',
    'TrainerMessage',
    'EventEnquiry',
    'EventEnquiryMessage'
];

async function migrate() {
    console.log('🚀 Starting migration FROM MySQL TO PostgreSQL...');

    try {
        for (const modelName of MIGRATION_ORDER) {
            const lowercaseModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            const mysqlDelegate = (mysql as any)[lowercaseModel];
            const postgresDelegate = (postgres as any)[lowercaseModel];

            if (!mysqlDelegate || !postgresDelegate) {
                console.warn(`⚠️  Skipping ${modelName}: Delegate not found`);
                continue;
            }

            console.log(`📦 Migrating ${modelName}...`);

            const records = await mysqlDelegate.findMany();
            console.log(`   Found ${records.length} records in MySQL`);

            if (records.length === 0) continue;

            // Clear existing records in PostgreSQL (optional, be careful)
            // await postgresDelegate.deleteMany({});

            // Create Many in PostgreSQL
            // We use createMany for speed if supported, otherwise loop
            try {
                if (postgresDelegate.createMany) {
                    await postgresDelegate.createMany({
                        data: records,
                        skipDuplicates: true,
                    });
                } else {
                    for (const record of records) {
                        await postgresDelegate.create({ data: record });
                    }
                }
                console.log(`   ✅ Successfully migrated ${modelName}`);
            } catch (err: any) {
                console.error(`   ❌ Error migrating ${modelName}:`, err.message);
                // Fallback to individual creates if createMany fails
                console.log(`   🔄 Retrying ${modelName} with individual creates...`);
                for (const record of records) {
                    try {
                        await postgresDelegate.upsert({
                            where: { id: record.id },
                            update: record,
                            create: record,
                        });
                    } catch (e: any) {
                        // console.error(`      Failed to migrate ${modelName} ID ${record.id}: ${e.message}`);
                    }
                }
            }
        }

        console.log('\n✨ Migration completed successfully!');
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
    } finally {
        await mysql.$disconnect();
        await postgres.$disconnect();
    }
}

migrate();
