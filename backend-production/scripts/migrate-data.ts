
import mysql from 'mysql2/promise';
import { Client } from 'pg';
import crypto from 'crypto';

async function migrate() {
    const mysqlUrl = 'mysql://root:IFwWmCuDlhtbtreHLHhXQlmcWFQpNewe@shinkansen.proxy.rlwy.net:26399/railway';
    const pgUrl = 'postgresql://postgres:ELKRALodeNRuKZWkNfyaCptwtLnrdfwU@crossover.proxy.rlwy.net:16561/railway';

    const mysqlConn = await mysql.createConnection(mysqlUrl);
    const pgClient = new Client({ connectionString: pgUrl });
    await pgClient.connect();

    console.log('Connected to both databases.');

    // Helper to parse strings into JSON arrays
    const stringToJsonArray = (str: any) => {
        if (!str) return [];
        if (typeof str !== 'string') return str;

        // Check if it's already JSON
        try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'string') return [parsed.trim()].filter(s => s.length > 0);
            return [parsed];
        } catch (e) {
            // Split by newlines and common bullet points
            return str.split(/[\n\r·•*]+/)
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map(s => s.replace(/^[0-9]+\.\s*/, '')); // Remove "1. " etc.
        }
    };

    const tables = [
        'users', 'admins', 'trainers', 'clients', 'courses', 'events',
        'course_materials', 'course_schedule', 'course_trainers',
        'trainer_availability', 'trainer_bookings', 'trainer_documents',
        'qualifications', 'work_history', 'past_clients',
        'booking_requests', 'event_registrations', 'feedbacks',
        'notifications', 'activity_logs', 'category_images'
    ];

    // Truncate existing data in PG (be careful!)
    console.log('Cleaning up target database...');
    for (const table of [...tables].reverse()) {
        try {
            await pgClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
        } catch (e) {
            // Ignore if table doesn't exist yet in PG
        }
    }

    for (const table of tables) {
        console.log(`\nMigrating table: ${table}...`);

        // 1. Check if table exists in MySQL
        let mysqlRows;
        try {
            const [rows] = await mysqlConn.query(`SELECT * FROM ${table}`);
            mysqlRows = rows as any[];
        } catch (e) {
            console.warn(`Skipping ${table}: Not found in MySQL.`);
            continue;
        }

        if (mysqlRows.length === 0) {
            console.log(`Skipping ${table}: No data.`);
            continue;
        }

        // 2. Get PG columns for this table
        const { rows: pgCols } = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [table]);

        const validPgColumns = pgCols.map(c => c.column_name);
        console.log(`Found ${mysqlRows.length} rows and ${validPgColumns.length} valid columns in PG.`);

        // 3. Insert rows with mapping
        for (const row of mysqlRows) {
            const insertData: Record<string, any> = {};

            // Map MySQL row keys to PG columns
            for (const pgCol of validPgColumns) {
                // Try exact match
                if (row[pgCol] !== undefined) {
                    insertData[pgCol] = row[pgCol];
                } else {
                    // Try camelCase to snake_case mapping
                    const camelKey = pgCol.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                    if (row[camelKey] !== undefined) {
                        insertData[pgCol] = row[camelKey];
                    }
                }

                // Transformations
                if ((table === 'courses' || table === 'events') && insertData[pgCol] !== undefined) {
                    const jsonFields = ['learning_objectives', 'learning_outcomes', 'target_audience', 'methodology', 'prerequisite', 'modules', 'category', 'course_type', 'course_mode'];
                    if (jsonFields.includes(pgCol)) {
                        insertData[pgCol] = JSON.stringify(stringToJsonArray(insertData[pgCol]));
                    }
                }

                // Ensure dates are valid
                if (insertData[pgCol] instanceof Date && isNaN(insertData[pgCol].getTime())) {
                    insertData[pgCol] = null;
                }
            }

            if (Object.keys(insertData).length > 0) {
                const columns = Object.keys(insertData);
                const colNames = columns.map(c => `"${c}"`).join(', ');
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const values = columns.map(col => insertData[col]);

                try {
                    await pgClient.query(`INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`, values);
                } catch (e) {
                    // console.error(`Error inserting into ${table} (row id: ${row.id}): ${e.message}`);
                }
            }
        }
        console.log(`Finished ${table}.`);
    }

    // Final check: populate CourseTrainer from MySQL courses (because PG courses don't have trainer_id)
    console.log('\nFinalizing trainer roles from MySQL courses...');
    try {
        const [mysqlCourses] = await mysqlConn.query('SELECT id, trainer_id FROM courses WHERE trainer_id IS NOT NULL') as any[];
        for (const course of mysqlCourses) {
            try {
                await pgClient.query(`
          INSERT INTO "course_trainers" (id, "courseId", "trainerId", role, assigned_at) 
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT ("courseId", "trainerId") DO NOTHING
        `, [crypto.randomUUID(), course.id, course.trainer_id, 'PRIMARY']);
                console.log(`Synced role for course ${course.id}`);
            } catch (e) {
                console.error(`Error syncing role for course ${course.id}: ${e.message}`);
            }
        }
    } catch (e) {
        console.warn('Could not sync roles from MySQL courses:', e.message);
    }

    console.log('Migration complete!');
    await mysqlConn.end();
    await pgClient.end();
}

migrate().catch(console.error);
