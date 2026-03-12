import { AppData } from "./types";

export function getPrevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1); // m-1 is current (0-indexed), m-2 is previous
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Computes the effective opening balance for a given month.
 * - If carry-forward is disabled for the month, returns the manually set value (or 0).
 * - Otherwise, returns the closing balance of the previous month (recursively).
 */
export function computeOpeningBalance(data: AppData, month: string, depth = 0): number {
  if (depth > 24) return 0;

  if (data.carryForwardDisabled?.includes(month)) {
    return data.beginningBalances[month] ?? 0;
  }

  const prevMonth = getPrevMonth(month);
  const prevOpening = computeOpeningBalance(data, prevMonth, depth + 1);
  const prevTransactions = data.transactions.filter(t => t.date.startsWith(prevMonth));
  const prevIncome = prevTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return prevOpening + prevIncome - prevExpense;
}
