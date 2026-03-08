'use client';

import { useReportStore } from '@/lib/store';
import { useConfigStore } from '@/lib/config-store';
import { useEffect, useRef } from 'react';

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    // Rehydrate stores on client side only
    if (!hydratedRef.current) {
      useReportStore.persist.rehydrate();
      useConfigStore.persist.rehydrate();
      hydratedRef.current = true;
    }
  }, []);

  return <>{children}</>;
}
