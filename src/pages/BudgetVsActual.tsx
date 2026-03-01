import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatInputAmount, getMonthOptions } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BudgetTable from "@/components/BudgetTable";

export default function BudgetVsActual() {
  const { data, updateBudgets, period, setPeriod } = useBudget();
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newAmount, setNewAmount] = useState("");
  const [editLimits, setEditLimits] = useState<Record<string, string>>({});

  const periodBudgets = useMemo(() => data.budgets.filter((b) => b.month === period), [data.budgets, period]);
  const expenseBudgets = periodBudgets.filter((b) => b.type === "expense");
  const incomeBudgets = periodBudgets.filter((b) => b.type === "income");

  const monthlyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions.
    filter((t) => t.type === "expense" && t.date.startsWith(period)).
    forEach((t) => {map[t.category] = (map[t.category] || 0) + t.amount;});
    return map;
  }, [data.transactions, period]);

  const monthlyIncome = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions.
    filter((t) => t.type === "income" && t.date.startsWith(period)).
    forEach((t) => {map[t.category] = (map[t.category] || 0) + t.amount;});
    return map;
  }, [data.transactions, period]);

  const periodTransactions = useMemo(
    () => data.transactions.filter((t) => t.date.startsWith(period)),
    [data.transactions, period]
  );

  const hasEdits = Object.keys(editLimits).length > 0;

  const totalExpenseBudget = expenseBudgets.filter((b) => b.limit > 0).reduce((s, b) => s + b.limit, 0);
  const totalExpenseSpent = expenseBudgets.filter((b) => b.limit > 0).reduce((s, b) => s + (monthlyExpenses[b.category] || 0), 0);
  const totalIncomeBudget = incomeBudgets.filter((b) => b.limit > 0).reduce((s, b) => s + b.limit, 0);
  const totalIncomeActual = incomeBudgets.filter((b) => b.limit > 0).reduce((s, b) => s + (monthlyIncome[b.category] || 0), 0);

  const handleSave = () => {
    const updatedBudgets = data.budgets.map((b) => {
      const editKey = `${b.type}-${b.category}`;
      if (b.month === period && editLimits[editKey] !== undefined) {
        return { ...b, limit: parseFloat(editLimits[editKey].replace(/,/g, "")) || 0 };
      }
      return b;
    });
    updateBudgets(updatedBudgets);
    setEditLimits({});
    toast.success("Budgets updated");
  };

  const handleAddBudget = () => {
    if (!newCategory) {toast.error("Select a category");return;}
    const amount = parseFloat(newAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {toast.error("Enter a valid amount");return;}

    const filtered = data.budgets.filter((b) => !(b.category === newCategory && b.type === newType && b.month === period));
    updateBudgets([...filtered, { category: newCategory, limit: amount, type: newType, month: period }]);
    setNewCategory("");
    setNewAmount("");
    toast.success("Budget entry added");
  };

  const handleDelete = (type: "income" | "expense") => (category: string) => {
    updateBudgets(data.budgets.filter((b) => !(b.category === category && b.type === type && b.month === period)));
    toast.success("Budget removed");
  };

  const hasAnyBudgets = periodBudgets.some((b) => b.limit > 0);

  return (
    <div className="space-y-6 pb-20 sm:pb-0 max-w-3xl mx-auto">
      {/* Header */}
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
              {monthOptions.map((m) =>
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
          {hasEdits &&
          <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          }
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
              <Select value={newType} onValueChange={(v: "expense" | "income") => {setNewType(v);setNewCategory("");}}>
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
                  {data.categories[newType].map((c) =>
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
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
                  onChange={(e) => setNewAmount(formatInputAmount(e.target.value))} />

              </div>
            </div>
            <Button onClick={handleAddBudget} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Expense Budget</p>
            <p className="font-heading font-bold mt-1 text-base">{formatCurrency(totalExpenseBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Expense Spent</p>
            <p className="text-base my-[4px] font-bold">
              {formatCurrency(totalExpenseSpent)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Income Budget</p>
            <p className="font-heading font-bold mt-1 text-base">{formatCurrency(totalIncomeBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Income Actual</p>
            <p className="my-[4px] text-base font-bold">
              {formatCurrency(totalIncomeActual)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget tables */}
      {!hasAnyBudgets ?
      <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No budgets set for this month. Add one above to get started.
          </CardContent>
        </Card> :

      <div className="space-y-6">
          <BudgetTable type="expense" label="Expense Budgets" budgets={expenseBudgets} actuals={monthlyExpenses} transactions={periodTransactions} editLimits={editLimits} setEditLimits={setEditLimits} onDelete={handleDelete("expense")} />
          <BudgetTable type="income" label="Income Budgets" budgets={incomeBudgets} actuals={monthlyIncome} transactions={periodTransactions} editLimits={editLimits} setEditLimits={setEditLimits} onDelete={handleDelete("income")} />
        </div>
      }
    </div>);

}