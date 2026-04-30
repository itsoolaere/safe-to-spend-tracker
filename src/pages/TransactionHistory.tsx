import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatCurrency, formatDate, formatInputAmount, getMonthOptions } from "@/lib/format";
import { Transaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import TrendsView from "@/components/TrendsView";

export default function TransactionHistory() {
  const { data, deleteTransaction, updateTransaction, period, setPeriod } = useBudget();
  const { transactions } = data;
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBudgetId, setEditBudgetId] = useState<string>("");

  const monthOptions = useMemo(() => getMonthOptions(true), []);

  const filtered = useMemo(() => {
    let result = transactions;
    if (period !== "all") result = result.filter(t => t.date.startsWith(period));
    if (typeFilter !== "all") result = result.filter(t => t.type === typeFilter);
    return result;
  }, [transactions, period, typeFilter]);

  // Lookup: budget id -> budget (for matched badge label)
  const budgetById = useMemo(() => {
    const map: Record<string, typeof data.budgets[number]> = {};
    data.budgets.forEach(b => { map[b.id] = b; });
    return map;
  }, [data.budgets]);

  // Set of "month|type|category" keys that have at least one sub-entry budget,
  // so we only show "unmatched" where matching is actually possible.
  const matchableKeys = useMemo(() => {
    const set = new Set<string>();
    data.budgets.forEach(b => {
      if (b.limit > 0) set.add(`${b.month}|${b.type}|${b.category}`);
    });
    return set;
  }, [data.budgets]);

  const totalIncome = useMemo(() => filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);
  const netTotal = totalIncome - totalExpense;

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success("Transaction deleted");
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setEditAmount(String(t.amount));
    setEditDescription(t.description);
    setEditCategory(t.category);
    setEditBudgetId(t.budgetId ?? "");
  };

  const editSubEntries = useMemo(() => {
    if (!editing) return [];
    const month = editing.date.slice(0, 7);
    return data.budgets.filter(
      b => b.month === month && b.type === editing.type && b.category === editCategory && b.limit > 0
    );
  }, [editing, editCategory, data.budgets]);

  const handleSaveEdit = () => {
    if (!editing) return;
    const num = parseFloat(editAmount.replace(/,/g, ""));
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    updateTransaction(editing.id, {
      amount: num,
      description: editDescription,
      category: editCategory,
      budgetId: editBudgetId || undefined,
    });
    toast.success("Transaction updated");
    setEditing(null);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-xl font-bold tracking-tight">Journal</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] text-xs h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="w-full max-w-xs h-9">
          <TabsTrigger value="entries" className="flex-1 text-xs">Entries</TabsTrigger>
          <TabsTrigger value="trends" className="flex-1 text-xs">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <div className="space-y-3 mt-1">

      {/* Type filter + Totals */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["all", "income", "expense"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "All" : t === "income" ? "Income" : "Expenses"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-income font-medium">+{formatCurrency(totalIncome)}</span>
          <span className="text-expense font-medium">-{formatCurrency(totalExpense)}</span>
          <span className={`font-heading font-semibold ${netTotal >= 0 ? "text-income" : "text-expense"}`}>
            Net: {formatCurrency(netTotal)}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            No transactions found for this period.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t, i) => (
            <Card
              key={t.id}
              className="border-none shadow-sm animate-fade-in cursor-pointer hover:bg-accent/50 transition-colors"
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => openEdit(t)}
            >
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.type === "income" ? "bg-income" : "bg-expense"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || t.category}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-expense" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <TrendsView />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                  <Input className="pl-7 text-lg font-heading font-semibold" value={editAmount} onChange={e => setEditAmount(formatInputAmount(e.target.value))} onKeyDown={e => e.key === "Enter" && handleSaveEdit()} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={(v) => { setEditCategory(v); setEditBudgetId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {data.categories[editing.type].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editSubEntries.length > 0 && (
                <div className="space-y-2">
                  <Label>Match to budget</Label>
                  <Select
                    value={editBudgetId || "__unmatched__"}
                    onValueChange={(v) => setEditBudgetId(v === "__unmatched__" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unmatched__">
                        <span className="italic text-muted-foreground">unmatched</span>
                      </SelectItem>
                      {editSubEntries.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.note || "no note"} — ₦{b.limit.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="What was this for?" onKeyDown={e => e.key === "Enter" && handleSaveEdit()} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
