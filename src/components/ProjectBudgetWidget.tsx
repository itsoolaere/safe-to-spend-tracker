import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectBudget, ProjectExpense } from "@/lib/types";

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

const BAR_MAX_H = 80;

interface Props {
  project: ProjectBudget;
  expenses: ProjectExpense[];
}

export default function ProjectBudgetWidget({ project, expenses }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return map;
  }, [expenses]);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const pctUsed = project.totalBudget > 0 ? (totalSpent / project.totalBudget) * 100 : 0;
  const remaining = project.totalBudget - totalSpent;

  const categories = useMemo(() => Object.keys(expenseByCategory), [expenseByCategory]);

  const categoryColors: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat, i) => { map[cat] = CAT_COLORS[i % CAT_COLORS.length]; });
    return map;
  }, [categories]);

  const maxValue = useMemo(
    () => Math.max(...categories.map(c => expenseByCategory[c] || 0), 1),
    [categories, expenseByCategory]
  );

  const selActual = selectedCategory ? (expenseByCategory[selectedCategory] || 0) : 0;
  const selPct = project.totalBudget > 0 ? Math.round((selActual / project.totalBudget) * 100) : 0;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-4 pb-5 space-y-4">
        <span className="font-heading font-semibold text-sm">Budget Overview</span>

        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No expenses logged yet.
          </p>
        ) : (
          <div className="bg-secondary/30 rounded-xl p-3.5 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Project spending</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                pctUsed > 100 ? "bg-expense/15 text-expense" : "bg-primary/15 text-primary"
              }`}>
                {Math.round(pctUsed)}% used
              </span>
            </div>

            {/* Stacked progress bar */}
            <div className="space-y-1.5">
              <div className="relative h-3 bg-secondary rounded-full overflow-hidden flex">
                {categories.filter(c => (expenseByCategory[c] || 0) > 0).map(cat => (
                  <div
                    key={cat}
                    className="h-full flex-shrink-0 transition-all duration-500"
                    style={{
                      width: `${Math.min((expenseByCategory[cat] / project.totalBudget) * 100, 100)}%`,
                      backgroundColor: categoryColors[cat],
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{formatCurrency(totalSpent)} spent</span>
                <span>{formatCurrency(project.totalBudget)} budget</span>
              </div>
            </div>

            <div className="border-t border-border/50" />

            {/* Detail row */}
            <div className="bg-card rounded-lg px-3 py-2 min-h-[44px] flex items-center">
              {!selectedCategory ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-muted-foreground italic">
                    Tap a category to see details
                  </span>
                  <span className={`text-sm font-semibold ${remaining >= 0 ? "text-income" : "text-expense"}`}>
                    {remaining >= 0
                      ? `${formatCurrency(remaining)} left`
                      : `${formatCurrency(Math.abs(remaining))} over`}
                  </span>
                </div>
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
                      {formatCurrency(selActual)} · {selPct}% of total budget
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bar chart */}
            {categories.length > 0 && (
              <div
                className="flex items-end gap-1.5 justify-around"
                style={{ height: `${BAR_MAX_H + 20}px` }}
              >
                {categories.map(cat => {
                  const actual = expenseByCategory[cat] || 0;
                  const barH = Math.max(Math.round((actual / maxValue) * BAR_MAX_H), 2);
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
                            backgroundColor: categoryColors[cat],
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
