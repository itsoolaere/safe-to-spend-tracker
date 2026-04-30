import { useState, useImperativeHandle, forwardRef } from "react";
import { useBudget } from "@/context/BudgetContext";
import { useSignUpGate } from "@/hooks/useSignUpGate";
import { formatInputAmount } from "@/lib/format";
import { TransactionType, DEFAULT_CATEGORIES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { PlusCircle, ChevronDown, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface AddTransactionFormRef {
  open: () => void;
}

const AddTransactionForm = forwardRef<AddTransactionFormRef>(function AddTransactionForm(_props, ref) {
  const { data, addTransaction, addCategory, deleteCategory, period } = useBudget();
  const { isGateLocked, setManualTrigger } = useSignUpGate();
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (isGateLocked) {
        setManualTrigger(true);
        return;
      }
      setOpen(true);
    },
  }));
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [budgetId, setBudgetId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [newCategory, setNewCategory] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const categories = data.categories[type];

  // Sub-entries available for this category in the active period
  const txMonth = format(date, "yyyy-MM");
  const subEntries = data.budgets.filter(
    b => b.month === txMonth && b.type === type && b.category === category && b.limit > 0
  );

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
      date: format(date, "yyyy-MM-dd"),
      ...(budgetId ? { budgetId } : {}),
    });

    toast.success(`${type === "income" ? "Income" : "Expense"} added!`);
    setAmount("");
    setDescription("");
    setCategory("");
    setBudgetId("");
    setDate(new Date());
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    addCategory(type, newCategory.trim());
    setCategory(newCategory.trim());
    setNewCategory("");
    setShowNewCat(false);
    toast.success("Category added");
  };


  return (
    <Collapsible open={open} onOpenChange={(v) => {
      if (v && isGateLocked) {
        setManualTrigger(true);
        return;
      }
      setOpen(v);
    }}>
      <Card className={cn("border-none shadow-sm", isGateLocked && "opacity-60")}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-5 text-left">
            <span className="font-heading font-semibold text-base flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary" />
              {isGateLocked ? "Sign in to add entries" : "New Entry"}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-lg bg-secondary p-1">
                {(["income", "expense"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategory(""); }}
                    className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
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

              <div className="grid grid-cols-2 gap-3 items-start">
                <div className="space-y-2">
                  <Label className="text-xs block text-left w-full">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">₦</span>
                    <Input
                      className="pl-6 font-heading font-semibold text-xs"
                      placeholder="0"
                      value={amount}
                      onChange={e => setAmount(formatInputAmount(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Category</Label>
                    <button type="button" onClick={() => { setShowNewCat(!showNewCat); setNewCategory(""); }} className="text-xs text-primary hover:underline">
                      {showNewCat ? "Cancel" : "+ New"}
                    </button>
                  </div>
                  {showNewCat && (
                    <div className="flex gap-2 animate-fade-in">
                      <Input
                    placeholder="Category name"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="text-xs"
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
                        <SelectItem key={c} value={c}>
                          <span className="flex items-center justify-between w-full gap-2">
                            {c}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {category && !DEFAULT_CATEGORIES[type].includes(category) && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteCategory(type, category);
                        setCategory("");
                        toast.success("Category removed");
                      }}
                      className="text-xs text-muted-foreground hover:text-expense flex items-center gap-1 mt-1"
                    >
                      <X className="w-3 h-3" />
                      remove "{category}"
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs block text-left w-full">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs px-2.5", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{format(date, "MMM d, yyyy")}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs block text-left w-full">note (optional)</Label>
                  <Input
                    placeholder="What was this for?"
                    className="text-xs"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full text-xs">
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Add Entry
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

export default AddTransactionForm;
