import { Budget } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export interface TipState {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expenseByCategory: { name: string; amount: number }[];
  budgets: Budget[];
  transactionCount: number;
  period: string;
}

const GENERAL_TIPS = [
  "small consistent tracking beats perfect records.",
  "checking in weekly helps more than monthly catch-ups.",
  "every entry is a small act of self-awareness.",
  "the goal isn't perfection — it's noticing.",
  "patterns only show up when you keep going.",
];

export function getFinancialTips(state: TipState): string[] {
  const { totalIncome, totalExpense, balance, expenseByCategory, budgets, transactionCount, period } = state;
  const tips: string[] = [];

  if (transactionCount === 0) {
    tips.push("start with one entry. even ₦50 counts.");
    return tips;
  }

  if (totalExpense > totalIncome && totalIncome > 0) {
    tips.push("you're spending more than you earn this month. review your top category.");
  }

  if (expenseByCategory.length > 0 && totalExpense > 0) {
    const top = expenseByCategory[0];
    if (top.amount / totalExpense > 0.5) {
      tips.push(`most of your money is going to ${top.name.toLowerCase()}. is that intentional?`);
    }
  }

  if (totalIncome === 0 && transactionCount > 0) {
    tips.push("no income recorded yet. add what came in to see the full picture.");
  }

  const monthBudgets = budgets.filter((b) => b.month === period);
  if (monthBudgets.length === 0 && transactionCount > 0) {
    tips.push("try setting a budget — it helps you notice patterns.");
  }

  // Check budgets near limit
  if (monthBudgets.length > 0) {
    for (const b of monthBudgets) {
      if (b.type !== "expense") continue;
      const spent = expenseByCategory.find((c) => c.name === b.category)?.amount ?? 0;
      if (b.limit > 0 && spent / b.limit > 0.8) {
        tips.push(`${b.category.toLowerCase()} budget is almost used up. tread carefully.`);
        break;
      }
    }
  }

  if (balance > 0 && totalIncome > 0 && totalExpense > 0) {
    tips.push(`you have ${formatCurrency(balance)} safe to spend. nice.`);
  }

  if (tips.length === 0) {
    tips.push(...GENERAL_TIPS);
  }

  return tips;
}

export function pickTip(tips: string[], exclude?: string): string {
  if (tips.length <= 1) return tips[0] ?? GENERAL_TIPS[0];
  const filtered = exclude ? tips.filter((t) => t !== exclude) : tips;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
