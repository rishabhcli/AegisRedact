/**
 * Password strength validation utility
 * Helps prevent weak passwords that could be easily cracked
 */

// Top 100 most common passwords (from OWASP and security research)
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234',
  '111111', '1234567', 'dragon', '123123', 'baseball', 'iloveyou', 'trustno1',
  'monkey', '1234567890', 'sunshine', 'princess', 'football', 'shadow',
  'michael', 'jennifer', 'jordan', 'password1', 'password123', 'abc123',
  'welcome', 'login', 'admin', 'qwerty123', 'solo', 'passw0rd', 'starwars',
  'letmein', 'master', 'hello', 'freedom', 'whatever', 'computer', 'purple',
  'secret', 'ginger', 'chicken', 'matthew', 'pepper', 'charlie', 'batman',
  'hunter', 'thomas', 'summer', 'george', 'harley', 'jessica', 'password12',
  'password1234', 'password12345', 'aa123456', 'password!', 'qwertyuiop',
  'ashley', 'bailey', 'passw0rd!', 'shadow1', 'master1', 'monkey1',
  'letmein1', 'hello123', 'welcome1', 'admin123', 'root', 'toor', 'pass',
  'test', 'guest', 'info', 'adm', 'mysql', 'user', 'administrator', 'oracle',
  'ftp', 'pi', 'puppet', 'ansible', 'ec2-user', 'vagrant', 'azureuser',
  'demo', 'changeme', 'temp', 'temporary', 'default', 'cisco', 'admin1234',
  'pass123', 'test123', 'qwerty12345', '1q2w3e4r', 'zxcvbnm', 'asdfghjkl',
]);

export interface PasswordStrengthResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 12 characters
 * - Not a common password
 * - Contains variety of character types
 * - Not too repetitive
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  let score = 0;

  // Length check (minimum 12)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
    return { isValid: false, errors, strength: 'weak', score: 0 };
  }

  // Length bonus
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Check if password is in common passwords list
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowerPassword)) {
    errors.push('Password is too common. Please choose a stronger password.');
    return { isValid: false, errors, strength: 'weak', score: 0 };
  }

  // Check for common patterns in password
  if (isCommonPattern(password)) {
    errors.push('Password contains common patterns. Please choose a more complex password.');
    return { isValid: false, errors, strength: 'weak', score: 0 };
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

  if (hasLowercase) score += 15;
  if (hasUppercase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSpecialChars) score += 15;

  // Variety requirements
  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars]
    .filter(Boolean).length;

  if (varietyCount < 3) {
    errors.push('Password must contain at least 3 of: lowercase, uppercase, numbers, special characters');
    return { isValid: false, errors, strength: 'weak', score: Math.min(score, 40) };
  }

  // Check for repetitive characters (e.g., "aaaaaa")
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password contains too many repetitive characters');
    score -= 20;
  }

  // Check for sequential characters (e.g., "abcdef", "123456")
  if (hasSequentialCharacters(password)) {
    errors.push('Password contains sequential characters. Please avoid sequences.');
    score -= 15;
  }

  // Calculate strength
  score = Math.max(0, Math.min(100, score));
  let strength: 'weak' | 'medium' | 'strong';

  if (score < 50) {
    strength = 'weak';
    if (errors.length === 0) {
      errors.push('Password is weak. Consider adding more variety.');
    }
  } else if (score < 75) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Check if password contains common patterns
 */
function isCommonPattern(password: string): boolean {
  const patterns = [
    /^(.)\1+$/, // All same character (e.g., "aaaaaaaaaaaa")
    /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // Sequential letters
    /^(qwerty|asdfgh|zxcvbn)/i, // Keyboard patterns
    /^(password|admin|user|test|demo|root)/i, // Common words at start
  ];

  return patterns.some(pattern => pattern.test(password));
}

/**
 * Check for sequential characters
 */
function hasSequentialCharacters(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiopasdfghjklzxcvbnm', // Keyboard layout
  ];

  const lowerPassword = password.toLowerCase();

  for (const sequence of sequences) {
    for (let i = 0; i < sequence.length - 3; i++) {
      const segment = sequence.substring(i, i + 4);
      if (lowerPassword.includes(segment)) {
        return true;
      }
      // Check reverse sequence
      if (lowerPassword.includes(segment.split('').reverse().join(''))) {
        return true;
      }
    }
  }

  return false;
}
