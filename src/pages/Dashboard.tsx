import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, getMonthOptions } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSignUpGate } from "@/hooks/useSignUpGate";
import AddTransactionForm, { type AddTransactionFormRef } from "@/components/AddTransactionForm";
import CategoryChart from "@/components/CategoryChart";
import BudgetOverviewWidget from "@/components/BudgetOverviewWidget";
import RecentTransactions from "@/components/RecentTransactions";

const EXPENSE_COLORS = [
"hsl(4, 40%, 72%)", "hsl(20, 35%, 70%)", "hsl(340, 30%, 72%)",
"hsl(0, 25%, 68%)", "hsl(15, 30%, 74%)", "hsl(350, 28%, 70%)"];


const INCOME_COLORS = [
"hsl(168, 30%, 65%)", "hsl(145, 28%, 68%)", "hsl(160, 25%, 70%)",
"hsl(180, 22%, 68%)", "hsl(150, 25%, 72%)", "hsl(170, 20%, 66%)"];


export default function Dashboard() {
  const { data, period, setPeriod } = useBudget();
  const { user } = useAuth();
  const { freeLeft, incomeLeft, expenseLeft } = useSignUpGate();
  const { transactions } = data;
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const filtered = useMemo(() => {
    if (!period) return transactions;
    return transactions.filter((t) => t.date.startsWith(period));
  }, [transactions, period]);

  const totalIncome = useMemo(() => filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance = totalIncome - totalExpense;
  const overBudget = totalExpense > totalIncome;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => {map[t.category] = (map[t.category] || 0) + t.amount;});
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t) => t.type === "income").forEach((t) => {map[t.category] = (map[t.category] || 0) + t.amount;});
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const expenseTransactions = useMemo(() => filtered.filter((t) => t.type === "expense"), [filtered]);
  const incomeTransactions = useMemo(() => filtered.filter((t) => t.type === "income"), [filtered]);

  const formRef = useRef<HTMLDivElement>(null);
  const formApiRef = useRef<AddTransactionFormRef>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => formApiRef.current?.open(), 400);
  };

  const isEmptyGuest = !user && transactions.length === 0;

  if (isEmptyGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold text-foreground">safe to spend.</h1>
          <p className="text-muted-foreground">start by adding your first entry below.</p>
        </div>
        <div className="w-full max-w-md">
          <AddTransactionForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-0 relative">
      {/* Date filter + Budget button */}
      <div className="flex items-center justify-between gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) =>
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            )}
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
      {overBudget &&
      <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your expenses ({formatCurrency(totalExpense)}) exceed your income ({formatCurrency(totalIncome)}) by {formatCurrency(totalExpense - totalIncome)}.
          </AlertDescription>
        </Alert>
      }

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - Summary + Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className={`border-none shadow-sm ${overBudget ? "bg-expense text-expense-foreground" : "bg-primary text-primary-foreground"}`}>
              <CardContent className="pt-6">
                <p className="text-sm opacity-80">safe to spend</p>
                <p className="font-heading font-bold mt-1 text-xl">{formatCurrency(balance)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="font-heading font-bold text-income mt-1 text-xl">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="font-heading font-bold text-expense mt-1 text-xl">{formatCurrency(totalExpense)}</p>
              </CardContent>
            </Card>
          </div>


          <BudgetOverviewWidget budgets={data.budgets} transactions={transactions} period={period} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CategoryChart
              title="How I Spent"
              data={expenseByCategory}
              colors={EXPENSE_COLORS}
              transactions={expenseTransactions}
              emptyMessage="No expenses yet" />

            <CategoryChart
              title="What came in"
              data={incomeByCategory}
              colors={INCOME_COLORS}
              transactions={incomeTransactions}
              emptyMessage="No income yet" />

          </div>
        </div>

        {/* RIGHT COLUMN - Add Form + Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div ref={formRef}>
            <AddTransactionForm ref={formApiRef} />
          </div>
          {!user && freeLeft < Infinity && (
            <p className="text-xs text-muted-foreground italic text-center">
              {freeLeft > 0
                ? `${freeLeft} free ${freeLeft === 1 ? "entry" : "entries"} left (${incomeLeft} income, ${expenseLeft} expense).`
                : "guest limit reached."}
            </p>
          )}
          <RecentTransactions transactions={filtered} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={scrollToForm}
        className="sm:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add new entry"
      >
        <PlusCircle className="w-6 h-6" />
      </button>
    </div>);

}