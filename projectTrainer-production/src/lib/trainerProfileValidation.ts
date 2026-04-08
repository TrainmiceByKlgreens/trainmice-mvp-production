import { Trainer } from '../types/database';

export interface ValidationErrors {
  [key: string]: string;
}

export function validatePersonalInfo(trainer: Partial<Trainer>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!trainer.full_name || trainer.full_name.trim().length < 2) {
    errors.full_name = 'Full name is required (minimum 2 characters)';
  } else if (trainer.full_name.length > 100) {
    errors.full_name = 'Full name must not exceed 100 characters';
  }

  if (!trainer.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trainer.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (trainer.ic_number && trainer.ic_number.trim()) {
    const icPattern = /^\d{6}-\d{2}-\d{4}$/;
    if (!icPattern.test(trainer.ic_number)) {
      errors.ic_number = 'IC Number format should be: XXXXXX-XX-XXXX (e.g., 123456-12-1234)';
    }
  }

  if (trainer.phone_number && trainer.phone_number.trim()) {
    // Phone should be +60 followed by 9-10 digits (no dashes or spaces)
    const phonePattern = /^\+60\d{9,10}$/;
    if (!phonePattern.test(trainer.phone_number)) {
      errors.phone_number = 'Phone number must be +60 followed by 9-10 digits (e.g., +60123456789)';
    }
  }

  if (trainer.race && trainer.race.length > 50) {
    errors.race = 'Race/Ethnicity must not exceed 50 characters';
  }

  if (trainer.professional_bio && trainer.professional_bio.trim()) {
    const wordCount = trainer.professional_bio.trim().split(/\s+/).length;
    if (wordCount > 500) {
      errors.professional_bio = `Professional bio exceeds 500 words (current: ${wordCount} words)`;
    }
  }

  if (trainer.hrdc_accreditation_id && trainer.hrdc_accreditation_id.length > 50) {
    errors.hrdc_accreditation_id = 'HRDC Accreditation ID must not exceed 50 characters';
  }

  if (trainer.hrdc_accreditation_valid_until) {
    const date = new Date(trainer.hrdc_accreditation_valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      errors.hrdc_accreditation_valid_until = 'HRDC Accreditation date must be in the future';
    }
  }

  return errors;
}

export function isProfileComplete(trainer: Trainer | null): boolean {
  if (!trainer) return false;

  const requiredFields = [
    trainer.full_name,
    trainer.email,
    trainer.ic_number,
    trainer.phone_number,
    trainer.professional_bio
  ];

  return requiredFields.every(field => field && field.trim().length > 0);
}

export function getProfileCompletionPercentage(trainer: Trainer | null): number {
  if (!trainer) return 0;

  const fields = [
    trainer.full_name,
    trainer.email,
    trainer.ic_number,
    trainer.phone_number,
    trainer.professional_bio,
    trainer.race,
    trainer.hrdc_accreditation_id,
    trainer.profile_pic
  ];

  const filledFields = fields.filter(field => field && field.trim && field.trim().length > 0).length;
  return Math.round((filledFields / fields.length) * 100);
}
