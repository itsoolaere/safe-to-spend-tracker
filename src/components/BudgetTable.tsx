import { formatCurrency, formatInputAmount, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Trash2, Pencil } from "lucide-react";
import { Transaction } from "@/lib/types";

interface BudgetTableProps {
  type: "income" | "expense";
  label: string;
  budgets: { id: string; category: string; limit: number; type: "income" | "expense"; month: string; note?: string }[];
  actuals: Record<string, number>;
  transactions: Transaction[];
  editLimits: Record<string, string>;
  setEditLimits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onDelete: (id: string) => void;
}

export default function BudgetTable({
  type,
  label,
  budgets,
  actuals,
  transactions,
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
              const isEditing = budget.id in editLimits;

              const categoryTxs = transactions.filter(t => t.category === budget.category && t.type === type);

              return (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium text-sm">
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <span className="cursor-default hover:text-primary transition-colors">
                          <span>{budget.category}</span>
                          {budget.note && (
                            <span className="block text-xs text-muted-foreground font-normal truncate max-w-[140px]">
                              {budget.note}
                            </span>
                          )}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className="w-72 p-0">
                        <div className="p-3 border-b">
                          <p className="font-heading font-semibold text-sm">{budget.category}</p>
                          {budget.note && <p className="text-xs text-primary mt-0.5">{budget.note}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {categoryTxs.length} transaction{categoryTxs.length !== 1 ? "s" : ""} · {formatCurrency(actual)} of {formatCurrency(budget.limit)}
                          </p>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {categoryTxs.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-3">No transactions yet.</p>
                          ) : (
                            categoryTxs
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map(tx => (
                                <div key={tx.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 text-xs">
                                  <div className="min-w-0 flex-1 mr-2">
                                    <p className="font-medium truncate">{tx.description || "—"}</p>
                                    <p className="text-muted-foreground">{formatDate(tx.date)}</p>
                                  </div>
                                  <span className="font-semibold whitespace-nowrap">{formatCurrency(tx.amount)}</span>
                                </div>
                              ))
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
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
                        value={editLimits[budget.id]}
                        onChange={e => setEditLimits(p => ({ ...p, [budget.id]: formatInputAmount(e.target.value) }))}
                        autoFocus
                      />
                    ) : (
                      <button
                        className="text-sm font-medium inline-flex items-center gap-1 hover:text-primary transition-colors group"
                        onClick={() => setEditLimits(p => ({ ...p, [budget.id]: String(budget.limit) }))}
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
                      onClick={() => onDelete(budget.id)}
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
