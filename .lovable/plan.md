

## Remove the `/auth` Landing Page

The `/auth` route is no longer needed since users enter the app directly and get prompted via the sign-up modal when thresholds are met.

### Changes

1. **Delete `src/pages/Auth.tsx`** — the standalone auth page is obsolete.

2. **Update `src/App.tsx`** — remove the `/auth` route and the `Auth` import. All routes go through `AppLayout`.

3. **Update `src/components/AppLayout.tsx`** — remove the "sign in" `NavLink` pointing to `/auth`. Replace with a button that could trigger the sign-up modal directly (or just remove it entirely, since the modal handles auth).

4. **Update `src/components/SignUpModal.tsx`** (if needed) — optionally expose a way to manually trigger the modal from the header "sign in" button, or keep the header clean with just the sign-out button for authenticated users.

