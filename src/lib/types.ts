export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  type: "income" | "expense";
  month: string; // e.g. "2026-02"
  note?: string;
}

export interface FinancialHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  previousValue: number;
  newValue: number;
  note?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  value: number;
  history: FinancialHistoryEntry[];
}

export interface CurrentObligation {
  id: string;
  name: string;
  balance: number;
  monthlyRepayment?: number;
  history: FinancialHistoryEntry[];
}

export interface FutureObligation {
  id: string;
  name: string;
  totalAmount: number;
  startDate: string; // YYYY-MM-DD, auto-converts to CurrentObligation on/after this date
}

export interface AppData {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  budgets: Budget[];
  beginningBalances: Record<string, number>; // key = "YYYY-MM", value = amount
  carryForwardDisabled: string[]; // months where carry-forward is turned off
  assets: AssetCategory[];
  currentObligations: CurrentObligation[];
  futureObligations: FutureObligation[];
}

export const DEFAULT_CATEGORIES = {
  income: ["Salary", "Freelance", "Investments", "Other"],
  expense: ["Food", "Transport", "Housing", "Entertainment", "Shopping", "Health", "Utilities", "Other"],
};
