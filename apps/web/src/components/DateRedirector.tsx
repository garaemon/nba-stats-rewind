'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function DateRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only redirect if no date param is present
    if (!searchParams.has('date')) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      router.replace(`/?date=${dateStr}`);
    }
  }, [router, searchParams]);

  return null;
}
