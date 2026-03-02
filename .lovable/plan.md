

## Quick Tips: context-aware financial nudges

### Concept
A small, subtle tip card that rotates through contextual advice based on the user's current financial state. Placed in the **right column** between the entry form and Recent Entries — it fits the journaling tone and doesn't clutter the main summary area.

### Tip Logic
A pure function `getFinancialTip()` that evaluates the user's current state and returns an appropriate tip. Tips are selected based on priority (first matching condition wins):

| Condition | Example Tip |
|---|---|
| No transactions yet | "start with one entry. even ₦50 counts." |
| Expenses > Income (overspending) | "you're spending more than you earn this month. review your top category." |
| Top expense category > 50% of total | "most of your money is going to {category}. is that intentional?" |
| No income logged this month | "no income recorded yet. add what came in to see the full picture." |
| No budgets set | "try setting a budget — it helps you notice patterns." |
| Balance > 0, healthy | "you have {amount} safe to spend. nice." |
| Has budgets, one is > 80% used | "{category} budget is almost used up. tread carefully." |
| Fallback / variety | Random from a pool of general tips like "small consistent tracking beats perfect records." |

Tips rotate on each page load (or every 30s) by picking from all matching conditions.

### File Changes

**1. New file: `src/lib/tips.ts`**
- Export `getFinancialTips(state)` — takes totals, top categories, budgets, transaction count — returns array of matching tip strings.
- Export `pickTip(tips)` — picks one randomly or cycles.

**2. New component: `src/components/QuickTip.tsx`**
- Small card with a subtle style (muted background, italic text, lowercase — matching the journaling tone).
- Uses `useMemo` to compute matching tips from dashboard data, `useState` to pick one on mount.
- A small refresh icon button to cycle to the next tip.
- Lightweight Lightbulb icon from lucide.

**3. Edit: `src/pages/Dashboard.tsx`**
- Import `QuickTip` and place it in the right column, between the guest-limit message and `RecentTransactions`.
- Pass the needed financial state props: `totalIncome`, `totalExpense`, `balance`, `expenseByCategory`, `budgets`, `transactionCount`.

### Visual Style
```
┌──────────────────────────────┐
│ 💡  most of your money is    │
│     going to food. is that   │
│     intentional?         ↻   │
└──────────────────────────────┘
```
Muted background (`bg-muted/50`), small italic text, rounded corners, blends with the dashboard's calm aesthetic.

