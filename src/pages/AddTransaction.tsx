import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { TransactionType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

export default function AddTransaction() {
  const { data, addTransaction, addCategory } = useBudget();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const categories = data.categories[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/,/g, ""));
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    if (!category) { toast.error("Select a category"); return; }

    addTransaction({
      type,
      amount: num,
      category,
      description,
      date: new Date().toISOString(),
    });

    toast.success(`${type === "income" ? "Income" : "Expense"} added!`);
    setAmount("");
    setDescription("");
    setCategory("");
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    addCategory(type, newCategory.trim());
    setCategory(newCategory.trim());
    setNewCategory("");
    setShowNewCat(false);
    toast.success("Category added");
  };

  const formatAmount = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  return (
    <div className="max-w-md mx-auto pb-20 sm:pb-0">
      <h2 className="font-heading text-2xl font-bold tracking-tight mb-1">Add Transaction</h2>
      <p className="text-muted-foreground text-sm mb-6">Record income or expense</p>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type toggle */}
            <div className="flex rounded-lg bg-secondary p-1">
              {(["income", "expense"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCategory(""); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    type === t
                      ? t === "income"
                        ? "bg-income text-income-foreground shadow-sm"
                        : "bg-expense text-expense-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {t === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                <Input
                  className="pl-7 text-lg font-heading font-semibold"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(formatAmount(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <button type="button" onClick={() => setShowNewCat(!showNewCat)} className="text-xs text-primary hover:underline">
                  + New
                </button>
              </div>
              {showNewCat && (
                <div className="flex gap-2 animate-fade-in">
                  <Input
                    placeholder="Category name"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="text-sm"
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
                </div>
              )}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What was this for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add {type === "income" ? "Income" : "Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
