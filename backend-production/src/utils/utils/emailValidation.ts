/**
 * Blocked email domains for client signup
 * Clients must use company email addresses
 */
const BLOCKED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
  'me.com',
  'aol.com',
  'live.com',
];

/**
 * Check if an email domain is blocked (personal email)
 * @param email The email address to check
 * @returns true if blocked, false if allowed
 */
export function isBlockedEmailDomain(email: string): boolean {
  const domain = extractDomain(email);
  if (!domain) return true; // Invalid email format
  
  const lowerDomain = domain.toLowerCase();
  return BLOCKED_DOMAINS.includes(lowerDomain);
}

/**
 * Extract domain from email address
 * @param email The email address
 * @returns The domain or null if invalid
 */
function extractDomain(email: string): string | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const domain = parts[1].trim();
  if (!domain || domain.length === 0) return null;
  
  return domain;
}

/**
 * Validate email format
 * @param email The email address to validate
 * @returns true if valid format, false otherwise
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

