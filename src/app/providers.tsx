'use client';
import React from 'react';
import { BudgetProvider } from '@/lib/budget';

export function Providers({ children }: { children: React.ReactNode }) {
  return <BudgetProvider>{children}</BudgetProvider>;
}
