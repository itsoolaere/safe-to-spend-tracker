import { useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Budget } from "@/lib/types";

interface Props {
  expenseBudgets: Budget[];
  incomeBudgets: Budget[];
  monthlyExpenses: Record<string, number>;
  monthlyIncome: Record<string, number>;
}

function CategoryBar({ name, actual, budget, color }: { name: string; actual: number; budget: number; color: "expense" | "income" | "primary" }) {
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over = actual > budget;
  const barColor = over ? "bg-expense" : color === "income" ? "bg-income" : "bg-primary";
  const textColor = over ? "text-expense" : "text-muted-foreground";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate max-w-[120px]">{name}</span>
        <span className={`${textColor} font-medium tabular-nums`}>
          {formatCurrency(actual)} <span className="opacity-50">/ {formatCurrency(budget)}</span>
        </span>
      </div>
      <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BudgetSnapshotWidget({ expenseBudgets, incomeBudgets, monthlyExpenses, monthlyIncome }: Props) {
  const expenseData = useMemo(() => {
    const cats = Array.from(new Set(expenseBudgets.filter(b => b.limit > 0).map(b => b.category)));
    return cats.map(cat => ({
      name: cat,
      budget: expenseBudgets.filter(b => b.category === cat).reduce((s, b) => s + b.limit, 0),
      actual: monthlyExpenses[cat] || 0,
    }));
  }, [expenseBudgets, monthlyExpenses]);

  const incomeData = useMemo(() => {
    const cats = Array.from(new Set(incomeBudgets.filter(b => b.limit > 0).map(b => b.category)));
    return cats.map(cat => ({
      name: cat,
      budget: incomeBudgets.filter(b => b.category === cat).reduce((s, b) => s + b.limit, 0),
      actual: monthlyIncome[cat] || 0,
    }));
  }, [incomeBudgets, monthlyIncome]);

  const hasData = expenseData.length > 0 || incomeData.length > 0;

  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Budget Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Add budget entries to see your snapshot.
          </p>
        ) : (
          <div className="space-y-5">
            {expenseData.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expenses</p>
                {expenseData.map(d => (
                  <CategoryBar key={d.name} name={d.name} actual={d.actual} budget={d.budget} color="primary" />
                ))}
              </div>
            )}
            {incomeData.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Income</p>
                {incomeData.map(d => (
                  <CategoryBar key={d.name} name={d.name} actual={d.actual} budget={d.budget} color="income" />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
