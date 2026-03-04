

## Add "Reset / Clear Transactions" feature

### Overview
Add an AlertDialog-based reset flow accessible from the Dashboard. The user picks a scope — all time, a specific month, or a specific date — then confirms deletion. Transactions matching the scope are removed from state, localStorage, and cloud.

### UI Design
- Add a small "Clear data" button (ghost/outline, with `Trash2` icon) next to the Budget button in the Dashboard header bar.
- Clicking it opens an AlertDialog with three radio options:
  1. **All transactions** — clears everything
  2. **This month** (pre-filled with the current period filter, e.g. "Feb 2026")
  3. **Specific date** — shows a date input when selected
- A destructive "Clear" confirmation button and a "Cancel" button in the dialog footer.

### Changes

**1. `src/context/BudgetContext.tsx`**
- Add a `clearTransactions(scope)` function to the context that accepts `{ mode: "all" | "month" | "date", value?: string }`.
- Filters out matching transactions from `data.transactions` using date prefix matching (`"all"` = clear all, `"month"` = match `YYYY-MM`, `"date"` = match `YYYY-MM-DD`).
- Persists via `saveData` + `persistToCloud`.
- Expose `clearTransactions` in the context value and type.

**2. `src/pages/Dashboard.tsx`**
- Import `Trash2` icon and AlertDialog components.
- Add state for dialog open, selected mode, and date value.
- Render a ghost button in the header row that opens the dialog.
- Dialog contains radio group (all / month / date) with conditional date picker.
- On confirm, calls `clearTransactions(scope)` and closes dialog with a toast.

### No database migration needed — transactions are stored as JSON inside `user_app_data.data`.

