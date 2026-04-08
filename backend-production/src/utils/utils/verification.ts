import crypto from 'crypto';

/**
 * Generate a secure, random verification token
 * @returns A 32-byte random token in hexadecimal format (64 characters)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get token expiry date (24 hours from now)
 * @returns Date object representing 24 hours from now
 */
export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Check if a token has expired
 * @param expiryDate The expiry date to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

