import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  const recent = useMemo(() => {
    const base = transactions.slice(0, 10);
    const filtered = typeFilter === "all" ? base : base.filter(t => t.type === typeFilter);
    return filtered.slice(0, 5);
  }, [transactions, typeFilter]);

  return (
    <Card className="border-none shadow-none bg-card/40 backdrop-blur-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-heading">Recent Transactions</CardTitle>
        <Link to="/history" className="text-xs text-primary hover:underline font-medium">
          See all transactions →
        </Link>
      </CardHeader>
      <CardContent>
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
  );
}
