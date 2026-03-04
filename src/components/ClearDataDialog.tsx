import { useState } from "react";
import { format } from "date-fns";
import { Trash2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBudget } from "@/context/BudgetContext";
import { toast } from "@/hooks/use-toast";

function formatMonthLabel(period: string) {
  const [y, m] = period.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return format(date, "MMMM yyyy");
}

export default function ClearDataDialog() {
  const { period, clearTransactions } = useBudget();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"all" | "month" | "date">("month");
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleClear = () => {
    if (mode === "all") {
      clearTransactions({ mode: "all" });
      toast({ title: "all transactions cleared." });
    } else if (mode === "month") {
      clearTransactions({ mode: "month", value: period });
      toast({ title: `transactions for ${formatMonthLabel(period)} cleared.` });
    } else if (mode === "date" && selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      clearTransactions({ mode: "date", value: dateStr });
      toast({ title: `transactions for ${format(selectedDate, "PPP")} cleared.` });
    }
    setOpen(false);
  };

  const isDisabled = mode === "date" && !selectedDate;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground">
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>clear transactions.</AlertDialogTitle>
          <AlertDialogDescription>
            choose which transactions to remove. this action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as "all" | "month" | "date")}
          className="space-y-3 py-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="all" id="clear-all" />
            <Label htmlFor="clear-all" className="text-sm font-normal cursor-pointer">
              all transactions
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="month" id="clear-month" />
            <Label htmlFor="clear-month" className="text-sm font-normal cursor-pointer">
              {formatMonthLabel(period)} only
            </Label>
          </div>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="date" id="clear-date" className="mt-0.5" />
            <div className="space-y-2">
              <Label htmlFor="clear-date" className="text-sm font-normal cursor-pointer">
                specific date
              </Label>
              {mode === "date" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-[200px] justify-start text-left text-xs font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {selectedDate ? format(selectedDate, "PPP") : "pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={isDisabled}
            className="bg-expense text-expense-foreground hover:bg-expense/90 text-xs"
          >
            clear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
