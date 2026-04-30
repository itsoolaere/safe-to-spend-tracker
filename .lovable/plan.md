## Problem

Each budget has a `category` plus an optional `note` that acts as a subcategory (e.g. category "Food" with notes "Groceries", "Eating out"). Today, transactions only carry a `category`, so:

- The current `BudgetTable` shows the **same** category-level actual against **every** sub-entry of that category, so a single ₦5,000 grocery purchase appears to spend 100% of "Groceries" *and* 100% of "Eating out". This reads as "randomly matching entries to different subcategories".
- There is no way to say "this transaction belongs to the Groceries sub-budget".

## Goal

1. Let the user pick a specific budget sub-entry (by note) when adding/editing a transaction.
2. Each sub-entry's progress bar reflects only the transactions explicitly assigned to it.
3. Anything in the category with no sub-entry assignment is grouped as a single **"unmatched"** row under that category.

## Changes

### 1. Data model — `src/lib/types.ts`

Add an optional field to `Transaction`:

```ts
budgetId?: string; // id of the Budget sub-entry this transaction is matched to
```

Optional, so all existing transactions remain valid (they become "unmatched").

### 2. Add-transaction form — `src/components/AddTransactionForm.tsx`

After the user picks a `category`, look up sub-entries for that category in the **current period** (`data.budgets.filter(b => b.month === period && b.type === type && b.category === category && b.limit > 0)`).

- If 0 sub-entries: no extra UI (transaction stays unmatched, same as today).
- If ≥1 sub-entries: show a small "Match to budget (optional)" Select beneath the category field with options:
  - `Unmatched` (default)
  - One option per sub-entry, labeled `note — ₦limit` (fallback to `"no note"` for entries without a note).
- On submit, include `budgetId` only when a real sub-entry is chosen.

Reset `budgetId` whenever `type` or `category` changes.

### 3. Edit-transaction dialog

The transaction edit dialog (used in `RecentTransactions` / Journal) gets the same Select so users can re-match existing entries. Default to the transaction's current `budgetId` if any.

### 4. Actuals computation — `src/components/BudgetTable.tsx`

Replace the single `actuals: Record<category, number>` mental model with per-budget-id actuals:

- For each category group, compute:
  - `byBudget[budget.id] = sum of tx.amount where tx.budgetId === budget.id`
  - `unmatched = sum of tx.amount for this category where tx.budgetId is missing OR points to a budget id not in this category's entries`
- Each sub-entry's progress bar uses `byBudget[budget.id]` (no more shared category total).
- If `unmatched > 0`, render an extra row at the bottom of the category group titled **"unmatched"** (italic, muted) showing `formatCurrency(unmatched)` with no progress bar (or a neutral bar against the category's leftover budget — see Open question).
- The category header total stays as `sum(byBudget) + unmatched` so the header still equals real spending in that category.

Hover-card transaction list per category continues to show all transactions in the category, with a small badge indicating which sub-entry each one is matched to (or "unmatched").

### 5. Backwards compatibility

- All existing transactions have no `budgetId` → they all show under "unmatched" for their category. Users can then re-match them via the edit dialog.
- No migration needed (field is optional, stored in the same `user_app_data.data` JSON blob).

### 6. Out of scope

- The dashboard `BudgetMonthlyWidget` keeps its category-level rollup (it doesn't show sub-entries), so no change needed there.
- `BudgetVsActual.tsx` only passes data through to `BudgetTable`; no logic change needed beyond what's above.

## Files touched

- `src/lib/types.ts` — add optional `budgetId` to `Transaction`
- `src/components/AddTransactionForm.tsx` — sub-entry Select + include `budgetId` on submit
- `src/components/RecentTransactions.tsx` (edit dialog) — same Select for editing
- `src/components/BudgetTable.tsx` — per-budget actuals + "unmatched" row
- (No DB migration; data persists inside the existing JSON blob.)

## Open question

When showing the **"unmatched"** row, should it:
- (a) Just display the amount as a plain line (no bar, no limit), or
- (b) Render a progress bar against `categoryBudgetTotal − sum(byBudget limits already accounted)` so the user can see "unmatched is eating into the category's leftover"?

I'll go with **(a)** by default — it's clearer and matches the "this isn't budgeted to a specific bucket" meaning. Tell me if you'd prefer (b).
