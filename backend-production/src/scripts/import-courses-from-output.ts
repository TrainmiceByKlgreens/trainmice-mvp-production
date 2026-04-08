import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface CourseRow {
  id: string;
  trainer_id: string;
  course_code: string;
  title: string;
  'certificate.': string;
  'description\n'?: string; // Note: CSV header has newline in column name
  description?: string; // Also support normal description
  target_audience: string;
  methodology: string;
  prerequisite: string;
  learning_objectives: string;
  learning_outcomes: string;
  category: string;
  course_mode: string;
  course_type: string;
  status: string;
  created_by_admin: string;
  course_sequence: string;
  'created_by_admin.1': string;
  assessment: string;
  duration_hours: string;
  duration_unit: string;
  hrdc_claimable: string;
  modules: string;
  venue: string;
  price: string;
  fixed_date: string;
  start_date: string;
  'city '?: string; // Note: column has trailing space
  city?: string; // Also support normal city
  state: string;
  created_at: string;
  updated_at: string;
}

function parseJsonField(value: string): any {
  if (!value || value.trim() === '' || value.trim() === '[]') {
    return [];
  }
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // If parsing fails, try to handle as string array representation
    if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  }
}

function parseDate(value: string): Date | null {
  if (!value || value.trim() === '' || value.includes(':') || !value.includes('-')) {
    return null;
  }
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

function parseBoolean(value: string): boolean {
  if (!value) return false;
  const val = value.trim().toUpperCase();
  return val === '1' || val === 'TRUE' || val === 'YES';
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function parseCourseType(value: string): 'IN_HOUSE' | 'PUBLIC' {
  if (!value) return 'PUBLIC';
  const val = value.trim().toUpperCase();
  if (val === 'IN_HOUSE' || val === 'INHOUSE') return 'IN_HOUSE';
  if (val === 'PUBLIC') return 'PUBLIC';
  return 'PUBLIC';
}

function parseCourseMode(value: string): 'PHYSICAL' | 'VIRTUAL' | 'BOTH' {
  if (!value) return 'PHYSICAL';
  const val = value.trim().toUpperCase();
  if (val === 'PHYSICAL') return 'PHYSICAL';
  if (val === 'VIRTUAL') return 'VIRTUAL';
  if (val === 'BOTH') return 'BOTH';
  return 'PHYSICAL';
}

function parseStatus(value: string): 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED' {
  if (!value) return 'DRAFT';
  const val = value.trim().toUpperCase();
  // Map old statuses to new ones
  if (val === 'ACTIVE' || val === 'COMPLETED') {
    return 'APPROVED';
  }
  if (val === 'CANCELLED') {
    return 'DENIED';
  }
  if (['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED'].includes(val)) {
    return val as any;
  }
  return 'DRAFT';
}

async function importCourses() {
  try {
    console.log('🚀 Starting course import process from OutputCSV.csv...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../OutputCSV.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV with proper handling of multi-line fields
    const records: CourseRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      escape: '"',
      quote: '"',
    });

    // Normalize column names (fix description column with newline)
    const normalizedRecords = records.map((record: any) => {
      // Fix description column name (has newline in header)
      if (record['description\n']) {
        record.description = record['description\n'];
        delete record['description\n'];
      }
      // Fix city column name (has trailing space)
      if (record['city ']) {
        record.city = record['city '];
        delete record['city '];
      }
      return record;
    });

    console.log(`📋 Found ${normalizedRecords.length} course records to import\n`);

    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Import each course
    for (let i = 0; i < records.length; i++) {
      const course = records[i];
      try {
        // Skip if no title (empty/invalid row)
        if (!course.title || course.title.trim() === '' || course.title.trim().length < 3) {
          skippedCount++;
          continue;
        }

        // Check if course already exists by course_code or id
        if (course.course_code && course.course_code.trim() !== '') {
          const existing = await prisma.course.findUnique({
            where: { courseCode: course.course_code.trim() }
          });
          
          if (existing) {
            console.log(`⏭️  Skipping ${course.title.substring(0, 50)}... (course_code: ${course.course_code} already exists)`);
            skippedCount++;
            continue;
          }
        }

        // Check if course exists by ID
        if (course.id && course.id.trim() !== '') {
          try {
            const existingById = await prisma.course.findUnique({
              where: { id: course.id.trim() }
            });
            
            if (existingById) {
              console.log(`⏭️  Skipping ${course.title.substring(0, 50)}... (id: ${course.id} already exists)`);
              skippedCount++;
              continue;
            }
          } catch (e) {
            // Invalid UUID, continue
          }
        }

        // Validate and prepare duration_hours (default to 1 if missing)
        let durationHours = 1;
        if (course.duration_hours && course.duration_hours.trim() !== '') {
          const parsed = parseInt(course.duration_hours);
          if (!isNaN(parsed) && parsed > 0) {
            durationHours = parsed;
          }
        }

        // Check if trainer exists in Trainer table (if trainer_id is provided)
        // Note: Course.trainerId foreign key references Trainer.id, not User.id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let trainerId: string | null = null;
        if (course.trainer_id && course.trainer_id.trim() !== '') {
          const trainerIdCandidate = course.trainer_id.trim();
          if (uuidRegex.test(trainerIdCandidate)) {
            try {
              // Check if trainer exists in Trainer table (this is what the foreign key references)
              const trainer = await prisma.trainer.findUnique({
                where: { 
                  id: trainerIdCandidate
                }
              });
              
              if (trainer) {
                trainerId = trainerIdCandidate;
              }
              // Trainer not found - leave trainerId as null (course can exist without trainer)
            } catch (e) {
              trainerId = null;
            }
          }
        }

        // Helper to truncate string to max length
        const truncate = (str: string | null | undefined, maxLen: number): string | null => {
          if (!str) return null;
          const trimmed = str.trim();
          return trimmed.length > maxLen ? trimmed.substring(0, maxLen) : trimmed;
        };

        // Prepare data - ensure trainerId is null if invalid
        const courseData: any = {
          id: course.id && course.id.trim() && uuidRegex.test(course.id.trim()) ? course.id.trim() : undefined,
          courseCode: truncate(course.course_code, 255),
          trainerId: trainerId || null, // Explicitly ensure null if not valid
          createdBy: trainerId || null, // Use trainerId as createdBy if available
          title: truncate(course.title, 500) || 'Untitled Course',
          description: (course['description\n'] || course.description) && (course['description\n'] || course.description)?.trim() 
            ? ((course['description\n'] || course.description)?.trim() || null)
            : null,
          learningObjectives: parseJsonField(course.learning_objectives),
          learningOutcomes: parseJsonField(course.learning_outcomes),
          targetAudience: course.target_audience && course.target_audience.trim() ? course.target_audience.trim() : null,
          methodology: course.methodology && course.methodology.trim() ? course.methodology.trim() : null,
          prerequisite: course.prerequisite && course.prerequisite.trim() ? course.prerequisite.trim() : null,
          certificate: truncate((course as any)['certificate.'] || (course as any).certificate, 255), // Handle both column names
          assessment: parseBoolean(course.assessment),
          durationHours: durationHours,
          durationUnit: truncate(course.duration_unit, 50)?.toLowerCase() || 'hours',
          modules: parseJsonField(course.modules),
          venue: course.venue && course.venue.trim() ? course.venue.trim() : null,
          price: course.price ? parseNumber(course.price) : null,
          fixedDate: parseDate(course.fixed_date),
          startDate: parseDate(course.start_date),
          endDate: null, // Not in CSV
          category: course.category && course.category.trim() ? course.category.trim() : null,
          city: course['city '] ? course['city '].trim() : (course.city ? course.city.trim() : null), // Handle column with space
          state: course.state && course.state.trim() ? course.state.trim() : null,
          hrdcClaimable: parseBoolean(course.hrdc_claimable),
          brochureUrl: null, // Not in CSV
          courseSequence: course.course_sequence ? parseInt(course.course_sequence) : null,
          status: parseStatus(course.status),
          createdByAdmin: parseBoolean(course.created_by_admin || course['created_by_admin.1']), // Handle both column names
          courseType: parseCourseType(course.course_type),
          courseMode: parseCourseMode(course.course_mode),
        };

        // Remove id if it's empty or invalid to let Prisma generate it
        if (!courseData.id || !uuidRegex.test(courseData.id)) {
          delete courseData.id;
        }

        // Insert course
        await prisma.course.create({
          data: courseData
        });

        const titlePreview = course.title.length > 50 ? course.title.substring(0, 50) + '...' : course.title;
        const trainerInfo = trainerId ? ` (Trainer ID: ${trainerId.substring(0, 8)}...)` : ' (No trainer)';
        console.log(`✅ [${i + 1}/${records.length}] Imported: ${titlePreview}${trainerInfo}`);
        successCount++;

      } catch (error: any) {
        const titlePreview = course.title ? (course.title.length > 50 ? course.title.substring(0, 50) + '...' : course.title) : 'Unknown';
        const errorMsg = `Failed to import "${titlePreview}": ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`⏭️  Skipped (already exists/invalid): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errors.length > 0 && errors.length <= 20) {
      console.log('⚠️  ERRORS:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('');
    } else if (errors.length > 20) {
      console.log(`⚠️  ${errors.length} errors occurred. First 20:`);
      errors.slice(0, 20).forEach(error => console.log(`   - ${error}`));
      console.log('');
    }

    console.log('🎉 Import process completed!');

  } catch (error: any) {
    console.error('\n❌ Import failed!');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importCourses();

