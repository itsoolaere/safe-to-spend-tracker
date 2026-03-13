import { useState } from "react";
import { formatCurrency, formatInputAmount, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Pencil, ChevronDown } from "lucide-react";
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
  onSave: () => void;
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
  onSave,
}: BudgetTableProps) {
  const active = budgets.filter(b => b.limit > 0);
  if (active.length === 0) return null;

  const isExpense = type === "expense";
  const total = active.reduce((s, b) => s + b.limit, 0);
  const uniqueCategories = Array.from(new Set(active.map(b => b.category)));
  const totalActual = uniqueCategories.reduce((s, cat) => s + (actuals[cat] || 0), 0);

  // Group entries by category
  const grouped = active.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {} as Record<string, typeof active>);

  // Track open state per category — collapsed by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Object.keys(grouped).map(cat => [cat, false]))
  );

  const toggleCategory = (cat: string) =>
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm">{label}</h3>
        <span className={`text-xs font-medium ${isExpense && totalActual > total ? "text-expense" : "text-muted-foreground"}`}>
          {formatCurrency(totalActual)} / {formatCurrency(total)}
        </span>
      </div>
      <Card className="border-none shadow-sm divide-y divide-border">
        {Object.entries(grouped).map(([category, entries]) => {
          const actual = actuals[category] || 0;
          const categoryBudgetTotal = entries.reduce((s, b) => s + b.limit, 0);
          const categoryTxs = transactions.filter(t => t.category === category && t.type === type);
          const isOpen = openCategories[category] ?? false;

          return (
            <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
            <div className="p-3 space-y-2.5">
              {/* Category header */}
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1">
                      {category}
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(categoryBudgetTotal)}</span>
                  </div>
                  </CollapsibleTrigger>
                </HoverCardTrigger>
                <HoverCardContent side="right" align="start" className="w-72 p-0">
                  <div className="p-3 border-b">
                    <p className="font-heading font-semibold text-sm">{category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {categoryTxs.length} transaction{categoryTxs.length !== 1 ? "s" : ""} · {formatCurrency(actual)}
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

              {/* Entries under this category */}
              <CollapsibleContent className="space-y-2.5">
              {entries.map(budget => {
                const pct = budget.limit > 0 ? Math.min((actual / budget.limit) * 100, 100) : 0;
                const over = isExpense && actual > budget.limit;
                const isEditing = budget.id in editLimits;

                return (
                  <div key={budget.id} className="space-y-1 pl-2 border-l-2 border-border">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {budget.note || <span className="italic opacity-50">no note</span>}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditing ? (
                          <Input
                            className="h-6 text-xs text-right w-20"
                            value={editLimits[budget.id]}
                            onChange={e => setEditLimits(p => ({ ...p, [budget.id]: formatInputAmount(e.target.value) }))}
                            onKeyDown={e => e.key === "Enter" && onSave()}
                            autoFocus
                          />
                        ) : (
                          <button
                            className="text-xs font-medium inline-flex items-center gap-1 hover:text-primary transition-colors group"
                            onClick={() => setEditLimits(p => ({ ...p, [budget.id]: String(budget.limit) }))}
                          >
                            {formatCurrency(budget.limit)}
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-expense"
                          onClick={() => onDelete(budget.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={pct}
                        className={`h-1.5 flex-1 ${over ? "[&>div]:bg-expense" : isExpense ? "[&>div]:bg-primary" : "[&>div]:bg-income"}`}
                      />
                      <span className={`text-xs w-8 text-right ${over ? "text-expense font-medium" : "text-muted-foreground"}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                    {over && (
                      <p className="text-[11px] text-expense font-medium">
                        Over by {formatCurrency(actual - budget.limit)}
                      </p>
                    )}
                  </div>
                );
              })}
              </CollapsibleContent>
            </div>
            </Collapsible>
          );
        })}
      </Card>
    </div>
  );
}
