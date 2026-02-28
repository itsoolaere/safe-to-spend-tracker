import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AppData, Transaction, Budget } from "@/lib/types";
import {
  loadData,
  addTransaction as addTx,
  deleteTransaction as delTx,
  updateTransaction as updTx,
  updateBudgets as updateBdg,
  addCategory as addCat,
} from "@/lib/storage";

interface BudgetContextType {
  data: AppData;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  updateBudgets: (budgets: Budget[]) => void;
  addCategory: (type: "income" | "expense", name: string) => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setData(prev => addTx(prev, t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData(prev => delTx(prev, id));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, "id">>) => {
    setData(prev => updTx(prev, id, updates));
  }, []);

  const updateBudgets = useCallback((budgets: Budget[]) => {
    setData(prev => updateBdg(prev, budgets));
  }, []);

  const addCategory = useCallback((type: "income" | "expense", name: string) => {
    setData(prev => addCat(prev, type, name));
  }, []);

  return (
    <BudgetContext.Provider value={{ data, addTransaction, deleteTransaction, updateTransaction, updateBudgets, addCategory }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be within BudgetProvider");
  return ctx;
}
