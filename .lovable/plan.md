## Beginning Balance — Per-Month

### What it does

Users can set an optional starting balance for each month. This amount is added to the "safe to spend" calculation: **safe to spend = beginning balance + income − expenses**.

### Data model

Add a `beginningBalances` field to `AppData`:

```typescript
// lib/types.ts
interface AppData {
  // ...existing
  beginningBalances: Record<string, number>; // key = "YYYY-MM", value = amount
}
```

Default to `{}`. Storage load/save handles it like other fields.

### UI changes

**Dashboard** — A small editable field below or beside the month selector showing the beginning balance for the current period. Clicking it opens an inline input to set/edit the amount. When set, the "safe to spend" card becomes: `beginningBalance + totalIncome - totalExpense`.

**Empty state** — The beginning balance input is also available on the empty guest dashboard.

### Implementation steps

1. `**src/lib/types.ts**` — Add `beginningBalances: Record<string, number>` to `AppData`.
2. `**src/lib/storage.ts**` — Handle `beginningBalances` in `loadData` (default `{}`), and add `setBeginningBalance(data, month, amount)` helper.
3. `**src/context/BudgetContext.tsx**` — Expose `setBeginningBalance(month: string, amount: number)` via context; wire through `updateData`.
4. `**src/pages/Dashboard.tsx**` — Add a small inline-editable beginning balance display near the month selector. Update `balance` to include `data.beginningBalances[period] ?? 0`. Use the same `formatInputAmount` / `formatCurrency` pattern.
5. **Merge logic** — In `mergeData`, union beginning balances (cloud wins on conflict).

### Design notes

- Inline editable field styled as a subtle text link (e.g. "opening: ₦0" → click to edit).
- Keeps the minimal, journal-entry aesthetic.
- No new pages or dialogs needed.
- Mobile-first friendlt