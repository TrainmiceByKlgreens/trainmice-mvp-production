import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface WorkHistoryRow {
  id: string;
  trainerId: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
  created_at: string;
}

function parseYearOrDate(value: string): Date | null {
  if (!value || value.trim() === '' || value.trim().toUpperCase() === 'NULL' || value.trim().toUpperCase() === 'CURRENT' || value.trim() === 'present') {
    return null;
  }

  const trimmed = value.trim();

  // Handle year-only values (e.g., "2012", "2014")
  // Match exactly 4 digits
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1900 && year <= 2100) {
      // Set to January 1st of that year
      return new Date(year, 0, 1);
    }
  }

  // Handle date strings (try parsing as date)
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      // Validate the date is reasonable (between 1900 and 2100)
      const year = date.getFullYear();
      if (year >= 1900 && year <= 2100) {
        return date;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

async function importWorkHistory() {
  try {
    console.log('🚀 Starting work history import process from WHoutput_production.csv...\n');

    const csvPath = path.join(__dirname, '../../WHoutput_production.csv');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const records: WorkHistoryRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      escape: '"',
      quote: '"',
    });

    console.log(`📋 Found ${records.length} work history records to import\n`);

    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        // Skip if trainerId is missing, empty, or "0"
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
          console.log(`⏭️  Skipping record ${record.id}: Trainer not found (trainerId: ${trainerId})`);
          skippedCount++;
          continue;
        }

        // Check if work history entry already exists
        const existing = await prisma.workHistory.findUnique({
          where: { id: record.id },
        });

        if (existing) {
          // Update existing record
          await prisma.workHistory.update({
            where: { id: record.id },
            data: {
              trainerId: trainerId,
              company: record.company?.trim() || '',
              position: record.position?.trim() || '',
              startDate: parseYearOrDate(record.start_date),
              endDate: parseYearOrDate(record.end_date),
              description: record.description?.trim() || null,
              createdAt: (() => {
                if (!record.created_at || record.created_at.trim() === '' || record.created_at.trim().toUpperCase() === 'NULL') {
                  return new Date();
                }
                const parsed = new Date(record.created_at);
                return isNaN(parsed.getTime()) ? new Date() : parsed;
              })(),
            },
          });
          console.log(`🔄 Updated: ${record.id} - ${record.company || 'N/A'}`);
        } else {
          // Create new record
          await prisma.workHistory.create({
            data: {
              id: record.id,
              trainerId: trainerId,
              company: record.company?.trim() || '',
              position: record.position?.trim() || '',
              startDate: parseYearOrDate(record.start_date),
              endDate: parseYearOrDate(record.end_date),
              description: record.description?.trim() || null,
              createdAt: (() => {
                if (!record.created_at || record.created_at.trim() === '' || record.created_at.trim().toUpperCase() === 'NULL') {
                  return new Date();
                }
                const parsed = new Date(record.created_at);
                return isNaN(parsed.getTime()) ? new Date() : parsed;
              })(),
            },
          });
          console.log(`✅ Created: ${record.id} - ${record.company || 'N/A'}`);
        }

        successCount++;
        if (successCount % 50 === 0) {
          console.log(`📊 Progress: ${successCount} records processed...`);
        }
      } catch (recordError: any) {
        errorCount++;
        errors.push(`Error importing record ${record.id}: ${recordError.message}`);
        console.error(`❌ Error importing record ${record.id}:`, recordError.message);
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

importWorkHistory();

