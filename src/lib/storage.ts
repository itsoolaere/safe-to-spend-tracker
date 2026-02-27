import { AppData, DEFAULT_CATEGORIES, Transaction, Budget } from "./types";

const STORAGE_KEY = "safe-to-spend";

function getDefault(): AppData {
  return {
    transactions: [],
    categories: { ...DEFAULT_CATEGORIES },
    budgets: DEFAULT_CATEGORIES.expense.filter(c => c !== "Other").map(c => ({ category: c, limit: 500 })),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const parsed = JSON.parse(raw) as AppData;
    return {
      transactions: parsed.transactions ?? [],
      categories: parsed.categories ?? { ...DEFAULT_CATEGORIES },
      budgets: parsed.budgets ?? [],
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
