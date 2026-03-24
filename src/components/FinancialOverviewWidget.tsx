import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency } from "@/lib/format";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinancialOverviewWidget() {
  const { data } = useBudget();
  const currentMonth = getCurrentMonth();

  const totalAssets = useMemo(
    () => data.assets.reduce((s, a) => s + a.value, 0),
    [data.assets]
  );

  const totalObligations = useMemo(
    () => data.currentObligations.reduce((s, o) => s + o.balance, 0),
    [data.currentObligations]
  );

  const netPosition = totalAssets - totalObligations;
  const isSurplus = netPosition >= 0;

  // Monthly income: use income budgets for current period, or fall back to actual transactions
  const monthlyIncome = useMemo(() => {
    const budgetIncome = data.budgets
      .filter(b => b.type === "income" && b.month === currentMonth)
      .reduce((s, b) => s + b.limit, 0);
    if (budgetIncome > 0) return budgetIncome;
    return data.transactions
      .filter(t => t.type === "income" && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
  }, [data.budgets, data.transactions, currentMonth]);

  const incomeMultiple = monthlyIncome > 0 ? netPosition / monthlyIncome : null;

  // Only show widget if there's something meaningful to display
  const hasData = totalAssets > 0 || totalObligations > 0;
  if (!hasData) return null;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Financial Overview</p>
          <Link
            to="/overview"
            className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
          >
            See full overview
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Total Assets</p>
            <p className="font-heading font-semibold text-income text-sm mt-0.5">{formatCurrency(totalAssets)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Obligations</p>
            <p className="font-heading font-semibold text-expense text-sm mt-0.5">{formatCurrency(totalObligations)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Net Position</p>
            <p className={`font-heading font-semibold text-sm mt-0.5 ${isSurplus ? "text-income" : "text-expense"}`}>
              {isSurplus ? "" : "−"}{formatCurrency(Math.abs(netPosition))}
            </p>
          </div>
        </div>

        {incomeMultiple !== null && Math.abs(netPosition) > 0 && (
          <p className="text-[11px] text-muted-foreground italic">
            {isSurplus
              ? `That's ${incomeMultiple.toFixed(1)}× your monthly income in net surplus.`
              : `Net deficit is ${Math.abs(incomeMultiple).toFixed(1)}× your monthly income.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
