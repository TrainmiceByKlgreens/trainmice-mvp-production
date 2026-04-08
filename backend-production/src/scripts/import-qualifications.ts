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
  descrition: string; // Note: typo in CSV column name
  created_at: string;
}

function parseYear(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value.trim());
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

async function importQualifications() {
  try {
    console.log('🚀 Starting qualification import process from Qualificationoutput.csv...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../Qualificationoutput.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV with proper handling of multi-line fields
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

    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Import each qualification
    for (let i = 0; i < records.length; i++) {
      const qual = records[i];
      try {
        // Skip if title is empty
        if (!qual.title || qual.title.trim() === '') {
          skippedCount++;
          continue;
        }

        // Skip if trainerId is "0", empty, or invalid UUID
        const trainerId = qual.trainerId ? qual.trainerId.trim() : '';
        if (!trainerId || trainerId === '0' || !uuidRegex.test(trainerId)) {
          const titlePreview = qual.title.length > 50 ? qual.title.substring(0, 50) + '...' : qual.title;
          console.log(`⏭️  Skipping "${titlePreview}": Invalid or missing trainerId (${trainerId || 'empty'})`);
          skippedCount++;
          continue;
        }

        // Check if trainer exists in Trainer table
        const trainer = await prisma.trainer.findUnique({
          where: { id: trainerId }
        });

        if (!trainer) {
          const titlePreview = qual.title.length > 50 ? qual.title.substring(0, 50) + '...' : qual.title;
          console.log(`⏭️  Skipping "${titlePreview}": Trainer ${trainerId} not found`);
          skippedCount++;
          continue;
        }

        // Check if qualification already exists (by id if valid UUID, or by trainerId + title)
        if (qual.id && qual.id.trim() !== '' && uuidRegex.test(qual.id.trim())) {
          const existing = await prisma.qualification.findUnique({
            where: { id: qual.id.trim() }
          });
          if (existing) {
            const titlePreview = qual.title.length > 50 ? qual.title.substring(0, 50) + '...' : qual.title;
            console.log(`⏭️  Skipping "${titlePreview}" (id: ${qual.id} already exists)`);
            skippedCount++;
            continue;
          }
        }

        // Prepare data
        const qualificationData: any = {
          trainerId: trainerId,
          title: qual.title.trim(),
          institution: qual.institution && qual.institution.trim() ? qual.institution.trim() : null,
          yearObtained: parseYear(qual.year_obtained),
          qualificationType: qual.qualification_type && qual.qualification_type.trim() ? qual.qualification_type.trim() : null,
          description: qual.descrition && qual.descrition.trim() ? qual.descrition.trim() : null, // Note: handling typo in CSV
        };

        // Use provided ID if valid UUID, otherwise let Prisma generate it
        if (qual.id && qual.id.trim() !== '' && uuidRegex.test(qual.id.trim())) {
          qualificationData.id = qual.id.trim();
        }

        // Insert qualification
        await prisma.qualification.create({
          data: qualificationData
        });

        const titlePreview = qual.title.length > 50 ? qual.title.substring(0, 50) + '...' : qual.title;
        console.log(`✅ [${i + 1}/${records.length}] Imported: "${titlePreview}" (Trainer: ${trainer.fullName || trainerId})`);
        successCount++;

      } catch (error: any) {
        const titlePreview = qual.title ? (qual.title.length > 50 ? qual.title.substring(0, 50) + '...' : qual.title) : 'Unknown';
        const errorMsg = `Failed to import "${titlePreview}": ${error.message}`;
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
importQualifications()
  .then(() => {
    console.log('✅ Import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  });


