import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to Brazilian format (DD/MM/YYYY) in a way that's consistent
 * between server and client rendering to avoid hydration mismatches.
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string in DD/MM/YYYY format or 'Sem data' if no date
 */
export function formatDateBR(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Sem data';
  }

  try {
    // Handle YYYY-MM-DD format by manually parsing to avoid timezone issues
    const dateMatch = dateString.match(/^(\d{4})[-./](\d{2})[-./](\d{2})$/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      // Validate the date components
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      
      // Basic validation
      if (yearNum > 0 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        // Additional validation for days in month
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (date.getFullYear() === yearNum && 
            date.getMonth() === monthNum - 1 && 
            date.getDate() === dayNum) {
          return `${day}/${month}/${year}`;
        }
      }
      return 'Sem data';
    }
    
    // Handle ISO datetime strings (e.g., '2023-12-25T10:30:00Z')
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      
      if (yearNum > 0 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (date.getFullYear() === yearNum && 
            date.getMonth() === monthNum - 1 && 
            date.getDate() === dayNum) {
          return `${day}/${month}/${year}`;
        }
      }
      return 'Sem data';
    }
    
    // Check for partial date strings (should return 'Sem data')
    if (dateString.match(/^\d{4}-\d{2}$/) || dateString.match(/^\d{4}$/)) {
      return 'Sem data';
    }
    
    // For other date formats, create date object but ensure consistent parsing
    // Use local time interpretation to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00');
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Sem data';
    }

    // Manual formatting to ensure consistency between server and client
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Sem data';
  }
}