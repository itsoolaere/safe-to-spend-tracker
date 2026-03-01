

## Freemium / Guest Mode with Sign-Up Gate

### Concept
Remove the `/auth` landing page as the entry point. Let unauthenticated users straight into the app (using localStorage as they do now). After they hit a usage threshold — **1 income transaction + 7 expense transactions, or 1 week since first use** (whichever comes first) — a modal dialog appears with a blurred backdrop prompting sign-up. The modal is non-dismissible once triggered.

### Implementation

**1. Create `src/hooks/useSignUpGate.ts`**
A hook that tracks guest usage and determines if the gate should trigger:
- On first app load (no user, no stored timestamp), save `guest_started_at` to localStorage
- Count income and expense transactions from BudgetContext
- Return `{ shouldPromptSignUp: boolean }` — true when either:
  - Income transactions >= 1 AND expense transactions >= 7
  - More than 7 days since `guest_started_at`

**2. Create `src/components/SignUpModal.tsx`**
- A `Dialog` component (using existing Radix dialog) that renders the auth form (email/password + Google) inside a modal
- Blurred overlay background (`backdrop-blur-md` on the overlay)
- Non-dismissible: no close button, `onOpenChange` locked to `true`, `onPointerDownOutside` / `onEscapeKeyDown` prevented
- Reuses the same auth logic from current `Auth.tsx` (email sign-up/in, Google OAuth)
- Toggle between sign-in and sign-up within the modal
- Heading style matches brand: lowercase italic "create an account." / "welcome back."

**3. Update `src/App.tsx`**
- Remove `ProtectedRoute` wrapper from the main routes — guests go straight to Dashboard
- Keep `AuthProvider` wrapping everything (it still tracks auth state)
- Keep `/auth` route as a fallback but default route goes directly to the app

**4. Update `src/components/AppLayout.tsx`**
- Import and render `SignUpModal` (it self-manages open state via the hook)
- Show sign-out button only when user is authenticated
- Optionally show a subtle "sign in" link in the header for guests who want to sign in early

**5. Update `src/context/BudgetContext.tsx`**
- No changes needed — it already works with localStorage regardless of auth state

**6. Keep `src/pages/Auth.tsx`**
- Keep as a standalone page for direct `/auth` navigation, but it's no longer the default entry

### Flow

```text
Guest opens app
  → Lands on Dashboard (localStorage data)
  → Adds transactions freely
  → Hits threshold (1 income + 7 expense OR 1 week)
  → Non-dismissible modal with blurred background appears
  → Signs up / signs in
  → Modal closes, app continues
```

### Design Notes
- Modal overlay: `bg-black/60 backdrop-blur-md` for the frosted-glass effect
- Modal content: same white card styling as current auth form, max-w-sm, centered
- Brand-consistent lowercase italic headings
- The gate only blocks further interaction — existing data in localStorage is preserved

