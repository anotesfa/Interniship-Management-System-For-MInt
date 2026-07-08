// Validation utilities based on SRS requirements

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateGPA = (gpa: number): boolean => {
  return gpa >= 0 && gpa <= 4.0;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// FR-APP-003: Validate PDF and DOCX only
export const validateDocumentFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!validateFileType(file, allowedTypes)) {
    return { valid: false, error: 'Only PDF, DOC, and DOCX files are allowed' };
  }

  if (!validateFileSize(file, 10)) {
    return { valid: false, error: 'File size must not exceed 10 MB' };
  }

  return { valid: true };
};

// FR-MIL-001: Validate milestone description minimum length
export const validateMilestoneDescription = (description: string): boolean => {
  return description.trim().length >= 50;
};

// FR-REV-004: Validate rejection reason minimum length
export const validateRejectionReason = (reason: string): boolean => {
  return reason.trim().length >= 20;
};

// FR-EVAL-002: Validate evaluation remarks minimum length
export const validateEvaluationRemarks = (remarks: string): boolean => {
  return remarks.trim().length >= 100;
};

// FR-AUTH-002: Validate password strength
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
};

// FR-EVAL-002: Validate rating scale (1-5)
export const validateRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};
