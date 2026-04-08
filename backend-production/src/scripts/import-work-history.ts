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
  created_at: string;
}

function parseYearToDate(value: string): Date | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'present' || value.trim().toLowerCase() === 'current') {
    return null;
  }
  
  // Handle year-only values (e.g., "2012", "2014")
  const yearMatch = value.trim().match(/^(\d{4})$/);
  if (yearMatch) {
    try {
      // Create date as January 1st of that year
      return new Date(`${yearMatch[1]}-01-01`);
    } catch {
      return null;
    }
  }
  
  // Handle date strings (YYYY-MM-DD format)
  if (value.includes('-')) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {
      return null;
    }
  }
  
  // Handle date strings like "Apr-18", "Oct-22"
  const monthYearMatch = value.trim().match(/^([A-Za-z]+)-(\d{2})$/);
  if (monthYearMatch) {
    try {
      const month = monthYearMatch[1];
      const year = monthYearMatch[2];
      const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
      const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const monthNum = monthMap[month.substring(0, 3)];
      if (monthNum) {
        return new Date(`${fullYear}-${monthNum}-01`);
      }
    } catch {
      return null;
    }
  }
  
  return null;
}

async function importWorkHistory() {
  try {
    console.log('🚀 Starting work history import process from WHoutput.csv...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../WHoutput.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV with proper handling of multi-line fields
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

    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Import each work history record
    for (let i = 0; i < records.length; i++) {
      const wh = records[i];
      try {
        // Skip if company or position is empty
        if (!wh.company || wh.company.trim() === '' || !wh.position || wh.position.trim() === '') {
          skippedCount++;
          continue;
        }

        // Skip if trainerId is "0", empty, or invalid UUID
        const trainerId = wh.trainerId ? wh.trainerId.trim() : '';
        if (!trainerId || trainerId === '0' || !uuidRegex.test(trainerId)) {
          const companyPreview = wh.company.length > 50 ? wh.company.substring(0, 50) + '...' : wh.company;
          console.log(`⏭️  Skipping "${companyPreview}": Invalid or missing trainerId (${trainerId || 'empty'})`);
          skippedCount++;
          continue;
        }

        // Check if trainer exists in Trainer table
        const trainer = await prisma.trainer.findUnique({
          where: { id: trainerId }
        });

        if (!trainer) {
          const companyPreview = wh.company.length > 50 ? wh.company.substring(0, 50) + '...' : wh.company;
          console.log(`⏭️  Skipping "${companyPreview}": Trainer ${trainerId} not found`);
          skippedCount++;
          continue;
        }

        // Check if work history already exists (by id if valid UUID)
        if (wh.id && wh.id.trim() !== '' && uuidRegex.test(wh.id.trim())) {
          const existing = await prisma.workHistory.findUnique({
            where: { id: wh.id.trim() }
          });
          if (existing) {
            const companyPreview = wh.company.length > 50 ? wh.company.substring(0, 50) + '...' : wh.company;
            console.log(`⏭️  Skipping "${companyPreview}" (id: ${wh.id} already exists)`);
            skippedCount++;
            continue;
          }
        }

        // Parse dates
        const startDate = parseYearToDate(wh.start_date);
        const endDate = parseYearToDate(wh.end_date);

        // Prepare data
        const workHistoryData: any = {
          trainerId: trainerId,
          company: wh.company.trim(),
          position: wh.position.trim(),
          startDate: startDate,
          endDate: endDate,
        };

        // Use provided ID if valid UUID, otherwise let Prisma generate it
        if (wh.id && wh.id.trim() !== '' && uuidRegex.test(wh.id.trim())) {
          workHistoryData.id = wh.id.trim();
        }

        // Insert work history
        await prisma.workHistory.create({
          data: workHistoryData
        });

        const companyPreview = wh.company.length > 50 ? wh.company.substring(0, 50) + '...' : wh.company;
        const dateRange = startDate 
          ? (endDate ? `${startDate.getFullYear()}-${endDate.getFullYear()}` : `${startDate.getFullYear()}-Present`)
          : 'No dates';
        console.log(`✅ [${i + 1}/${records.length}] Imported: "${companyPreview}" (Trainer: ${trainer.fullName || trainerId}, ${dateRange})`);
        successCount++;

      } catch (error: any) {
        const companyPreview = wh.company ? (wh.company.length > 50 ? wh.company.substring(0, 50) + '...' : wh.company) : 'Unknown';
        const errorMsg = `Failed to import "${companyPreview}": ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    console.log('\n============================================================');
    console.log('📊 IMPORT SUMMARY');
    console.log('============================================================');
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`⏭️  Skipped (already exists/invalid): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('============================================================\n');

    if (errors.length > 0 && errors.length <= 20) {
      console.log('Error details:');
      errors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    } else if (errors.length > 20) {
      console.log(`First 20 errors (out of ${errors.length} total):`);
      errors.slice(0, 20).forEach(err => console.log(`  - ${err}`));
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importWorkHistory()
  .then(() => {
    console.log('✅ Import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  });


