import React from 'react';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  email?: string;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password, email }) => {
  // Check each requirement
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 12 characters long',
      met: password.length >= 12,
    },
    {
      label: 'Not entirely numbers',
      met: password.length > 0 && !/^\d+$/.test(password),
    },
    {
      label: 'Not a common password',
      met: !isCommonPassword(password),
    },
    {
      label: email ? `Different from your email` : 'Different from your email',
      met: email ? !isSimilarToEmail(password, email) : true,
    },
  ];

  return (
    <div className='mt-2 space-y-2 transition-all duration-300 ease-in-out'>
      <p className='font-[Lufga] text-xs font-normal text-[rgba(247,247,247,0.2)] transition-opacity duration-300'>
        Password must meet the following requirements:
      </p>
      <div className='space-y-1'>
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className='flex items-center space-x-2 transition-all duration-200 ease-in-out'
            style={{ 
              transitionDelay: `${index * 30}ms`,
              opacity: 1,
              transform: 'translateY(0)'
            }}
          >
            <div className={`transition-all duration-200 ease-in-out ${
              requirement.met ? 'scale-100 rotate-0' : 'scale-90'
            }`}>
              {requirement.met ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className='flex-shrink-0'>
                  <path d="M8.38 12L10.79 14.42L15.62 9.57996" stroke="#F7F7F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.27 2.44995L14.85 3.80995C15.15 4.06995 15.71 4.27995 16.11 4.27995H17.81C18.87 4.27995 19.74 5.14995 19.74 6.20995V7.90995C19.74 8.29995 19.95 8.86995 20.21 9.16995L21.57 10.7499C22.16 11.4399 22.16 12.5699 21.57 13.2699L20.21 14.8499C19.95 15.1499 19.74 15.7099 19.74 16.1099V17.8099C19.74 18.8699 18.87 19.7399 17.81 19.7399H16.11C15.72 19.7399 15.15 19.9499 14.85 20.2099L13.27 21.5699C12.58 22.1599 11.45 22.1599 10.75 21.5699L9.17 20.2099C8.87 19.9499 8.31 19.7399 7.91 19.7399H6.18C5.12 19.7399 4.25 18.8699 4.25 17.8099V16.0999C4.25 15.7099 4.04 15.1499 3.79 14.8499L2.44 13.2599C1.86 12.5699 1.86 11.4499 2.44 10.7599L3.79 9.16995C4.04 8.86995 4.25 8.30995 4.25 7.91995V6.19995C4.25 5.13995 5.12 4.26995 6.18 4.26995H7.91C8.3 4.26995 8.87 4.05995 9.17 3.79995L10.75 2.44995C11.44 1.85995 12.57 1.85995 13.27 2.44995Z" stroke="#F7F7F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className='flex-shrink-0'>
                  <path d="M9.10001 2C8.42001 2 7.46 2.4 6.98 2.88L2.88 6.98001C2.4 7.46001 2 8.42001 2 9.10001V14.9C2 15.58 2.4 16.54 2.88 17.02L6.98 21.12C7.46 21.6 8.42001 22 9.10001 22H14.9C15.58 22 16.54 21.6 17.02 21.12L21.12 17.02C21.6 16.54 22 15.58 22 14.9V9.10001C22 8.42001 21.6 7.46001 21.12 6.98001L17.02 2.88C16.54 2.4 15.58 2 14.9 2H9.10001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className='text-warning-red'/>
                  <path d="M8.5 15.5L15.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className='text-warning-red'/>
                  <path d="M15.5 15.5L8.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className='text-warning-red'/>
                </svg>
              )}
            </div>
            <span
              className={`font-[Lufga] text-xs font-normal transition-all duration-200 ease-in-out ${
                requirement.met
                  ? 'text-[#F7F7F7]'
                  : 'text-warning-red'
              }`}
            >
              {requirement.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper: Check if password is too similar to email
function isSimilarToEmail(password: string, email: string): boolean {
  if (!password || !email) return false;
  
  const passwordLower = password.toLowerCase();
  const emailLower = email.toLowerCase();
  const emailUsername = emailLower.split('@')[0];
  
  // Check if password contains significant part of email
  if (emailUsername.length >= 4 && passwordLower.includes(emailUsername)) {
    return true;
  }
  
  // Check if email username is in password
  if (passwordLower.includes(emailUsername)) {
    return true;
  }
  
  // Calculate similarity (simple version)
  const similarity = calculateSimilarity(passwordLower, emailUsername);
  return similarity > 0.7; // More than 70% similar
}

// Simple similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Count matching characters
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }
  
  return matches / longer.length;
}

// Helper: Check if password is in common passwords list
function isCommonPassword(password: string): boolean {
  if (!password) return false;
  
  // Top 100 most common passwords (subset for frontend validation)
  // Backend will check against ~20,000 passwords
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
    return true;
  }
  
  // Check if password contains common password
  for (const common of commonPasswords) {
    if (passwordLower.includes(common) && common.length >= 6) {
      return true;
    }
  }
  
  return false;
}

export default PasswordRequirements;
export { type PasswordRequirement };
