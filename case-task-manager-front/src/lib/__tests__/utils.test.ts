import { cn, formatDateBR } from '../utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-red-500');
      expect(result).toBe('px-2 py-1 bg-red-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('px-2', true && 'py-1', false && 'bg-red-500');
      expect(result).toBe('px-2 py-1');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2 px-4', 'py-1 py-2');
      expect(result).toBe('px-4 py-2');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined inputs', () => {
      const result = cn('px-2', null, undefined, 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['px-2', 'py-1'], 'bg-red-500');
      expect(result).toBe('px-2 py-1 bg-red-500');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'px-2': true,
        'py-1': false,
        'bg-red-500': true,
      });
      expect(result).toBe('px-2 bg-red-500');
    });
  });

  describe('formatDateBR', () => {
    it('should format valid YYYY-MM-DD date string', () => {
      const result = formatDateBR('2023-12-25');
      expect(result).toBe('25/12/2023');
    });

    it('should format date with single digit day and month', () => {
      const result = formatDateBR('2023-01-05');
      expect(result).toBe('05/01/2023');
    });

    it('should handle null input', () => {
      const result = formatDateBR(null);
      expect(result).toBe('Sem data');
    });

    it('should handle undefined input', () => {
      const result = formatDateBR(undefined);
      expect(result).toBe('Sem data');
    });

    it('should handle empty string', () => {
      const result = formatDateBR('');
      expect(result).toBe('Sem data');
    });

    it('should handle invalid date string', () => {
      const result = formatDateBR('invalid-date');
      expect(result).toBe('Sem data');
    });

    it('should handle malformed YYYY-MM-DD format', () => {
      const result = formatDateBR('2023-13-45');
      expect(result).toBe('Sem data');
    });

    it('should handle invalid month in YYYY-MM-DD format', () => {
      const result = formatDateBR('2023-13-15');
      expect(result).toBe('Sem data');
    });

    it('should handle invalid day in YYYY-MM-DD format', () => {
      const result = formatDateBR('2023-12-32');
      expect(result).toBe('Sem data');
    });

    it('should handle zero values in YYYY-MM-DD format', () => {
      const result = formatDateBR('0000-00-00');
      expect(result).toBe('Sem data');
    });

    it('should handle negative values in YYYY-MM-DD format', () => {
      const result = formatDateBR('2023--1-15');
      expect(result).toBe('Sem data');
    });

    it('should handle ISO datetime string', () => {
      const result = formatDateBR('2023-12-25T10:30:00Z');
      expect(result).toBe('25/12/2023');
    });

    it('should handle leap year date', () => {
      const result = formatDateBR('2024-02-29');
      expect(result).toBe('29/02/2024');
    });

    it('should handle non-leap year February 29th as invalid', () => {
      const result = formatDateBR('2023-02-29');
      expect(result).toBe('Sem data');
    });

    it('should handle edge case dates', () => {
      // Test December 31st
      expect(formatDateBR('2023-12-31')).toBe('31/12/2023');
      
      // Test January 1st
      expect(formatDateBR('2023-01-01')).toBe('01/01/2023');
    });

    it('should handle date parsing error gracefully', () => {
      // Mock Date constructor to throw an error for non-YYYY-MM-DD format
      const originalDate = global.Date;
      const mockDate = jest.fn((dateString) => {
        if (typeof dateString === 'string' && dateString.includes('T00:00:00')) {
          throw new Error('Date parsing error');
        }
        return new originalDate(dateString);
      }) as any;
      mockDate.now = originalDate.now;
      global.Date = mockDate;

      const result = formatDateBR('2023/12/25');
      expect(result).toBe('Sem data');
      
      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle very long date strings', () => {
      const longDateString = '2023-12-25' + 'x'.repeat(1000);
      const result = formatDateBR(longDateString);
      expect(result).toBe('Sem data');
    });

    it('should handle date strings with extra characters', () => {
      const result = formatDateBR('2023-12-25abc');
      expect(result).toBe('Sem data');
    });

    it('should handle partial date strings', () => {
      const result = formatDateBR('2023-12');
      expect(result).toBe('Sem data');
    });

    it('should handle date strings with different separators', () => {
      const result = formatDateBR('2023/12/25');
      expect(result).toBe('25/12/2023');
    });

    it('should handle date strings with dots', () => {
      const result = formatDateBR('2023.12.25');
      expect(result).toBe('25/12/2023');
    });

    it('should handle date strings with spaces', () => {
      const result = formatDateBR('2023 12 25');
      expect(result).toBe('Sem data');
    });

    it('should handle month boundaries correctly', () => {
      // Test all months
      expect(formatDateBR('2023-01-15')).toBe('15/01/2023');
      expect(formatDateBR('2023-02-15')).toBe('15/02/2023');
      expect(formatDateBR('2023-03-15')).toBe('15/03/2023');
      expect(formatDateBR('2023-04-15')).toBe('15/04/2023');
      expect(formatDateBR('2023-05-15')).toBe('15/05/2023');
      expect(formatDateBR('2023-06-15')).toBe('15/06/2023');
      expect(formatDateBR('2023-07-15')).toBe('15/07/2023');
      expect(formatDateBR('2023-08-15')).toBe('15/08/2023');
      expect(formatDateBR('2023-09-15')).toBe('15/09/2023');
      expect(formatDateBR('2023-10-15')).toBe('15/10/2023');
      expect(formatDateBR('2023-11-15')).toBe('15/11/2023');
      expect(formatDateBR('2023-12-15')).toBe('15/12/2023');
    });

    it('should handle day boundaries correctly', () => {
      // Test day boundaries for different months
      expect(formatDateBR('2023-01-31')).toBe('31/01/2023'); // January has 31 days
      expect(formatDateBR('2023-02-28')).toBe('28/02/2023'); // February has 28 days in non-leap year
      expect(formatDateBR('2023-04-30')).toBe('30/04/2023'); // April has 30 days
      expect(formatDateBR('2023-04-31')).toBe('Sem data'); // April doesn't have 31 days
    });
  });
});