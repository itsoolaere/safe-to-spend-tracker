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

  const monthOptions = useMemo(() => getMonthOptions(true), []);

  const filtered = useMemo(() => {
    let result = transactions;
    if (period !== "all") result = result.filter(t => t.date.startsWith(period));
    if (typeFilter !== "all") result = result.filter(t => t.type === typeFilter);
    return result;
  }, [transactions, period, typeFilter]);

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
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const num = parseFloat(editAmount.replace(/,/g, ""));
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    updateTransaction(editing.id, {
      amount: num,
      description: editDescription,
      category: editCategory,
    });
    toast.success("Transaction updated");
    setEditing(null);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Journal</h2>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
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
        <TabsList className="w-full max-w-xs">
          <TabsTrigger value="entries" className="flex-1">Entries</TabsTrigger>
          <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <div className="space-y-4 mt-2">

      {/* Type filter + Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1">
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
        <div className="flex items-center gap-4 text-sm">
          <span className="text-income font-medium">+{formatCurrency(totalIncome)}</span>
          <span className="text-expense font-medium">-{formatCurrency(totalExpense)}</span>
          <span className={`font-heading font-bold ${netTotal >= 0 ? "text-income" : "text-expense"}`}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                  <Input className="pl-7 text-lg font-heading font-semibold" value={editAmount} onChange={e => setEditAmount(formatInputAmount(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {data.categories[editing.type].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="What was this for?" />
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
