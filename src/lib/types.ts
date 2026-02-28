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
  category: string;
  limit: number;
  type: "income" | "expense";
  month: string; // e.g. "2026-02"
}

export interface AppData {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  budgets: Budget[];
}

export const DEFAULT_CATEGORIES = {
  income: ["Salary", "Freelance", "Investments", "Other"],
  expense: ["Food", "Transport", "Housing", "Entertainment", "Shopping", "Health", "Utilities", "Other"],
};
