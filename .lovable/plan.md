

## Sign-out: clear data, show success toast, and welcome next user

### Changes

**1. `src/context/BudgetContext.tsx`** — Clear data on sign-out
- Update the existing sign-out effect (lines 152-154) to reset `data` state to empty AppData and clear localStorage when `user` becomes `null`.

```ts
useEffect(() => {
  if (!user) {
    hasSynced.current = false;
    const empty: AppData = {
      transactions: [],
      categories: { ...DEFAULT_CATEGORIES },
      budgets: [],
    };
    setData(empty);
    saveData(empty);
  }
}, [user]);
```

**2. `src/context/AuthContext.tsx`** — Show success toast on sign-out
- Import `useToast` and fire a toast after `supabase.auth.signOut()` succeeds, e.g. `toast({ title: "signed out.", description: "see you next time." })`.

**3. `src/pages/Dashboard.tsx`** — Show a welcome state for guests
- When `!user` and there are no transactions, render a welcoming empty state instead of the normal dashboard. Something like:
  - "safe to spend." heading
  - "start by adding your first entry below." description
  - This naturally invites the next user to begin using the app

