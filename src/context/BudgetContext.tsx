import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { AppData, Transaction, Budget, DEFAULT_CATEGORIES } from "@/lib/types";
import {
  loadData,
  saveData,
  addTransaction as addTx,
  deleteTransaction as delTx,
  updateTransaction as updTx,
  updateBudgets as updateBdg,
  addCategory as addCat,
  deleteCategory as delCat,
} from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Merge local guest data with cloud data, preferring union of both */
function mergeData(local: AppData, cloud: AppData): AppData {
  const txIds = new Set(cloud.transactions.map(t => t.id));
  const mergedTx = [
    ...cloud.transactions,
    ...local.transactions.filter(t => !txIds.has(t.id)),
  ];

  const mergedCategories = {
    income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...cloud.categories.income, ...local.categories.income])),
    expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...cloud.categories.expense, ...local.categories.expense])),
  };

  // For budgets, cloud wins (keyed by category+month+type)
  const budgetKey = (b: Budget) => `${b.category}|${b.month}|${b.type}`;
  const budgetMap = new Map<string, Budget>();
  local.budgets.forEach(b => budgetMap.set(budgetKey(b), b));
  cloud.budgets.forEach(b => budgetMap.set(budgetKey(b), b));

  return {
    transactions: mergedTx,
    categories: mergedCategories,
    budgets: Array.from(budgetMap.values()),
  };
}

async function loadCloudData(userId: string): Promise<AppData | null> {
  const { data, error } = await supabase
    .from("user_app_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const d = data.data as any;
  return {
    transactions: d?.transactions ?? [],
    categories: d?.categories ?? { ...DEFAULT_CATEGORIES },
    budgets: d?.budgets ?? [],
  };
}

async function saveCloudData(userId: string, appData: AppData) {
  await supabase
    .from("user_app_data")
    .upsert({
      user_id: userId,
      data: appData as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
}

interface BudgetContextType {
  data: AppData;
  period: string;
  setPeriod: (p: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  updateBudgets: (budgets: Budget[]) => void;
  addCategory: (type: "income" | "expense", name: string) => void;
  deleteCategory: (type: "income" | "expense", name: string) => void;
  syncing: boolean;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(loadData);
  const [period, setPeriod] = useState(getCurrentMonth);
  const [syncing, setSyncing] = useState(false);
  const hasSynced = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Persist to cloud with debounce for authenticated users
  const persistToCloud = useCallback((newData: AppData) => {
    if (!user) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveCloudData(user.id, newData);
    }, 1000);
  }, [user]);

  // Wrapper: update state, save to localStorage, and sync to cloud
  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      // localStorage is always saved inside the storage functions
      persistToCloud(next);
      return next;
    });
  }, [persistToCloud]);

  // Sync on sign-in: merge local data with cloud, push merged result
  useEffect(() => {
    if (!user || hasSynced.current) return;
    hasSynced.current = true;

    const sync = async () => {
      setSyncing(true);
      try {
        const localData = loadData();
        const cloudData = await loadCloudData(user.id);

        if (cloudData) {
          // Merge local guest data into existing cloud data
          const hasLocalData = localData.transactions.length > 0;
          const merged = hasLocalData ? mergeData(localData, cloudData) : cloudData;

          if (hasLocalData) {
            await saveCloudData(user.id, merged);
          }

          setData(merged);
          saveData(merged); // sync localStorage too
        } else {
          // First sign-in: push local data to cloud
          await saveCloudData(user.id, localData);
        }
      } catch (e) {
        console.error("Sync failed:", e);
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, [user]);

  // Reset sync flag on sign-out
  useEffect(() => {
    if (!user) hasSynced.current = false;
  }, [user]);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    updateData(prev => addTx(prev, t));
  }, [updateData]);

  const deleteTransaction = useCallback((id: string) => {
    updateData(prev => delTx(prev, id));
  }, [updateData]);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, "id">>) => {
    updateData(prev => updTx(prev, id, updates));
  }, [updateData]);

  const updateBudgets = useCallback((budgets: Budget[]) => {
    updateData(prev => updateBdg(prev, budgets));
  }, [updateData]);

  const addCategory = useCallback((type: "income" | "expense", name: string) => {
    updateData(prev => addCat(prev, type, name));
  }, [updateData]);

  const deleteCategory = useCallback((type: "income" | "expense", name: string) => {
    updateData(prev => delCat(prev, type, name));
  }, [updateData]);

  return (
    <BudgetContext.Provider value={{ data, period, setPeriod, addTransaction, deleteTransaction, updateTransaction, updateBudgets, addCategory, deleteCategory, syncing }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be within BudgetProvider");
  return ctx;
}
