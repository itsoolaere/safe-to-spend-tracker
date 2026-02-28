import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, PlusCircle, ChevronDown, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AddTransactionForm from "@/components/AddTransactionForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const EXPENSE_COLORS = [
  "hsl(4, 40%, 72%)",
  "hsl(20, 35%, 70%)",
  "hsl(340, 30%, 72%)",
  "hsl(0, 25%, 68%)",
  "hsl(15, 30%, 74%)",
  "hsl(350, 28%, 70%)",
];

const INCOME_COLORS = [
  "hsl(168, 30%, 65%)",
  "hsl(145, 28%, 68%)",
  "hsl(160, 25%, 70%)",
  "hsl(180, 22%, 68%)",
  "hsl(150, 25%, 72%)",
  "hsl(170, 20%, 66%)",
];

function getMonthOptions() {
  const months: { value: string; label: string }[] = [];
  const year = new Date().getFullYear();
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    const val = `${year}-${String(m + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    months.push({ value: val, label });
  }
  return months;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  transactions: { category: string; description: string; amount: number }[];
}

function CategoryTooltip({ active, payload, label, transactions }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const items = transactions
    .filter(t => t.category === label)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold mb-1.5">{label}: {formatCurrency(payload[0].value)}</p>
      {items.length > 0 && (
        <div className="space-y-1 border-t pt-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate mr-2">{item.description || "No desc"}</span>
              <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, period, setPeriod } = useBudget();
  const { transactions } = data;
  const monthOptions = useMemo(getMonthOptions, []);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

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
    filtered.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "income").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const expenseTransactions = useMemo(() => filtered.filter(t => t.type === "expense"), [filtered]);
  const incomeTransactions = useMemo(() => filtered.filter(t => t.type === "income"), [filtered]);

  const recentFiltered = useMemo(() => {
    const base = filtered.slice(0, 10);
    if (typeFilter === "all") return base;
    return base.filter(t => t.type === typeFilter);
  }, [filtered, typeFilter]);

  const recent = recentFiltered.slice(0, 5);

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

          {/* Mini Budget Widget */}
          {(() => {
            const periodBudgets = data.budgets.filter(b => b.month === period && b.limit > 0);
            if (periodBudgets.length === 0) return null;

            const expBudgets = periodBudgets.filter(b => b.type === "expense");
            const incBudgets = periodBudgets.filter(b => b.type === "income");

            const monthlyExpenses: Record<string, number> = {};
            filtered.filter(t => t.type === "expense").forEach(t => {
              monthlyExpenses[t.category] = (monthlyExpenses[t.category] || 0) + t.amount;
            });
            const monthlyIncome: Record<string, number> = {};
            filtered.filter(t => t.type === "income").forEach(t => {
              monthlyIncome[t.category] = (monthlyIncome[t.category] || 0) + t.amount;
            });

            const totalExpBudget = expBudgets.reduce((s, b) => s + b.limit, 0);
            const totalExpSpent = expBudgets.reduce((s, b) => s + (monthlyExpenses[b.category] || 0), 0);
            const expPct = totalExpBudget > 0 ? Math.min((totalExpSpent / totalExpBudget) * 100, 100) : 0;
            const expOver = totalExpSpent > totalExpBudget;

            const totalIncBudget = incBudgets.reduce((s, b) => s + b.limit, 0);
            const totalIncActual = incBudgets.reduce((s, b) => s + (monthlyIncome[b.category] || 0), 0);
            const incPct = totalIncBudget > 0 ? Math.min((totalIncActual / totalIncBudget) * 100, 100) : 0;

            return (
              <Card className="border-none shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base font-heading">Budget Overview</CardTitle>
                  </div>
                  <Link to="/budget" className="text-xs text-primary hover:underline font-medium">
                    Manage →
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expBudgets.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Expenses</span>
                        <span className={`font-semibold ${expOver ? "text-expense" : ""}`}>
                          {formatCurrency(totalExpSpent)} / {formatCurrency(totalExpBudget)}
                        </span>
                      </div>
                      <Progress
                        value={expPct}
                        className={`h-2 ${expOver ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`}
                      />
                    </div>
                  )}
                  {incBudgets.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Income</span>
                        <span className="font-semibold">
                          {formatCurrency(totalIncActual)} / {formatCurrency(totalIncBudget)}
                        </span>
                      </div>
                      <Progress
                        value={incPct}
                        className="h-2 [&>div]:bg-income"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Expense chart - collapsible */}
            <Collapsible defaultOpen={expenseByCategory.length > 0} open={expenseByCategory.length === 0 ? false : undefined}>
              <Card className="border-none shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
                    <CardTitle className="text-base font-heading">Expenses by Category</CardTitle>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    {expenseByCategory.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">No expenses yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(120, expenseByCategory.length * 40)}>
                        <BarChart data={expenseByCategory} layout="vertical" margin={{ left: 0, right: 16 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CategoryTooltip transactions={expenseTransactions} />} cursor={false} />
                          <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                            {expenseByCategory.map((_, i) => (
                              <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Income chart - collapsible */}
            <Collapsible defaultOpen={incomeByCategory.length > 0} open={incomeByCategory.length === 0 ? false : undefined}>
              <Card className="border-none shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
                    <CardTitle className="text-base font-heading">Income by Category</CardTitle>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    {incomeByCategory.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">No income yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(120, incomeByCategory.length * 40)}>
                        <BarChart data={incomeByCategory} layout="vertical" margin={{ left: 0, right: 16 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CategoryTooltip transactions={incomeTransactions} />} cursor={false} />
                          <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                            {incomeByCategory.map((_, i) => (
                              <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>

        {/* RIGHT COLUMN - Add Form + Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Transaction Form */}
          <AddTransactionForm />

          {/* Recent transactions */}
          <Card className="border-none shadow-none bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-heading">Recent Transactions</CardTitle>
              <Link to="/history" className="text-xs text-primary hover:underline font-medium">
                See all transactions →
              </Link>
            </CardHeader>
            <CardContent>
              {/* Type filter */}
              <div className="flex gap-1 mb-4">
                {(["all", "income", "expense"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "all" ? "All" : t === "income" ? "Income" : "Expenses"}
                  </button>
                ))}
              </div>

              {recent.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {recent.map(t => (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-income" : "bg-expense"}`} />
                        <div>
                          <p className="text-sm font-medium">{t.description || t.category}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
