import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatInputAmount } from "@/lib/format";
import { TransactionType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { PlusCircle, ChevronDown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AddTransactionForm() {
  const { data, addTransaction, addCategory } = useBudget();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
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
      date: date.toISOString(),
    });

    toast.success(`${type === "income" ? "Income" : "Expense"} added!`);
    setAmount("");
    setDescription("");
    setCategory("");
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-none shadow-sm">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-5 text-left">
            <span className="font-heading font-semibold text-base flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary" />
              New Entry
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

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₦</span>
                    <Input
                      className="pl-7 font-heading font-semibold"
                      placeholder="0"
                      value={amount}
                      onChange={e => setAmount(formatInputAmount(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Category</Label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Date</Label>
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
                  <Label className="text-xs">Description (optional)</Label>
                  <Input
                    placeholder="What was this for?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
