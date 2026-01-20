import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// Get DATABASE_URL from command line args or environment
const dbUrl = process.argv[2] || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is required. Provide it as:');
  console.error('  1. Command line argument: tsx src/scripts/import-course-schedule.ts "mysql://..."');
  console.error('  2. Environment variable: DATABASE_URL="mysql://..." tsx src/scripts/import-course-schedule.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

interface ScheduleRow {
  id: string;
  course_id: string;
  day_number: string;
  start_time: string;
  end_time: string;
  module_title: string;
  submodule_title: string;
  duration_minutes: string;
  created_at: string;
}

// Helper function to calculate duration in minutes from time strings
function calculateDurationMinutes(startTime: string, endTime: string): number {
  try {
    const parseTime = (timeStr: string): number => {
      const [hours, minutes = '0'] = timeStr.split(':');
      return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // Handle case where end time is next day (e.g., 23:00 to 02:00)
    if (end < start) {
      return (24 * 60 - start) + end;
    }
    
    return end - start;
  } catch (error) {
    console.warn(`Could not parse time: ${startTime} - ${endTime}`);
    return 0;
  }
}

// Helper function to parse submodule_title from string representation to JSON
function parseSubmoduleTitle(value: string): any[] | null {
  if (!value || value.trim() === '' || value.trim() === '[]') {
    return null;
  }
  
  const trimmed = value.trim();
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    // If it's a Python-style string representation like "['item1', 'item2']"
    try {
      // Check if it looks like a Python list
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const content = trimmed.slice(1, -1).trim();
        if (content === '') {
          return null;
        }
        
        // Simple regex to extract quoted strings
        // Match strings in single or double quotes
        const items: string[] = [];
        const regex = /['"]([^'"]*)['"]/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          items.push(match[1].trim());
        }
        
        return items.length > 0 ? items : null;
      }
      
      return null;
    } catch (e2) {
      console.warn(`Could not parse submodule_title: ${value}`);
      return null;
    }
  }
}

async function importCourseSchedule() {
  const csvPath = path.join(__dirname, '../../output_file (1).csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV with proper options for multi-line fields
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
    quote: '"',
    escape: '"',
    ltrim: true,
    rtrim: true,
  }) as ScheduleRow[];

  console.log(`Found ${records.length} records to import`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    
    try {
      // Validate required fields
      if (!row.id || !row.course_id || !row.day_number || !row.start_time || !row.end_time || !row.module_title) {
        console.warn(`Skipping row ${i + 2}: Missing required fields`, row);
        skippedCount++;
        continue;
      }

      // Check if record already exists
      const existing = await prisma.courseSchedule.findUnique({
        where: { id: row.id },
      });

      if (existing) {
        console.log(`Record ${row.id} already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Verify course exists
      const course = await prisma.course.findUnique({
        where: { id: row.course_id },
      });

      if (!course) {
        console.warn(`Course ${row.course_id} not found, skipping schedule record ${row.id}`);
        skippedCount++;
        continue;
      }

      // Parse and prepare data
      const dayNumber = parseInt(row.day_number, 10);
      if (isNaN(dayNumber)) {
        console.warn(`Invalid day_number for row ${i + 2}: ${row.day_number}`);
        skippedCount++;
        continue;
      }

      // Calculate duration_minutes if missing
      let durationMinutes = 0;
      if (row.duration_minutes && row.duration_minutes.trim() !== '') {
        const parsed = parseInt(row.duration_minutes, 10);
        if (!isNaN(parsed)) {
          durationMinutes = parsed;
        }
      }
      
      // If still 0, calculate from start_time and end_time
      if (durationMinutes === 0) {
        durationMinutes = calculateDurationMinutes(row.start_time, row.end_time);
      }

      // Parse submodule_title
      const submoduleTitle = parseSubmoduleTitle(row.submodule_title);

      // Parse created_at, use current time if invalid
      let createdAt = new Date();
      if (row.created_at && row.created_at.trim() !== '') {
        // Try to parse the date, but the format "28:53.6" doesn't look like a date
        // So we'll use current timestamp
        const parsedDate = new Date(row.created_at);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }

      // Clean module_title (remove extra whitespace)
      const moduleTitle = row.module_title.trim();

      // Insert into database
      await prisma.courseSchedule.create({
        data: {
          id: row.id,
          courseId: row.course_id,
          dayNumber: dayNumber,
          startTime: row.start_time.trim(),
          endTime: row.end_time.trim(),
          moduleTitle: moduleTitle,
          submoduleTitle: submoduleTitle,
          durationMinutes: durationMinutes,
          createdAt: createdAt,
        },
      });

      successCount++;
      
      if ((i + 1) % 100 === 0) {
        console.log(`Processed ${i + 1}/${records.length} records...`);
      }
    } catch (error: any) {
      console.error(`Error importing row ${i + 2}:`, error.message);
      console.error('Row data:', row);
      errorCount++;
    }
  }

  console.log('\nImport completed!');
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total processed: ${successCount + skippedCount + errorCount}/${records.length}`);
}

// Run the import
importCourseSchedule()
  .then(() => {
    console.log('Import script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

