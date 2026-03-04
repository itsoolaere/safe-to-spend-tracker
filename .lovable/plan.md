

## Move Quick Tips below summary cards

Currently `QuickTip` sits in the right column (between `CategoryManager` and `RecentTransactions`). The change moves it to the left column, directly after the three summary cards and before the `BudgetOverviewWidget`.

### Changes — `src/pages/Dashboard.tsx`

1. **Remove** `<QuickTip state={tipState} />` from the right column (after `CategoryManager`).
2. **Insert** `<QuickTip state={tipState} />` in the left column, immediately after the summary cards grid and before `<BudgetOverviewWidget>`.

Single file edit, two line moves.

