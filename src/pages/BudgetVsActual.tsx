import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function getMonthOptions() {
  const months: { value: string; label: string }[] = [];
  const year = new Date().getFullYear();
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    const val = `${year}-${String(m + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ value: val, label });
  }
  return months;
}

export default function BudgetVsActual() {
  const { data, updateBudgets, period, setPeriod } = useBudget();
  const monthOptions = useMemo(getMonthOptions, []);

  // New budget entry form
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newAmount, setNewAmount] = useState("");

  const monthlyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions
      .filter(t => t.type === "expense" && t.date.startsWith(period))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [data.transactions, period]);

  const categories = data.categories.expense.filter(c => c !== "Other");
  const budgetMap = Object.fromEntries(data.budgets.map(b => [b.category, b.limit]));

  const [editLimits, setEditLimits] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newBudgets = categories.map(c => ({
      category: c,
      limit: parseFloat(editLimits[c]?.replace(/,/g, "") || "") || budgetMap[c] || 500,
    }));
    updateBudgets(newBudgets);
    setEditLimits({});
    toast.success("Budgets updated");
  };

  const handleAddBudget = () => {
    if (!newCategory) { toast.error("Select a category"); return; }
    const amount = parseFloat(newAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }

    const existing = data.budgets.filter(b => b.category !== newCategory);
    updateBudgets([...existing, { category: newCategory, limit: amount }]);
    setNewCategory("");
    setNewAmount("");
    toast.success("Budget entry added");
  };

  const handleDeleteBudget = (category: string) => {
    updateBudgets(data.budgets.filter(b => b.category !== category));
    toast.success("Budget removed");
  };

  const hasEdits = Object.keys(editLimits).length > 0;
  const totalBudget = data.budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = Object.values(monthlyExpenses).reduce((s, v) => s + v, 0);

  const formatInputAmount = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">Budget</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Plan your monthly spending</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasEdits && (
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          )}
        </div>
      </div>

      {/* Add new budget entry */}
      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle className="text-base font-heading">New Budget Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={newType} onValueChange={(v: "expense" | "income") => { setNewType(v); setNewCategory(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {data.categories[newType].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Limit Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                <Input
                  className="pl-7"
                  placeholder="0"
                  value={newAmount}
                  onChange={e => setNewAmount(formatInputAmount(e.target.value))}
                />
              </div>
            </div>
            <Button onClick={handleAddBudget} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Total Budget</p>
            <p className="text-xl font-heading font-bold mt-1">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className={`text-xl font-heading font-bold mt-1 ${totalSpent > totalBudget ? "text-expense" : "text-foreground"}`}>
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget items with progress */}
      <div className="space-y-3">
        {data.budgets.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No budgets set yet. Add one above to get started.
            </CardContent>
          </Card>
        ) : (
          data.budgets.map(budget => {
            const spent = monthlyExpenses[budget.category] || 0;
            const pct = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
            const over = spent > budget.limit;

            return (
              <Card key={budget.category} className="border-none shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{budget.category}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${over ? "text-expense" : "text-foreground"}`}>
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-muted-foreground text-xs">/</span>
                      <div className="w-20">
                        <Input
                          className="h-7 text-xs text-right"
                          value={editLimits[budget.category] ?? formatInputAmount(String(budget.limit))}
                          onChange={e => setEditLimits(p => ({ ...p, [budget.category]: e.target.value }))}
                          onFocus={() => {
                            if (!(budget.category in editLimits)) {
                              setEditLimits(p => ({ ...p, [budget.category]: String(budget.limit) }));
                            }
                          }}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-expense"
                        onClick={() => handleDeleteBudget(budget.category)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-2 ${over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`}
                  />
                  {over && (
                    <p className="text-xs text-expense mt-1 font-medium">
                      Over budget by {formatCurrency(spent - budget.limit)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
