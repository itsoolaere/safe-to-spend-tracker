import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function BudgetVsActual() {
  const { data, updateBudgets } = useBudget();
  const [editLimits, setEditLimits] = useState<Record<string, string>>({});

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions
      .filter(t => t.type === "expense" && t.date.startsWith(currentMonth))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [data.transactions, currentMonth]);

  const categories = data.categories.expense.filter(c => c !== "Other");
  const budgetMap = Object.fromEntries(data.budgets.map(b => [b.category, b.limit]));

  const handleSave = () => {
    const newBudgets = categories.map(c => ({
      category: c,
      limit: parseFloat(editLimits[c]?.replace(/,/g, "") || "") || budgetMap[c] || 500,
    }));
    updateBudgets(newBudgets);
    setEditLimits({});
    toast.success("Budgets updated");
  };

  const hasEdits = Object.keys(editLimits).length > 0;

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Budget vs Actual</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        {hasEdits && (
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {categories.map(cat => {
          const limit = parseFloat(editLimits[cat]?.replace(/,/g, "") || "") || budgetMap[cat] || 500;
          const spent = monthlyExpenses[cat] || 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const over = spent > limit;

          return (
            <Card key={cat} className="border-none shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{cat}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${over ? "text-expense" : "text-foreground"}`}>
                      {formatCurrency(spent)}
                    </span>
                    <span className="text-muted-foreground text-xs">/</span>
                    <div className="w-20">
                      <Input
                        className="h-7 text-xs text-right"
                        value={editLimits[cat] ?? formatCurrency(budgetMap[cat] || 500).replace("$", "")}
                        onChange={e => setEditLimits(p => ({ ...p, [cat]: e.target.value }))}
                        onFocus={() => {
                          if (!(cat in editLimits)) {
                            setEditLimits(p => ({ ...p, [cat]: String(budgetMap[cat] || 500) }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <Progress
                  value={pct}
                  className={`h-2 ${over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`}
                />
                {over && (
                  <p className="text-xs text-expense mt-1 font-medium">
                    Over budget by {formatCurrency(spent - limit)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
