import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

const CHART_COLORS = [
  "hsl(168, 55%, 38%)",
  "hsl(38, 90%, 55%)",
  "hsl(4, 72%, 60%)",
  "hsl(220, 60%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(190, 70%, 45%)",
];

export default function Dashboard() {
  const { data } = useBudget();
  const { transactions } = data;

  const totalIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Your financial overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
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

      {/* Safe to spend indicator */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Safe to Spend</p>
              <p className={`text-3xl font-heading font-bold ${balance >= 0 ? "text-income" : "text-expense"}`}>
                {formatCurrency(Math.max(0, balance))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "0.75rem", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20}>
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
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
  );
}
