## Problem

The current forgot password flow has two issues:

1. **Redirect URL**: `resetPasswordForEmail` uses `getAppUrl()` which returns the root URL (e.g. `https://id-preview--xxx.lovable.app`). The recovery link from the email lands on `/` with a hash fragment containing the recovery token. This works for the modal approach but the user reports it's not routing correctly.
2. **Post-reset flow**: After updating the password, the modal just closes and the user stays logged in (from the recovery session). The user wants: update password → sign out → prompt to sign in with new password → sync dialog appears.
3. You need to also stay within the registered URL of the app not a lovableproject preview link

## Plan

### 1. Fix ResetPasswordModal post-submit flow

After successfully updating the password:

- Sign the user out (`supabase.auth.signOut()`)
- Clear the recovery state
- Show a toast saying "password updated. please sign in with your new password."
- This sign-out will trigger the app to show the SignUpModal (via the sign-up gate or manual trigger), and upon sign-in the SyncConfirmDialog will appear if there's guest data.

### 2. Ensure redirect URL is correct

The `redirectTo` in `resetPasswordForEmail` should point to `getAppUrl()` (root). The recovery token comes in the URL hash fragment, and `AuthContext` already listens for `PASSWORD_RECOVERY` events and `type=recovery` in the hash. This should work as-is, but we need to make sure the `/reset-password` redirect route also works if Supabase sends users there.

### Files to modify

- `**src/components/ResetPasswordModal.tsx**`: After successful password update, call `signOut()`, then `onDone()`. This forces the user back to an unauthenticated state where they must sign in again, triggering the sync dialog.
- `**src/context/AuthContext.tsx**`: Clean up the URL hash after detecting recovery (remove `#access_token=...&type=recovery...`) so the recovery state doesn't persist on refresh.