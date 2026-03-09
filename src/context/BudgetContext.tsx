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
    beginningBalances: { ...local.beginningBalances, ...cloud.beginningBalances },
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
    beginningBalances: d?.beginningBalances ?? {},
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

interface PendingSync {
  localData: AppData;
  cloudData: AppData | null;
}

export type ClearScope = { mode: "all" | "month" | "date"; value?: string };

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
  clearTransactions: (scope: ClearScope) => void;
  clearBudgets: (scope: { mode: "all" | "month"; value?: string }) => void;
  syncing: boolean;
  pendingSync: PendingSync | null;
  confirmSync: (merge: boolean) => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(loadData);
  const [period, setPeriod] = useState(getCurrentMonth);
  const [syncing, setSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState<PendingSync | null>(null);
  const hasSynced = useRef(false);
  const wasAuthenticated = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const confirmSync = useCallback(async (merge: boolean) => {
    if (!pendingSync || !user) return;
    setSyncing(true);
    try {
      const { localData, cloudData } = pendingSync;
      let finalData: AppData;

      if (merge && cloudData) {
        finalData = mergeData(localData, cloudData);
        await saveCloudData(user.id, finalData);
      } else if (merge && !cloudData) {
        finalData = localData;
        await saveCloudData(user.id, finalData);
      } else if (cloudData) {
        finalData = cloudData;
      } else {
        finalData = { transactions: [], categories: { ...DEFAULT_CATEGORIES }, budgets: [], beginningBalances: {} };
      }

      setData(finalData);
      saveData(finalData);
    } finally {
      setPendingSync(null);
      setSyncing(false);
    }
  }, [pendingSync, user]);

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

  // Sync on sign-in: if guest has local data, ask before merging
  useEffect(() => {
    if (!user || hasSynced.current) return;
    hasSynced.current = true;

    const sync = async () => {
      setSyncing(true);
      try {
        const localData = loadData();
        const cloudData = await loadCloudData(user.id);
        const hasLocalData = localData.transactions.length > 0;

        if (hasLocalData) {
          // Guest has data — ask before syncing
          setPendingSync({ localData, cloudData });
          setSyncing(false);
          return;
        }

        // No guest data — just load cloud or start fresh
        if (cloudData) {
          setData(cloudData);
          saveData(cloudData);
        } else {
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

  // Reset sync flag and clear data only on actual sign-out (not page reload)
  useEffect(() => {
    if (user) {
      wasAuthenticated.current = true;
    } else if (wasAuthenticated.current) {
      wasAuthenticated.current = false;
      hasSynced.current = false;
      const empty: AppData = {
        transactions: [],
        categories: { ...DEFAULT_CATEGORIES },
        budgets: [],
        beginningBalances: {},
      };
      setData(empty);
      saveData(empty);
    }
  }, [user]);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    updateData(prev => addTx(prev, t));
    // Auto-switch the period filter to match the transaction's month
    const txMonth = t.date.slice(0, 7); // "YYYY-MM"
    setPeriod(txMonth);
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

  const clearTransactions = useCallback((scope: ClearScope) => {
    updateData(prev => {
      let kept: Transaction[];
      if (scope.mode === "all") {
        kept = [];
      } else if (scope.mode === "month" && scope.value) {
        kept = prev.transactions.filter(t => !t.date.startsWith(scope.value!));
      } else if (scope.mode === "date" && scope.value) {
        kept = prev.transactions.filter(t => !t.date.startsWith(scope.value!));
      } else {
        kept = prev.transactions;
      }
      const next = { ...prev, transactions: kept };
      saveData(next);
      return next;
    });
  }, [updateData]);

  const clearBudgets = useCallback((scope: { mode: "all" | "month"; value?: string }) => {
    updateData(prev => {
      let kept = prev.budgets;
      if (scope.mode === "all") kept = [];
      else if (scope.mode === "month" && scope.value) {
        kept = prev.budgets.filter(b => b.month !== scope.value);
      }
      const next = { ...prev, budgets: kept };
      saveData(next);
      return next;
    });
  }, [updateData]);

  return (
    <BudgetContext.Provider value={{ data, period, setPeriod, addTransaction, deleteTransaction, updateTransaction, updateBudgets, addCategory, deleteCategory, clearTransactions, clearBudgets, syncing, pendingSync, confirmSync }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be within BudgetProvider");
  return ctx;
}
