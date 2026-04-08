import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface QualificationRow {
  id: string;
  trainerId: string;
  title: string;
  institution: string;
  year_obtained: string;
  qualification_type: string;
  'description ': string; // Note: CSV has a space after 'description'
  created_at: string;
}

function parseYear(value: string): number | null {
  if (!value || value.trim() === '' || value.trim().toUpperCase() === 'NULL') {
    return null;
  }

  // Handle year-only values (e.g., "2009", "2022")
  const yearMatch = value.trim().match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1900 && year <= 2100) {
      return year;
    }
  }

  // Try parsing as integer
  const parsed = parseInt(value.trim(), 10);
  if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
    return parsed;
  }

  return null;
}

function parseDate(value: string): Date {
  if (!value || value.trim() === '' || value.trim().toUpperCase() === 'NULL') {
    return new Date();
  }

  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch {
    // Ignore parse errors
  }

  return new Date();
}

async function importQualifications() {
  try {
    console.log('🚀 Starting qualification import process from Qualificationoutput_production.csv...\n');

    const csvPath = path.join(__dirname, '../../Qualificationoutput_production.csv');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const records: QualificationRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      escape: '"',
      quote: '"',
    });

    console.log(`📋 Found ${records.length} qualification records to import\n`);

    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Skip if trainerId is empty, "0", or invalid
        const trainerId = record.trainerId?.trim();
        if (!trainerId || trainerId === '0' || trainerId === '') {
          console.log(`⏭️  Skipping record ${record.id}: Invalid or missing trainerId`);
          skippedCount++;
          continue;
        }

        // Check if trainer exists
        const trainer = await prisma.trainer.findUnique({
          where: { id: trainerId },
        });

        if (!trainer) {
          console.log(`⏭️  Skipping record ${record.id}: Trainer ${trainerId} not found`);
          skippedCount++;
          continue;
        }

        // Check if qualification already exists
        const existingQualification = await prisma.qualification.findUnique({
          where: { id: record.id },
        });

        if (existingQualification) {
          // Update existing qualification
          await prisma.qualification.update({
            where: { id: record.id },
            data: {
              trainerId: trainerId,
              title: record.title?.trim() || '',
              institution: record.institution?.trim() || null,
              yearObtained: parseYear(record.year_obtained),
              qualificationType: record.qualification_type?.trim() || null,
              description: record['description ']?.trim() || null,
              createdAt: parseDate(record.created_at),
            },
          });
          console.log(`🔄 Updated: ${record.title} (${record.id})`);
        } else {
          // Create new qualification
          await prisma.qualification.create({
            data: {
              id: record.id,
              trainerId: trainerId,
              title: record.title?.trim() || '',
              institution: record.institution?.trim() || null,
              yearObtained: parseYear(record.year_obtained),
              qualificationType: record.qualification_type?.trim() || null,
              description: record['description ']?.trim() || null,
              createdAt: parseDate(record.created_at),
            },
          });
          console.log(`✅ Created: ${record.title} (${record.id})`);
        }

        successCount++;
        if (successCount % 10 === 0) {
          console.log(`📊 Progress: ${successCount} qualifications processed...`);
        }
      } catch (recordError: any) {
        errorCount++;
        errors.push(`Error importing qualification ${record.id}: ${recordError.message}`);
        console.error(`❌ Error importing qualification ${record.id}:`, recordError.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported/updated: ${successCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errors.length > 0) {
      console.log('⚠️  Detailed Errors:');
      errors.forEach((err) => console.error(`- ${err}`));
      console.log('');
    }

    console.log('🎉 Import process completed!');
  } catch (error: any) {
    console.error('\n❌ Fatal error during import:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importQualifications();

