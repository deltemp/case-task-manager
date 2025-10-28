'use client';

import { useEffect, useState } from 'react';

interface ClientDateFormatterProps {
  dateString: string | null | undefined;
  className?: string;
}

export function ClientDateFormatter({ dateString, className }: ClientDateFormatterProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (!dateString) {
      setFormattedDate('Sem data');
      return;
    }

    try {
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        if (yearNum > 0 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          setFormattedDate(`${day}/${month}/${year}`);
          return;
        }
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        setFormattedDate('Sem data');
        return;
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      setFormattedDate(`${day}/${month}/${year}`);
    } catch (error) {
      console.error('Error formatting date:', error);
      setFormattedDate('Sem data');
    }
  }, [dateString]);

  if (!isClient) {
    return <span className={className}>--/--/----</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}