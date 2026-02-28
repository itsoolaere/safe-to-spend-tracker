import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, PlusCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AddTransactionForm from "@/components/AddTransactionForm";

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
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Balance</p>
                    <p className="text-2xl font-heading font-bold mt-1">{formatCurrency(balance)}</p>
                  </div>
                  <Wallet className="w-8 h-8 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-2xl font-heading font-bold text-income mt-1">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-income/10 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-income" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-2xl font-heading font-bold text-expense mt-1">{formatCurrency(totalExpense)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-expense/10 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-expense" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Expense chart */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-heading">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseByCategory.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No expenses yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
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
            </Card>

            {/* Income chart */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-heading">Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeByCategory.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No income yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
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
            </Card>
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
