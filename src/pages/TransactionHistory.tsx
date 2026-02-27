import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TransactionHistory() {
  const { data, deleteTransaction } = useBudget();
  const { transactions } = data;

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success("Transaction deleted");
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">Transaction History</h2>
        <p className="text-muted-foreground text-sm mt-1">{transactions.length} transactions</p>
      </div>

      {transactions.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            No transactions yet. Add your first one!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((t, i) => (
            <Card key={t.id} className="border-none shadow-sm animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.type === "income" ? "bg-income" : "bg-expense"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || t.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category} · {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-expense"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
