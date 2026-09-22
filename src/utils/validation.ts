export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  hint: string;
}

export function validateEmail(email: string): boolean {
  // RFC 5322 compliant regex for standard email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Weak', hint: 'Must be at least 8 characters' };
  }

  let score = 0;
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLength) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial || password.length >= 12) score += 1;

  if (!hasLength) {
    return { score: 1, label: 'Weak', hint: 'Add more characters (min 8)' };
  }
  if (score === 1) {
    return { score: 1, label: 'Weak', hint: 'Weak — mix uppercase and lowercase' };
  }
  if (score === 2) {
    return { score: 2, label: 'Fair', hint: 'Fair — add a number to make it strong' };
  }
  if (score === 3) {
    return { score: 3, label: 'Good', hint: 'Good — add a symbol or more characters' };
  }
  return { score: 4, label: 'Strong', hint: 'Strong password' };
}

export const MAX_AVATAR_SIZE_BYTES = 300 * 1024; // 300 KB
export const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Please upload a PNG, JPEG, WebP, or GIF image.',
    };
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeKb = Math.round(file.size / 1024);
    return {
      valid: false,
      error: `Avatar image must be 300 KB or less (selected file is ${sizeKb} KB).`,
    };
  }
  return { valid: true };
}
