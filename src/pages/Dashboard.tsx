import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, getMonthOptions } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import AddTransactionForm from "@/components/AddTransactionForm";
import CategoryChart from "@/components/CategoryChart";
import BudgetOverviewWidget from "@/components/BudgetOverviewWidget";
import RecentTransactions from "@/components/RecentTransactions";

const EXPENSE_COLORS = [
  "hsl(4, 40%, 72%)", "hsl(20, 35%, 70%)", "hsl(340, 30%, 72%)",
  "hsl(0, 25%, 68%)", "hsl(15, 30%, 74%)", "hsl(350, 28%, 70%)",
];

const INCOME_COLORS = [
  "hsl(168, 30%, 65%)", "hsl(145, 28%, 68%)", "hsl(160, 25%, 70%)",
  "hsl(180, 22%, 68%)", "hsl(150, 25%, 72%)", "hsl(170, 20%, 66%)",
];

export default function Dashboard() {
  const { data, period, setPeriod } = useBudget();
  const { transactions } = data;
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const filtered = useMemo(() => {
    if (!period) return transactions;
    return transactions.filter(t => t.date.startsWith(period));
  }, [transactions, period]);

  const totalIncome = useMemo(() => filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance = totalIncome - totalExpense;
  const overBudget = totalExpense > totalIncome;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "income").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const expenseTransactions = useMemo(() => filtered.filter(t => t.type === "expense"), [filtered]);
  const incomeTransactions = useMemo(() => filtered.filter(t => t.type === "income"), [filtered]);

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Date filter + Budget button */}
      <div className="flex items-center justify-between gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" asChild>
          <Link to="/budget">
            <PlusCircle className="w-4 h-4 mr-1" />
            Budget
          </Link>
        </Button>
      </div>

      {/* Warning */}
      {overBudget && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your expenses ({formatCurrency(totalExpense)}) exceed your income ({formatCurrency(totalIncome)}) by {formatCurrency(totalExpense - totalIncome)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - Summary + Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className={`border-none shadow-sm ${overBudget ? "bg-expense text-expense-foreground" : "bg-primary text-primary-foreground"}`}>
              <CardContent className="pt-6">
                <p className="text-sm opacity-80">Balance</p>
                <p className="text-2xl font-heading font-bold mt-1">{formatCurrency(balance)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-2xl font-heading font-bold text-income mt-1">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-heading font-bold text-expense mt-1">{formatCurrency(totalExpense)}</p>
              </CardContent>
            </Card>
          </div>

          <BudgetOverviewWidget budgets={data.budgets} transactions={transactions} period={period} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CategoryChart
              title="Expenses by Category"
              data={expenseByCategory}
              colors={EXPENSE_COLORS}
              transactions={expenseTransactions}
              emptyMessage="No expenses yet"
            />
            <CategoryChart
              title="Income by Category"
              data={incomeByCategory}
              colors={INCOME_COLORS}
              transactions={incomeTransactions}
              emptyMessage="No income yet"
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Add Form + Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <AddTransactionForm />
          <RecentTransactions transactions={filtered} />
        </div>
      </div>
    </div>
  );
}
