import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useBudget } from "@/context/BudgetContext";
import { toast } from "sonner";

export default function ClearBudgetDialog() {
  const { clearBudgets, period } = useBudget();
  const [mode, setMode] = useState<"all" | "month">("month");
  const [open, setOpen] = useState(false);

  const periodLabel = new Date(period + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleClear = () => {
    clearBudgets({ mode, value: mode === "month" ? period : undefined });
    toast.success(mode === "all" ? "All budgets cleared" : `Budgets for ${periodLabel} cleared`);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear budgets</AlertDialogTitle>
          <AlertDialogDescription>Choose which budgets to remove. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "all" | "month")} className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="month" id="cb-month" />
            <Label htmlFor="cb-month" className="font-normal">{periodLabel} only</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all" id="cb-all" />
            <Label htmlFor="cb-all" className="font-normal">All budgets (all time)</Label>
          </div>
        </RadioGroup>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
