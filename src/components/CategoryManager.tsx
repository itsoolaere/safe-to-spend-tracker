import { useBudget } from "@/context/BudgetContext";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { X, Tags } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function CategoryManager() {
  const { data, deleteCategory } = useBudget();
  const [open, setOpen] = useState(false);

  const allIncome = data.categories.income;
  const allExpense = data.categories.expense;
  const hasAny = allIncome.length > 0 || allExpense.length > 0;

  const handleDelete = (type: "income" | "expense", name: string) => {
    deleteCategory(type, name);
    toast.success(`"${name}" removed`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <Tags className="w-3 h-3" />
        manage categories
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Tags className="w-3 h-3" />
          Categories
        </p>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          done
        </button>
      </div>

      {!hasAny ? (
        <p className="text-sm text-muted-foreground italic">
          no categories yet. add one from the entry form.
        </p>
      ) : (
        <>
          {allIncome.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Income
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allIncome.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-income/10 text-income border border-income/20"
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
          {allExpense.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Expense
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allExpense.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-expense/10 text-expense border border-expense/20"
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
    </div>
  );
}