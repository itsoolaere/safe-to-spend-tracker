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

export interface ProjectBudget {
  id: string;
  name: string;
  totalBudget: number;
  categories: string[];
  status: "active" | "closed";
  createdAt: string; // ISO date string
  closedAt?: string;
  autoClose: boolean;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  transactionId?: string; // optional link to a main transaction
}

export interface AppData {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  budgets: Budget[];
  beginningBalances: Record<string, number>; // key = "YYYY-MM", value = amount
  carryForwardDisabled: string[]; // months where carry-forward is turned off
  projectBudgets: ProjectBudget[];
  projectExpenses: ProjectExpense[];
}

export const DEFAULT_CATEGORIES = {
  income: ["Salary", "Freelance", "Investments", "Other"],
  expense: ["Food", "Transport", "Housing", "Entertainment", "Shopping", "Health", "Utilities", "Other"],
};
