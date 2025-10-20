'use client';
import React, { createContext, useContext, useMemo, useState } from 'react';

type BudgetItem = { id: string; title: string; details?: string; qty: number };
type BudgetCtx = { items: BudgetItem[]; addItem: (i: BudgetItem) => void };

const Ctx = createContext<BudgetCtx | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const addItem = (i: BudgetItem) => setItems(prev => [...prev, i]);
  const value = useMemo(() => ({ items, addItem }), [items]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useBudget = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBudget must be used inside <BudgetProvider>');
  return ctx;
};
