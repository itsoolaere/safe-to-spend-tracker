import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Plus, Trash2, ArrowLeft, Pencil } from "lucide-react";
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

const formatInputAmount = (val: string) => {
  const clean = val.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
};

function BudgetTable({
  type,
  label,
  budgets,
  actuals,
  editLimits,
  setEditLimits,
  onDelete,
}: {
  type: "income" | "expense";
  label: string;
  budgets: { category: string; limit: number; type: "income" | "expense"; month: string }[];
  actuals: Record<string, number>;
  editLimits: Record<string, string>;
  setEditLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onDelete: (category: string) => void;
}) {
  const active = budgets.filter(b => b.limit > 0);
  const total = active.reduce((s, b) => s + b.limit, 0);
  const totalActual = active.reduce((s, b) => s + (actuals[b.category] || 0), 0);

  if (active.length === 0) return null;

  const isExpense = type === "expense";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm">{label}</h3>
        <span className={`text-xs font-medium ${isExpense && totalActual > total ? "text-expense" : "text-muted-foreground"}`}>
          {formatCurrency(totalActual)} / {formatCurrency(total)}
        </span>
      </div>
      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[160px]">Category</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right w-[110px]">Actual</TableHead>
              <TableHead className="text-right w-[110px]">Budget</TableHead>
              <TableHead className="text-right w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map(budget => {
              const actual = actuals[budget.category] || 0;
              const pct = budget.limit > 0 ? Math.min((actual / budget.limit) * 100, 100) : 0;
              const over = isExpense && actual > budget.limit;
              const editKey = `${type}-${budget.category}`;
              const isEditing = editKey in editLimits;

              return (
                <TableRow key={budget.category}>
                  <TableCell className="font-medium text-sm">{budget.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={pct}
                        className={`h-2 flex-1 ${over ? "[&>div]:bg-expense" : isExpense ? "[&>div]:bg-primary" : "[&>div]:bg-income"}`}
                      />
                      <span className={`text-xs font-medium w-10 text-right ${over ? "text-expense" : "text-muted-foreground"}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                    {over && (
                      <p className="text-[11px] text-expense mt-0.5 font-medium">
                        Over by {formatCurrency(actual - budget.limit)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-semibold ${over ? "text-expense" : ""}`}>
                    {formatCurrency(actual)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        className="h-7 text-xs text-right w-24 ml-auto"
                        value={editLimits[editKey]}
                        onChange={e => setEditLimits(p => ({ ...p, [editKey]: formatInputAmount(e.target.value) }))}
                        autoFocus
                      />
                    ) : (
                      <button
                        className="text-sm font-medium inline-flex items-center gap-1 hover:text-primary transition-colors group"
                        onClick={() => setEditLimits(p => ({ ...p, [editKey]: String(budget.limit) }))}
                      >
                        {formatCurrency(budget.limit)}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-expense"
                      onClick={() => onDelete(budget.category)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function BudgetVsActual() {
  const { data, updateBudgets, period, setPeriod } = useBudget();
  const monthOptions = useMemo(getMonthOptions, []);

  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<"expense" | "income">("expense");
  const [newAmount, setNewAmount] = useState("");
  const [editLimits, setEditLimits] = useState<Record<string, string>>({});

  // Filter budgets for current period
  const periodBudgets = useMemo(() => data.budgets.filter(b => b.month === period), [data.budgets, period]);
  const expenseBudgets = periodBudgets.filter(b => b.type === "expense");
  const incomeBudgets = periodBudgets.filter(b => b.type === "income");

  const monthlyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions
      .filter(t => t.type === "expense" && t.date.startsWith(period))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [data.transactions, period]);

  const monthlyIncome = useMemo(() => {
    const map: Record<string, number> = {};
    data.transactions
      .filter(t => t.type === "income" && t.date.startsWith(period))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [data.transactions, period]);

  const hasEdits = Object.keys(editLimits).length > 0;

  const totalExpenseBudget = expenseBudgets.filter(b => b.limit > 0).reduce((s, b) => s + b.limit, 0);
  const totalExpenseSpent = expenseBudgets.filter(b => b.limit > 0).reduce((s, b) => s + (monthlyExpenses[b.category] || 0), 0);
  const totalIncomeBudget = incomeBudgets.filter(b => b.limit > 0).reduce((s, b) => s + b.limit, 0);
  const totalIncomeActual = incomeBudgets.filter(b => b.limit > 0).reduce((s, b) => s + (monthlyIncome[b.category] || 0), 0);

  const handleSave = () => {
    const updatedBudgets = data.budgets.map(b => {
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
    if (!newCategory) { toast.error("Select a category"); return; }
    const amount = parseFloat(newAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }

    // Remove existing budget for same category/type/month, then add new
    const filtered = data.budgets.filter(b => !(b.category === newCategory && b.type === newType && b.month === period));
    updateBudgets([...filtered, { category: newCategory, limit: amount, type: newType, month: period }]);
    setNewCategory("");
    setNewAmount("");
    toast.success("Budget entry added");
  };

  const handleDeleteExpense = (category: string) => {
    updateBudgets(data.budgets.filter(b => !(b.category === category && b.type === "expense" && b.month === period)));
    toast.success("Budget removed");
  };

  const handleDeleteIncome = (category: string) => {
    updateBudgets(data.budgets.filter(b => !(b.category === category && b.type === "income" && b.month === period)));
    toast.success("Budget removed");
  };

  const hasAnyBudgets = periodBudgets.some(b => b.limit > 0);

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
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

      {/* Summary cards - separate income & expense */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Expense Budget</p>
            <p className="text-lg font-heading font-bold mt-1">{formatCurrency(totalExpenseBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Expense Spent</p>
            <p className={`text-lg font-heading font-bold mt-1 ${totalExpenseSpent > totalExpenseBudget && totalExpenseBudget > 0 ? "text-expense" : ""}`}>
              {formatCurrency(totalExpenseSpent)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Income Budget</p>
            <p className="text-lg font-heading font-bold mt-1">{formatCurrency(totalIncomeBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Income Actual</p>
            <p className={`text-lg font-heading font-bold mt-1 ${totalIncomeActual >= totalIncomeBudget && totalIncomeBudget > 0 ? "text-income" : ""}`}>
              {formatCurrency(totalIncomeActual)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget tables */}
      {!hasAnyBudgets ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No budgets set for this month. Add one above to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <BudgetTable
            type="expense"
            label="Expense Budgets"
            budgets={expenseBudgets}
            actuals={monthlyExpenses}
            editLimits={editLimits}
            setEditLimits={setEditLimits}
            onDelete={handleDeleteExpense}
          />
          <BudgetTable
            type="income"
            label="Income Budgets"
            budgets={incomeBudgets}
            actuals={monthlyIncome}
            editLimits={editLimits}
            setEditLimits={setEditLimits}
            onDelete={handleDeleteIncome}
          />
        </div>
      )}
    </div>
  );
}
