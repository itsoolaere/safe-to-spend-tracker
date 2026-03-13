import { useState, useMemo, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

// Chart palette — avoids expense/income colors to prevent confusion
const CAT_COLORS = [
  "hsl(var(--chart-1))",  // warm amber (primary)
  "hsl(var(--chart-4))",  // slate blue
  "hsl(var(--chart-5))",  // purple
  "hsl(var(--chart-6))",  // teal
  "hsl(36 65% 52%)",      // gold
  "hsl(180 40% 42%)",     // deep teal
  "hsl(320 30% 52%)",     // mauve
  "hsl(55 45% 46%)",      // olive
];

const EXPENSE_COLOR = "hsl(var(--expense))";
const BAR_MAX_H = 100; // px

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

export default function BudgetMonthlyWidget() {
  const { data, period } = useBudget();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => { setSelectedCategory(null); }, [period]);

  // Transactions for selected month
  const monthTxs = useMemo(
    () => data.transactions.filter(t => t.date.startsWith(period)),
    [data.transactions, period]
  );

  const totalIncome = useMemo(
    () => monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  );

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxs
      .filter(t => t.type === "expense")
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [monthTxs]);

  const totalSpent = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);

  // Expense budgets for selected month, grouped by category
  const budgetByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    data.budgets
      .filter(b => b.type === "expense" && b.month === period && b.limit > 0)
      .forEach(b => { map[b.category] = (map[b.category] || 0) + b.limit; });
    return map;
  }, [data.budgets, period]);

  const totalBudget = Object.values(budgetByCategory).reduce((s, v) => s + v, 0);
  const pctUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Union of categories that have spending or a budget
  const categories = useMemo(() => {
    return Array.from(
      new Set([...Object.keys(expenseByCategory), ...Object.keys(budgetByCategory)])
    );
  }, [expenseByCategory, budgetByCategory]);

  const categoryColors: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat, i) => { map[cat] = CAT_COLORS[i % CAT_COLORS.length]; });
    return map;
  }, [categories]);

  // Scale bar heights against highest budget value
  const maxBudgetValue = useMemo(() => {
    const vals = categories.map(cat => budgetByCategory[cat] ?? expenseByCategory[cat] ?? 0);
    return Math.max(...vals, 1);
  }, [categories, budgetByCategory, expenseByCategory]);

  // Stacked bar segments: proportional to actual spending vs total budget
  const stackedSegments = useMemo(() => {
    if (totalBudget <= 0) return [];
    return categories
      .filter(cat => (expenseByCategory[cat] || 0) > 0)
      .map(cat => ({
        cat,
        width: (expenseByCategory[cat] / totalBudget) * 100,
        color: categoryColors[cat],
      }));
  }, [categories, expenseByCategory, totalBudget, categoryColors]);

  // Selected category details
  const selActual = selectedCategory ? (expenseByCategory[selectedCategory] || 0) : 0;
  const selBudget = selectedCategory ? (budgetByCategory[selectedCategory] || 0) : 0;
  const selPct = selBudget > 0 ? Math.round((selActual / selBudget) * 100) : 0;
  const selLeft = selBudget - selActual;

  const hasData = categories.length > 0 || totalIncome > 0;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-4 pb-5 space-y-4">

        {/* Month navigator */}
        <span className="font-heading font-semibold text-sm">
          {formatMonthLabel(period)}
        </span>

        {/* Main card */}
        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data for this month yet.
          </p>
        ) : (
          <div className="bg-secondary/30 rounded-xl p-3.5 space-y-3.5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly budget</span>
              {totalBudget > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  pctUsed > 100
                    ? "bg-expense/15 text-expense"
                    : "bg-primary/15 text-primary"
                }`}>
                  {Math.round(pctUsed)}% used
                </span>
              )}
            </div>

            {/* Stacked bar */}
            {totalBudget > 0 && (
              <div className="space-y-1.5">
                <div className="relative h-3 bg-secondary rounded-full overflow-hidden flex">
                  {stackedSegments.map(seg => (
                    <div
                      key={seg.cat}
                      className="h-full flex-shrink-0 transition-all duration-500"
                      style={{ width: `${seg.width}%`, backgroundColor: seg.color }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{formatCurrency(totalSpent)} spent</span>
                  <span>{formatCurrency(totalBudget)} budget</span>
                </div>
              </div>
            )}

            <div className="border-t border-border/50" />

            {/* Tooltip row */}
            <div className="bg-card rounded-lg px-3 py-2 min-h-[44px] flex items-center">
              {!selectedCategory ? (
                <p className="text-xs text-muted-foreground italic w-full text-center">
                  Tap a category to see details
                </p>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: categoryColors[selectedCategory] }}
                    >
                      {selectedCategory}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatCurrency(selActual)} spent
                      {selBudget > 0 && <> · {formatCurrency(selBudget)} budget · {selPct}%</>}
                    </p>
                  </div>
                  {selBudget > 0 && (
                    selLeft >= 0 ? (
                      <span className="text-[11px] font-semibold text-income bg-income/10 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        {formatCurrency(selLeft)} left
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-expense bg-expense/10 px-2 py-0.5 rounded-full shrink-0">
                        over budget
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Vertical bar chart */}
            {categories.length > 0 && (
              <div
                className="flex items-end gap-1.5 justify-around"
                style={{ height: `${BAR_MAX_H + 20}px` }}
              >
                {categories.map(cat => {
                  const actual = expenseByCategory[cat] || 0;
                  const budget = budgetByCategory[cat] || 0;
                  const barH = Math.max(Math.round((budget / maxBudgetValue) * BAR_MAX_H), budget > 0 ? 2 : 0);
                  const isOver = budget > 0 && actual > budget;
                  const isSelected = selectedCategory === cat;
                  const isUnselected = selectedCategory !== null && !isSelected;

                  return (
                    <div
                      key={cat}
                      className="flex flex-col items-center gap-1 cursor-pointer flex-1"
                      style={{ minWidth: 0 }}
                      onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
                    >
                      {/* Bar + ceiling line container */}
                      <div
                        className="relative w-full flex items-end justify-center"
                        style={{ height: `${BAR_MAX_H}px` }}
                      >
                        {/* Bar */}
                        <div
                          className="w-full max-w-[28px] rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${barH}px`,
                            backgroundColor: isOver ? EXPENSE_COLOR : categoryColors[cat],
                            opacity: isUnselected ? 0.2 : 1,
                          }}
                        />
                      </div>
                      {/* Category label */}
                      <p
                        className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight"
                        style={{ opacity: isUnselected ? 0.35 : 1 }}
                      >
                        {cat}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Color legend */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-0.5">
                {categories.map(cat => (
                  <div
                    key={cat}
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: categoryColors[cat],
                        opacity: selectedCategory && selectedCategory !== cat ? 0.3 : 1,
                      }}
                    />
                    <span
                      className="text-[10px] text-muted-foreground"
                      style={{ opacity: selectedCategory && selectedCategory !== cat ? 0.4 : 1 }}
                    >
                      {cat}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
