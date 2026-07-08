// Error handler utility for extracting messages from API responses

import { ApiEnvelope } from './api-envelope';

export function extractErrorMessage(error: any): string {
  // If it's an AxiosError
  if (error?.response?.data) {
    const data = error.response.data as ApiEnvelope<any>;
    // Check if it's our standard API envelope format
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }
    // Check for message field
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
  }

  // If it's a generic error message
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // If it's just an AxiosError
  if (error?.response?.status) {
    const status = error.response.status;
    if (status === 400) return 'Invalid request. Please check your input.';
    if (status === 401) return 'Unauthorized. Please log in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'Resource not found.';
    if (status === 409) return 'This action conflicts with existing data.';
    if (status === 500) return 'Server error. Please try again later.';
    return `Error: ${status}`;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}
