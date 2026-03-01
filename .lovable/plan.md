

## Problem

When a guest signs up and confirms their email, their data is lost. The root cause is the sign-out cleanup effect in `BudgetContext.tsx` (lines 187-198):

```ts
useEffect(() => {
  if (!user) {
    // This runs on EVERY page load before the session is restored
    setData(empty);
    saveData(empty); // ← wipes localStorage
  }
}, [user]);
```

On page reload (after email confirmation), `user` starts as `null` while the session is being restored. This effect fires immediately, wiping localStorage. By the time the session loads and `user` becomes non-null, the sync effect finds no local data to merge.

## Fix

**File: `src/context/BudgetContext.tsx`**

Track whether the user was previously authenticated using a ref (`wasAuthenticated`). Only clear data when the user transitions from authenticated → unauthenticated (actual sign-out), not on initial page load when user is still `null` because the session hasn't loaded yet.

```ts
const wasAuthenticated = useRef(false);

useEffect(() => {
  if (user) {
    wasAuthenticated.current = true;
  } else if (wasAuthenticated.current) {
    // User was logged in and is now null → actual sign-out
    wasAuthenticated.current = false;
    hasSynced.current = false;
    const empty: AppData = { transactions: [], categories: { ...DEFAULT_CATEGORIES }, budgets: [] };
    setData(empty);
    saveData(empty);
  }
}, [user]);
```

This single change preserves guest localStorage data through the signup → email confirmation → redirect flow, while still clearing data on explicit sign-out.

