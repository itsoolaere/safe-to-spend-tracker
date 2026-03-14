import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectBudget, ProjectBudgetLine, ProjectExpense } from "@/lib/types";

const CAT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(36 65% 52%)",
  "hsl(180 40% 42%)",
  "hsl(320 30% 52%)",
  "hsl(55 45% 46%)",
];

const EXPENSE_COLOR = "hsl(var(--expense))";
const BAR_MAX_H = 80;

interface Props {
  project: ProjectBudget;
  budgetLines: ProjectBudgetLine[];
  expenses: ProjectExpense[];
}

export default function ProjectBudgetWidget({ project, budgetLines, expenses }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return map;
  }, [expenses]);

  const budgetByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    budgetLines.forEach(l => { map[l.category] = (map[l.category] || 0) + l.limit; });
    return map;
  }, [budgetLines]);

  const totalBudget = budgetLines.reduce((s, l) => s + l.limit, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const pctUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Union of categories that have spending or a budget line
  const categories = useMemo(() =>
    Array.from(new Set([...Object.keys(budgetByCategory), ...Object.keys(expenseByCategory)])),
    [budgetByCategory, expenseByCategory]
  );

  const categoryColors: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat, i) => { map[cat] = CAT_COLORS[i % CAT_COLORS.length]; });
    return map;
  }, [categories]);

  // Bars based on budget limit, not actual
  const maxBudgetValue = useMemo(() => {
    const vals = categories.map(cat => budgetByCategory[cat] ?? expenseByCategory[cat] ?? 0);
    return Math.max(...vals, 1);
  }, [categories, budgetByCategory, expenseByCategory]);

  // Stacked bar segments by actual spending
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

  const selActual = selectedCategory ? (expenseByCategory[selectedCategory] || 0) : 0;
  const selBudget = selectedCategory ? (budgetByCategory[selectedCategory] || 0) : 0;
  const selPct = selBudget > 0 ? Math.round((selActual / selBudget) * 100) : 0;
  const selLeft = selBudget - selActual;

  const hasData = categories.length > 0;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-4 pb-5 space-y-4">
        <span className="font-heading font-semibold text-sm">Budget Overview</span>

        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add budget lines to see the overview.
          </p>
        ) : (
          <div className="bg-secondary/30 rounded-xl p-3.5 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Project spending</span>
              {totalBudget > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  pctUsed > 100 ? "bg-expense/15 text-expense" : "bg-primary/15 text-primary"
                }`}>
                  {Math.round(pctUsed)}% used
                </span>
              )}
            </div>

            {/* Stacked progress bar */}
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

            {/* Detail tooltip row */}
            <div className="bg-card rounded-lg px-3 py-2 min-h-[44px] flex items-center">
              {!selectedCategory ? (
                <p className="text-xs text-muted-foreground italic w-full text-center">
                  Tap a category to see details
                </p>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: categoryColors[selectedCategory] }}>
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

            {/* Bar chart — bars sized by budget limit */}
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
                      <div
                        className="relative w-full flex items-end justify-center"
                        style={{ height: `${BAR_MAX_H}px` }}
                      >
                        <div
                          className="w-full max-w-[28px] rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${barH}px`,
                            backgroundColor: isOver ? EXPENSE_COLOR : categoryColors[cat],
                            opacity: isUnselected ? 0.2 : 1,
                          }}
                        />
                      </div>
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

            {/* Legend */}
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
