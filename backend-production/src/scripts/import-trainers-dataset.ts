import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface TrainerRow {
  id: string;
  custom_trainer_id: string;
  profile_pic: string;
  ic_number: string;
  full_name: string;
  race: string;
  phone_number: string;
  email: string;
  hourly_rate: string;
  hrdc_accreditation_id: string;
  hrdc_accreditation_valid_until: string;
  professional_bio: string;
  state: string;
  city: string;
  country: string;
  areas_of_expertise: string;
  languages_spoken: string;
  created_at: string;
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

function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function cleanEmail(email: string): string {
  // Remove "mailto:" prefix if present
  email = email.replace(/^mailto:/i, '').trim();
  
  // Handle multiple emails (take the first one)
  if (email.includes(' or ')) {
    email = email.split(' or ')[0].trim();
  }
  
  return email.trim();
}

async function importTrainers() {
  try {
    console.log('🚀 Starting trainer dataset import process...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../cleaned trainers dataset.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV with proper handling of multi-line fields
    const records: TrainerRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      escape: '"',
      quote: '"',
    });

    console.log(`📋 Found ${records.length} trainer records to import\n`);

    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Import each trainer
    for (let i = 0; i < records.length; i++) {
      const trainer = records[i];
      try {
        // Skip if no ID (trainer must have a User record first)
        if (!trainer.id || trainer.id.trim() === '' || !uuidRegex.test(trainer.id.trim())) {
          const name = trainer.full_name || 'Unknown';
          console.log(`⏭️  Skipping ${name}: No valid ID (trainer must have User record first)`);
          skippedCount++;
          continue;
        }

        const trainerId = trainer.id.trim();

        // Check if trainer already exists
        const existing = await prisma.trainer.findUnique({
          where: { id: trainerId }
        });

        if (existing) {
          console.log(`⏭️  Skipping ${trainer.full_name || 'Unknown'} (id: ${trainerId} already exists)`);
          skippedCount++;
          continue;
        }

        // Verify that user exists and is a TRAINER
        const user = await prisma.user.findUnique({
          where: { id: trainerId }
        });

        if (!user || user.role !== 'TRAINER') {
          console.log(`⏭️  Skipping ${trainer.full_name || 'Unknown'}: User ${trainerId} not found or not a TRAINER`);
          skippedCount++;
          continue;
        }

        // Check if custom_trainer_id already exists (if provided)
        if (trainer.custom_trainer_id && trainer.custom_trainer_id.trim() !== '') {
          const existingByCode = await prisma.trainer.findUnique({
            where: { customTrainerId: trainer.custom_trainer_id.trim() }
          });

          if (existingByCode) {
            console.log(`⏭️  Skipping ${trainer.full_name || 'Unknown'}: custom_trainer_id ${trainer.custom_trainer_id} already exists`);
            skippedCount++;
            continue;
          }
        }

        // Validate required fields
        if (!trainer.full_name || trainer.full_name.trim() === '') {
          errors.push(`Skipped trainer ${trainerId}: Missing full_name`);
          skippedCount++;
          continue;
        }

        // Prepare data
        const trainerData: any = {
          id: trainerId,
          customTrainerId: trainer.custom_trainer_id && trainer.custom_trainer_id.trim() ? trainer.custom_trainer_id.trim() : null,
          profilePic: trainer.profile_pic && trainer.profile_pic.trim() ? trainer.profile_pic.trim() : null,
          icNumber: trainer.ic_number && trainer.ic_number.trim() ? trainer.ic_number.trim() : null,
          fullName: trainer.full_name.trim(),
          race: trainer.race && trainer.race.trim() ? trainer.race.trim() : null,
          phoneNumber: trainer.phone_number && trainer.phone_number.trim() ? trainer.phone_number.trim() : null,
          email: trainer.email ? cleanEmail(trainer.email) : null,
          hourlyRate: trainer.hourly_rate ? parseNumber(trainer.hourly_rate) : null,
          hrdcAccreditationId: trainer.hrdc_accreditation_id && trainer.hrdc_accreditation_id.trim() ? trainer.hrdc_accreditation_id.trim() : null,
          hrdcAccreditationValidUntil: trainer.hrdc_accreditation_valid_until ? parseDate(trainer.hrdc_accreditation_valid_until) : null,
          professionalBio: trainer.professional_bio && trainer.professional_bio.trim() ? trainer.professional_bio.trim() : null,
          state: trainer.state && trainer.state.trim() ? trainer.state.trim() : null,
          city: trainer.city && trainer.city.trim() ? trainer.city.trim() : null,
          country: trainer.country && trainer.country.trim() ? trainer.country.trim() : null,
        };

        // Insert trainer
        await prisma.trainer.create({
          data: trainerData
        });

        console.log(`✅ [${i + 1}/${records.length}] Imported: ${trainer.full_name} (${trainer.custom_trainer_id || trainerId})`);
        successCount++;

      } catch (error: any) {
        const namePreview = trainer.full_name ? (trainer.full_name.length > 50 ? trainer.full_name.substring(0, 50) + '...' : trainer.full_name) : 'Unknown';
        const errorMsg = `Failed to import "${namePreview}": ${error.message}`;
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
importTrainers();


