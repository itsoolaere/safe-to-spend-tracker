import { formatCurrency, formatInputAmount } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Pencil } from "lucide-react";

interface BudgetTableProps {
  type: "income" | "expense";
  label: string;
  budgets: { category: string; limit: number; type: "income" | "expense"; month: string }[];
  actuals: Record<string, number>;
  editLimits: Record<string, string>;
  setEditLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onDelete: (category: string) => void;
}

export default function BudgetTable({
  type,
  label,
  budgets,
  actuals,
  editLimits,
  setEditLimits,
  onDelete,
}: BudgetTableProps) {
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
