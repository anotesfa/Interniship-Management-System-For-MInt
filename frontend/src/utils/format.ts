// Formatting utilities
import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
};

export const formatFileSize = (sizeInKB: number): string => {
  if (sizeInKB < 1024) {
    return `${sizeInKB.toFixed(2)} KB`;
  }
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

export const formatGPA = (gpa: number): string => {
  return gpa.toFixed(2);
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    // Application statuses
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    on_hold: 'bg-orange-100 text-orange-800',
    draft: 'bg-gray-100 text-gray-800',
    
    // Assignment statuses
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    
    // Milestone statuses
    pending_review: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    pending_revision: 'bg-orange-100 text-orange-800',
    
    // Evaluation statuses
    submitted: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
  };

  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const formatStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
