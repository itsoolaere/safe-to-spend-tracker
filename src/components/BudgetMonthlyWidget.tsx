import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [selectedMonth, setSelectedMonth] = useState(period);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // All months that have transactions or budgets
  const monthsWithData = useMemo(() => {
    const months = new Set<string>();
    data.transactions.forEach(t => months.add(t.date.slice(0, 7)));
    data.budgets.forEach(b => months.add(b.month));
    return Array.from(months).sort();
  }, [data]);

  const currentIdx = monthsWithData.indexOf(selectedMonth);
  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx !== -1 && currentIdx < monthsWithData.length - 1;

  const navigate = (dir: -1 | 1) => {
    const nextIdx = currentIdx + dir;
    if (nextIdx >= 0 && nextIdx < monthsWithData.length) {
      setSelectedMonth(monthsWithData[nextIdx]);
      setSelectedCategory(null);
    }
  };

  // Transactions for selected month
  const monthTxs = useMemo(
    () => data.transactions.filter(t => t.date.startsWith(selectedMonth)),
    [data.transactions, selectedMonth]
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
      .filter(b => b.type === "expense" && b.month === selectedMonth && b.limit > 0)
      .forEach(b => { map[b.category] = (map[b.category] || 0) + b.limit; });
    return map;
  }, [data.budgets, selectedMonth]);

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
        <div className="flex items-center justify-between">
          <span className="font-heading font-semibold text-sm">
            {formatMonthLabel(selectedMonth)}
          </span>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canGoPrev}
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canGoNext}
              onClick={() => navigate(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Income</p>
            <p className="text-xs font-heading font-semibold text-income truncate">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="bg-secondary/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Spent</p>
            <p className="text-xs font-heading font-semibold truncate">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="bg-secondary/60 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Left</p>
            <p className={`text-xs font-heading font-semibold truncate ${
              totalIncome - totalSpent >= 0 ? "text-income" : "text-expense"
            }`}>
              {formatCurrency(totalIncome - totalSpent)}
            </p>
          </div>
        </div>

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
