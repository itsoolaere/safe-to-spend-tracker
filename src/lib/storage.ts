import { AppData, DEFAULT_CATEGORIES, Transaction, Budget, AssetCategory, CurrentObligation, FutureObligation, FinancialHistoryEntry } from "./types";

const STORAGE_KEY = "safe-to-spend";

export const DEFAULT_ASSETS: AssetCategory[] = [
  { id: "asset-savings", name: "Savings", value: 0, history: [] },
  { id: "asset-stocks", name: "Stocks", value: 0, history: [] },
  { id: "asset-property", name: "Property", value: 0, history: [] },
  { id: "asset-cash", name: "Cash", value: 0, history: [] },
  { id: "asset-receivables", name: "Receivables", value: 0, history: [] },
];

function getDefault(): AppData {
  return {
    transactions: [],
    categories: { ...DEFAULT_CATEGORIES },
    budgets: [],
    beginningBalances: {},
    carryForwardDisabled: [],
    assets: DEFAULT_ASSETS.map(a => ({ ...a })),
    currentObligations: [],
    futureObligations: [],
  };
}

/** Auto-convert future obligations whose startDate is today or in the past to current obligations. */
export function convertDueFutureObligations(data: AppData): AppData {
  const today = new Date().toISOString().slice(0, 10);
  const due = data.futureObligations.filter(f => f.startDate <= today);
  if (due.length === 0) return data;

  const newCurrentObligations: CurrentObligation[] = due.map(f => ({
    id: crypto.randomUUID(),
    name: f.name,
    balance: f.totalAmount,
    monthlyRepayment: undefined,
    history: [],
  }));

  return {
    ...data,
    futureObligations: data.futureObligations.filter(f => f.startDate > today),
    currentObligations: [...data.currentObligations, ...newCurrentObligations],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const parsed = JSON.parse(raw) as any;
    const beginningBalances = parsed.beginningBalances ?? {};
    // Migration: months with existing manual balances are treated as carry-forward disabled
    const migrated = parsed.carryForwardDisabled ?? Object.keys(beginningBalances);
    // Migration: seed default assets for users who had no assets field
    const assets: AssetCategory[] = parsed.assets
      ?? DEFAULT_ASSETS.map(a => ({ ...a }));
    const data: AppData = {
      transactions: parsed.transactions ?? [],
      categories: parsed.categories ?? { ...DEFAULT_CATEGORIES },
      budgets: (parsed.budgets ?? []).map((b: any) => ({ id: b.id ?? crypto.randomUUID(), ...b })),
      beginningBalances,
      carryForwardDisabled: migrated,
      assets,
      currentObligations: parsed.currentObligations ?? [],
      futureObligations: parsed.futureObligations ?? [],
    };
    return convertDueFutureObligations(data);
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

// ── Assets ──────────────────────────────────────────────────────────────────

export function addAsset(data: AppData, name: string): AppData {
  const asset: AssetCategory = { id: crypto.randomUUID(), name, value: 0, history: [] };
  const updated = { ...data, assets: [...data.assets, asset] };
  saveData(updated);
  return updated;
}

export function updateAsset(data: AppData, id: string, newValue: number, note?: string): AppData {
  const today = new Date().toISOString().slice(0, 10);
  const updated = {
    ...data,
    assets: data.assets.map(a => {
      if (a.id !== id) return a;
      const entry: FinancialHistoryEntry = {
        id: crypto.randomUUID(),
        date: today,
        previousValue: a.value,
        newValue,
        note,
      };
      return { ...a, value: newValue, history: [entry, ...a.history] };
    }),
  };
  saveData(updated);
  return updated;
}

export function renameAsset(data: AppData, id: string, name: string): AppData {
  const updated = { ...data, assets: data.assets.map(a => a.id === id ? { ...a, name } : a) };
  saveData(updated);
  return updated;
}

export function deleteAsset(data: AppData, id: string): AppData {
  const updated = { ...data, assets: data.assets.filter(a => a.id !== id) };
  saveData(updated);
  return updated;
}

// ── Current Obligations ──────────────────────────────────────────────────────

export function addCurrentObligation(data: AppData, name: string, balance: number, monthlyRepayment?: number): AppData {
  const obligation: CurrentObligation = {
    id: crypto.randomUUID(),
    name,
    balance,
    monthlyRepayment,
    history: [],
  };
  const updated = { ...data, currentObligations: [...data.currentObligations, obligation] };
  saveData(updated);
  return updated;
}

export function updateCurrentObligation(data: AppData, id: string, newBalance: number, monthlyRepayment?: number, note?: string): AppData {
  const today = new Date().toISOString().slice(0, 10);
  const updated = {
    ...data,
    currentObligations: data.currentObligations.map(o => {
      if (o.id !== id) return o;
      const entry: FinancialHistoryEntry = {
        id: crypto.randomUUID(),
        date: today,
        previousValue: o.balance,
        newValue: newBalance,
        note,
      };
      return { ...o, balance: newBalance, monthlyRepayment, history: [entry, ...o.history] };
    }),
  };
  saveData(updated);
  return updated;
}

export function deleteCurrentObligation(data: AppData, id: string): AppData {
  const updated = { ...data, currentObligations: data.currentObligations.filter(o => o.id !== id) };
  saveData(updated);
  return updated;
}

// ── Future Obligations ───────────────────────────────────────────────────────

export function addFutureObligation(data: AppData, name: string, totalAmount: number, startDate: string): AppData {
  const obligation: FutureObligation = { id: crypto.randomUUID(), name, totalAmount, startDate };
  const updated = { ...data, futureObligations: [...data.futureObligations, obligation] };
  saveData(updated);
  return convertDueFutureObligations(updated);
}

export function deleteFutureObligation(data: AppData, id: string): AppData {
  const updated = { ...data, futureObligations: data.futureObligations.filter(f => f.id !== id) };
  saveData(updated);
  return updated;
}
