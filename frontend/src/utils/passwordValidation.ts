/**
 * Password validation utilities
 * 
 * These match the backend validators configured in Django settings
 */

/**
 * Check if password meets all requirements
 */
export function isPasswordValid(password: string, email?: string): boolean {
  return (
    isLengthValid(password) &&
    isNotAllNumbers(password) &&
    isNotCommonPassword(password) &&
    isNotSimilarToEmail(password, email)
  );
}

/**
 * Check if password is at least 12 characters
 */
export function isLengthValid(password: string): boolean {
  return password.length >= 12;
}

/**
 * Check if password is not entirely numbers
 */
export function isNotAllNumbers(password: string): boolean {
  return password.length > 0 && !/^\d+$/.test(password);
}

/**
 * Check if password is not in common passwords list
 */
export function isNotCommonPassword(password: string): boolean {
  if (!password) return false;
  
  const commonPasswords = [
    '123456', 'password', '12345678', 'qwerty', '123456789',
    '12345', '1234', '111111', '1234567', 'dragon',
    '123123', 'baseball', 'abc123', 'football', 'monkey',
    'letmein', '696969', 'shadow', 'master', '666666',
    'qwertyuiop', '123321', 'mustang', '1234567890', 'michael',
    '654321', 'superman', '1qaz2wsx', '7777777', '121212',
    '000000', 'qazwsx', '123qwe', 'killer', 'trustno1',
    'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter',
    'buster', 'soccer', 'harley', 'batman', 'andrew',
    'tigger', 'sunshine', 'iloveyou', '2000', 'charlie',
    'robert', 'thomas', 'hockey', 'ranger', 'daniel',
    'starwars', 'klaster', '112233', 'george', 'computer',
    'michelle', 'jessica', 'pepper', '1111', 'zxcvbn',
    '555555', '11111111', '131313', 'freedom', '777777',
    'pass', 'maggie', '159753', 'aaaaaa', 'ginger',
    'princess', 'joshua', 'cheese', 'amanda', 'summer',
    'love', 'ashley', '6969', 'nicole', 'chelsea',
    'biteme', 'matthew', 'access', 'yankees', '987654321',
    'dallas', 'austin', 'thunder', 'taylor', 'matrix',
  ];
  
  const passwordLower = password.toLowerCase();
  
  // Check exact match
  if (commonPasswords.includes(passwordLower)) {
    return false;
  }
  
  // Check if password contains common password
  for (const common of commonPasswords) {
    if (passwordLower.includes(common) && common.length >= 6) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if password is not too similar to email
 */
export function isNotSimilarToEmail(password: string, email?: string): boolean {
  if (!email || !password) return true;
  
  const passwordLower = password.toLowerCase();
  const emailLower = email.toLowerCase();
  const emailUsername = emailLower.split('@')[0];
  
  // Check if password contains significant part of email
  if (emailUsername.length >= 4 && passwordLower.includes(emailUsername)) {
    return false;
  }
  
  // Check if email username is in password
  if (passwordLower.includes(emailUsername)) {
    return false;
  }
  
  // Calculate similarity
  const similarity = calculateSimilarity(passwordLower, emailUsername);
  return similarity <= 0.7; // Less than 70% similar is okay
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }
  
  return matches / longer.length;
}
