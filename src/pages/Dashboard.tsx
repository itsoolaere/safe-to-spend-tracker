import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, getMonthOptions } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { computeOpeningBalance } from "@/lib/balance";
import { useAuth } from "@/context/AuthContext";
import { useSignUpGate } from "@/hooks/useSignUpGate";
import AddTransactionForm, { type AddTransactionFormRef } from "@/components/AddTransactionForm";
import CategoryBarChart from "@/components/CategoryBarChart";
import BeginningBalance from "@/components/BeginningBalance";
import BudgetDonut from "@/components/BudgetDonut";
import ClearDataDialog from "@/components/ClearDataDialog";
import CategoryManager from "@/components/CategoryManager";
import RecentTransactions from "@/components/RecentTransactions";
import QuickTip from "@/components/QuickTip";
import type { TipState } from "@/lib/tips";



export default function Dashboard() {
  const { data, period, setPeriod } = useBudget();
  const { user } = useAuth();
  const { freeLeft, incomeLeft, expenseLeft, setManualTrigger } = useSignUpGate();
  const { transactions } = data;
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const filtered = useMemo(() => {
    if (!period) return transactions;
    return transactions.filter((t) => t.date.startsWith(period));
  }, [transactions, period]);

  const totalIncome = useMemo(() => filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);
  const beginningBalance = computeOpeningBalance(data, period);
  const balance = beginningBalance + totalIncome - totalExpense;
  const overBudget = totalExpense > (beginningBalance + totalIncome);

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

  const budgetDonutCategories = useMemo(() => {
    const expBudgets = data.budgets.filter((b) => b.month === period && b.limit > 0 && b.type === "expense");
    const spentByCategory: Record<string, number> = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });
    // Deduplicate by category name — sum budget limits so multiple entries
    // for the same category don't inflate totalSpent or create duplicate legend rows
    const categoryMap: Record<string, { spent: number; budget: number }> = {};
    expBudgets.forEach((b) => {
      if (categoryMap[b.category]) {
        categoryMap[b.category].budget += b.limit;
      } else {
        categoryMap[b.category] = { spent: spentByCategory[b.category] || 0, budget: b.limit };
      }
    });
    return Object.entries(categoryMap).map(([name, { spent, budget }]) => ({ name, spent, budget }));
  }, [data.budgets, filtered, period]);

  const overBudgetNames = useMemo(
    () => new Set(budgetDonutCategories.filter((c) => c.spent > c.budget).map((c) => c.name)),
    [budgetDonutCategories]
  );

  const formRef = useRef<HTMLDivElement>(null);
  const formApiRef = useRef<AddTransactionFormRef>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [rightColHeight, setRightColHeight] = useState<number | undefined>();

  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (window.innerWidth >= 1024) setRightColHeight(el.offsetHeight);
      else setRightColHeight(undefined);
    });
    observer.observe(el);
    const onResize = () => {
      if (window.innerWidth >= 1024) setRightColHeight(el.offsetHeight);
      else setRightColHeight(undefined);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => { observer.disconnect(); window.removeEventListener("resize", onResize); };
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => formApiRef.current?.open(), 400);
  };

  const tipState = useMemo<TipState>(() => ({
    totalIncome, totalExpense, balance,
    expenseByCategory, budgets: data.budgets,
    transactionCount: filtered.length, period,
  }), [totalIncome, totalExpense, balance, expenseByCategory, data.budgets, filtered.length, period]);

  const isEmptyGuest = !user && transactions.length === 0;

  if (isEmptyGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground">start by adding your first entry below.</p>
          <p className="text-sm text-muted-foreground">
            have an account?{" "}
            <button
              type="button"
              onClick={() => setManualTrigger(true)}
              className="text-primary hover:underline underline-offset-2 font-medium"
            >
              sign in
            </button>
          </p>
        </div>
        <BeginningBalance />
        <div className="w-full max-w-md">
          <AddTransactionForm />
        </div>
      </div>);

  }

  return (
    <div className="space-y-4 pb-24 sm:pb-0 relative">
      {/* Date filter + Budget button */}
      <div className="flex items-center justify-between gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] text-xs h-9">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) =>
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ClearDataDialog />
          <Button variant="outline" size="sm" className="h-9 text-xs" asChild>
            <Link to="/budget">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Budget
            </Link>
          </Button>
        </div>
      </div>
      <BeginningBalance />
      {overBudget &&
      <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your expenses ({formatCurrency(totalExpense)}) exceed your income ({formatCurrency(totalIncome)}) by {formatCurrency(totalExpense - totalIncome)}.
          </AlertDescription>
        </Alert>
      }

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* LEFT COLUMN - Summary + Charts */}
        <div ref={leftColRef} className="lg:col-span-3 space-y-4 sm:space-y-6 lg:self-start">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className={`border-none shadow-sm ${overBudget ? "bg-expense text-expense-foreground" : "bg-primary text-primary-foreground"}`}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs opacity-80">safe to spend</p>
                <p className="font-heading font-bold mt-0.5 text-lg">{formatCurrency(balance)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="font-heading font-bold text-income mt-0.5 text-lg">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="font-heading font-bold text-expense mt-0.5 text-lg">{formatCurrency(totalExpense)}</p>
              </CardContent>
            </Card>
          </div>

          <QuickTip state={tipState} />

          <BudgetDonut categories={budgetDonutCategories} />

          <div className="grid grid-cols-2 gap-6">
            <CategoryBarChart
              title="How I Spent"
              data={expenseByCategory}
              type="expense"
              overBudgetNames={overBudgetNames}
              emptyMessage="No expenses yet" />

            <CategoryBarChart
              title="What came in"
              data={incomeByCategory}
              type="income"
              emptyMessage="No income yet" />
          </div>
        </div>

        {/* RIGHT COLUMN - Add Form + Recent Transactions */}
        <div
          className="lg:col-span-2 flex flex-col gap-4 sm:gap-6 overflow-hidden"
          style={{ height: rightColHeight }}
        >
          <div ref={formRef}>
            <AddTransactionForm ref={formApiRef} />
          </div>
          {!user && freeLeft < Infinity &&
          <p className="text-xs text-muted-foreground italic text-center">
              {freeLeft > 0 ?
            `${freeLeft} free ${freeLeft === 1 ? "entry" : "entries"} left (${incomeLeft} income, ${expenseLeft} expense).` :

            <>
                    guest limit reached.{" "}
                    <button
                type="button"
                onClick={() => setManualTrigger(true)}
                className="text-primary hover:underline underline-offset-2 font-medium not-italic">
                
                      sign up to continue
                    </button>
                  </>
            }
            </p>
          }
          <CategoryManager />
          <div className="flex-1 min-h-0 overflow-hidden">
            <RecentTransactions transactions={filtered} />
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={scrollToForm}
        className="sm:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add new entry">
        
        <PlusCircle className="w-6 h-6" />
      </button>
    </div>);

}