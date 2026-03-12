

## Add Clear Budgets + Conditional Budget Nav Icon

### Two changes:

**1. Add a "Clear budgets" action to the Budget page (`src/pages/BudgetVsActual.tsx`)**

- Add a `clearBudgets` function to `BudgetContext` that works similarly to `clearTransactions` but operates on `data.budgets`. Accepts `{ mode: "all" | "month", value?: string }`.
  - `"all"` → removes all budgets
  - `"month"` → removes budgets where `b.month === value`
- Create a `ClearBudgetDialog` component (or extend `ClearDataDialog` with a `target` prop) using an AlertDialog with two radio options: "All budgets" and "This month's budgets".
- Place the clear button in the Budget page header next to the Save button.

**2. Hide the Budget nav icon when no budgets exist (`src/components/AppLayout.tsx`)**

- Currently the Budget link is shown when `hasActiveBudgets` is true (`data.budgets.some(b => b.limit > 0)`). This already hides the icon when no budgets exist. No change needed here — the existing logic already handles this. After clearing all budgets, the nav icon will automatically disappear.

### Files to change:
- **`src/context/BudgetContext.tsx`** — Add `clearBudgets(scope)` to context, expose it.
- **New: `src/components/ClearBudgetDialog.tsx`** — AlertDialog with "all" / "this month" radio options, calls `clearBudgets`.
- **`src/pages/BudgetVsActual.tsx`** — Import and render `ClearBudgetDialog` in the header area.

