import { AppData, DEFAULT_CATEGORIES, Transaction, Budget } from "./types";

const STORAGE_KEY = "safe-to-spend";

function getDefault(): AppData {
  return {
    transactions: [],
    categories: { ...DEFAULT_CATEGORIES },
    budgets: [],
    beginningBalances: {},
    carryForwardDisabled: [],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const parsed = JSON.parse(raw) as AppData;
    const beginningBalances = parsed.beginningBalances ?? {};
    // Migration: months with existing manual balances are treated as carry-forward disabled
    const migrated = parsed.carryForwardDisabled
      ?? Object.keys(beginningBalances);
    return {
      transactions: parsed.transactions ?? [],
      categories: parsed.categories ?? { ...DEFAULT_CATEGORIES },
      budgets: (parsed.budgets ?? []).map((b: any) => ({ id: b.id ?? crypto.randomUUID(), ...b })),
      beginningBalances,
      carryForwardDisabled: migrated,
    };
  } catch {
    return getDefault();
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addTransaction(data: AppData, t: Omit<Transaction, "id">): AppData {
  const updated = {
    ...data,
    transactions: [{ ...t, id: crypto.randomUUID() }, ...data.transactions],
  };
  saveData(updated);
  return updated;
}

export function deleteTransaction(data: AppData, id: string): AppData {
  const updated = { ...data, transactions: data.transactions.filter(t => t.id !== id) };
  saveData(updated);
  return updated;
}

export function updateTransaction(data: AppData, id: string, updates: Partial<Omit<Transaction, "id">>): AppData {
  const updated = {
    ...data,
    transactions: data.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
  };
  saveData(updated);
  return updated;
}

export function updateBudgets(data: AppData, budgets: Budget[]): AppData {
  const updated = { ...data, budgets };
  saveData(updated);
  return updated;
}

export function addCategory(data: AppData, type: "income" | "expense", name: string): AppData {
  if (data.categories[type].includes(name)) return data;
  const updated = {
    ...data,
    categories: { ...data.categories, [type]: [...data.categories[type], name] },
  };
  saveData(updated);
  return updated;
}

export function deleteCategory(data: AppData, type: "income" | "expense", name: string): AppData {
  const updated = {
    ...data,
    categories: { ...data.categories, [type]: data.categories[type].filter(c => c !== name) },
  };
  saveData(updated);
  return updated;
}

export function setBeginningBalance(data: AppData, month: string, amount: number): AppData {
  const updated = {
    ...data,
    beginningBalances: { ...data.beginningBalances, [month]: amount },
  };
  saveData(updated);
  return updated;
}

export function toggleCarryForward(data: AppData, month: string): AppData {
  const disabled = data.carryForwardDisabled ?? [];
  const isDisabled = disabled.includes(month);
  const updated = {
    ...data,
    carryForwardDisabled: isDisabled
      ? disabled.filter(m => m !== month)
      : [...disabled, month],
  };
  saveData(updated);
  return updated;
}
