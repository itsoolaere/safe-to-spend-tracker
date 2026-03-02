import { useBudget } from "@/context/BudgetContext";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, ChevronDown, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export default function CategoryManager() {
  const { data, deleteCategory } = useBudget();
  const [open, setOpen] = useState(false);

  const customIncome = data.categories.income.filter(
    (c) => !DEFAULT_CATEGORIES.income.includes(c)
  );
  const customExpense = data.categories.expense.filter(
    (c) => !DEFAULT_CATEGORIES.expense.includes(c)
  );

  const hasCustom = customIncome.length > 0 || customExpense.length > 0;

  const handleDelete = (type: "income" | "expense", name: string) => {
    deleteCategory(type, name);
    toast.success(`"${name}" removed`);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-none shadow-sm">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-5 text-left">
            <span className="font-heading font-semibold text-base flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary" />
              Manage Categories
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-5 space-y-4">
            {!hasCustom ? (
              <p className="text-sm text-muted-foreground italic">
                no custom categories yet. add one from the entry form.
              </p>
            ) : (
              <>
                {customIncome.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Income
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {customIncome.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-income/10 text-income border border-income/20"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => handleDelete("income", c)}
                            className="hover:text-expense transition-colors"
                            aria-label={`Remove ${c}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {customExpense.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Expense
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {customExpense.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-expense/10 text-expense border border-expense/20"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => handleDelete("expense", c)}
                            className="hover:text-foreground transition-colors"
                            aria-label={`Remove ${c}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show default categories as reference */}
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Defaults (can't be removed)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense].map(
                  (c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground"
                    >
                      {c}
                    </span>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
