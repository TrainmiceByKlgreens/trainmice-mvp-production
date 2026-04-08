import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

interface TrainerRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  email_verified: string;
  created_at: string;
  updated_at: string;
  token_expiry: string;
  verification_token: string;
}

function cleanEmail(email: string): string {
  // Remove "mailto:" prefix if present
  email = email.replace(/^mailto:/i, '').trim();
  
  // Handle multiple emails (take the first one)
  if (email.includes(' or ')) {
    email = email.split(' or ')[0].trim();
  }
  
  // Remove any remaining whitespace
  return email.trim();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

async function importTrainers() {
  try {
    console.log('🚀 Starting trainer import process...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../../trainerusers.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header
    const headers = parseCsvLine(lines[0].trim());
    console.log(`📋 Found ${lines.length - 1} trainer records to import\n`);

    // Parse data rows
    const trainers: TrainerRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i].trim());
      
      if (values.length < headers.length) {
        console.warn(`⚠️  Skipping row ${i}: insufficient columns`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      trainers.push(row as TrainerRow);
    }

    console.log(`📊 Parsed ${trainers.length} trainer records\n`);

    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Import each trainer
    for (const trainer of trainers) {
      try {
        // Clean email
        const cleanedEmail = cleanEmail(trainer.email);
        
        if (!cleanedEmail || !cleanedEmail.includes('@')) {
          errors.push(`Skipped ${trainer.full_name}: Invalid email "${trainer.email}"`);
          skippedCount++;
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: cleanedEmail }
        });

        if (existingUser) {
          console.log(`⏭️  Skipping ${trainer.full_name} (${cleanedEmail}): Already exists`);
          skippedCount++;
          continue;
        }

        // Validate required fields
        if (!trainer.id || !trainer.password_hash) {
          errors.push(`Skipped ${trainer.full_name}: Missing required fields`);
          skippedCount++;
          continue;
        }

        // Prepare data
        const userData = {
          id: trainer.id,
          email: cleanedEmail,
          passwordHash: trainer.password_hash,
          fullName: trainer.full_name || null,
          role: 'TRAINER' as const,
          emailVerified: trainer.email_verified === '1' || trainer.email_verified === 'true',
          verificationToken: trainer.verification_token || null,
          tokenExpiry: trainer.token_expiry ? new Date(trainer.token_expiry) : null,
        };

        // Insert user
        await prisma.user.create({
          data: userData
        });

        console.log(`✅ Imported: ${trainer.full_name} (${cleanedEmail})`);
        successCount++;

      } catch (error: any) {
        const errorMsg = `Failed to import ${trainer.full_name}: ${error.message}`;
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

    if (errors.length > 0) {
      console.log('⚠️  ERRORS:');
      errors.forEach(error => console.log(`   - ${error}`));
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

