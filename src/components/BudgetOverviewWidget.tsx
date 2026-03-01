import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { Link } from "react-router-dom";
import { Budget, Transaction } from "@/lib/types";

interface BudgetOverviewWidgetProps {
  budgets: Budget[];
  transactions: Transaction[];
  period: string;
}

export default function BudgetOverviewWidget({ budgets, transactions, period }: BudgetOverviewWidgetProps) {
  const periodBudgets = budgets.filter((b) => b.month === period && b.limit > 0);
  if (periodBudgets.length === 0) return null;

  const expBudgets = periodBudgets.filter((b) => b.type === "expense");
  const incBudgets = periodBudgets.filter((b) => b.type === "income");

  const filtered = transactions.filter((t) => t.date.startsWith(period));

  const monthlyExpenses: Record<string, number> = {};
  filtered.filter((t) => t.type === "expense").forEach((t) => {
    monthlyExpenses[t.category] = (monthlyExpenses[t.category] || 0) + t.amount;
  });
  const monthlyIncome: Record<string, number> = {};
  filtered.filter((t) => t.type === "income").forEach((t) => {
    monthlyIncome[t.category] = (monthlyIncome[t.category] || 0) + t.amount;
  });

  const totalExpBudget = expBudgets.reduce((s, b) => s + b.limit, 0);
  const totalExpSpent = expBudgets.reduce((s, b) => s + (monthlyExpenses[b.category] || 0), 0);
  const expPct = totalExpBudget > 0 ? Math.min(totalExpSpent / totalExpBudget * 100, 100) : 0;
  const expOver = totalExpSpent > totalExpBudget;

  const totalIncBudget = incBudgets.reduce((s, b) => s + b.limit, 0);
  const totalIncActual = incBudgets.reduce((s, b) => s + (monthlyIncome[b.category] || 0), 0);
  const incPct = totalIncBudget > 0 ? Math.min(totalIncActual / totalIncBudget * 100, 100) : 0;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          
          <CardTitle className="text-base font-heading">Budget's Story</CardTitle>
        </div>
        <Link to="/budget" className="text-xs text-primary hover:underline font-medium">
          Manage →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {expBudgets.length > 0 &&
        <Link to="/budget" className="block group">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Expenses</span>
              <span className={`font-semibold ${expOver ? "text-expense" : ""}`}>
                {formatCurrency(totalExpSpent)} / {formatCurrency(totalExpBudget)}
              </span>
            </div>
            <Progress
            value={expPct}
            className={`h-2 ${expOver ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`} />
          </Link>
        }
        {incBudgets.length > 0 &&
        <Link to="/budget" className="block group">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Income</span>
              <span className="font-semibold">
                {formatCurrency(totalIncActual)} / {formatCurrency(totalIncBudget)}
              </span>
            </div>
            <Progress
            value={incPct}
            className="h-2 [&>div]:bg-income" />
          </Link>
        }
      </CardContent>
    </Card>);

}