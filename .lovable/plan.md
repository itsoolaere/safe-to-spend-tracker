

## Problem

The preview is showing a blank page because the app crashes on startup with the error: **"supabaseUrl is required."**

The root cause: the last diff added `.env` and `.env.*` to `.gitignore`. This caused the `.env` file (which contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, etc.) to be excluded from the project, so the Supabase client receives `undefined` and throws an error that crashes the entire app.

## Fix

### 1. Revert the `.gitignore` change for `.env`

Remove the lines that ignore `.env` files from `.gitignore`. The `.env` in this project is auto-managed by Lovable Cloud and contains only public/anon keys — it is safe and necessary to keep in the repo.

Lines to remove from `.gitignore`:
```
.env
.env.*
!.env.example
```

### 2. Fix the Edge Function build error (secondary)

Remove the `external_id` property from `process-email-queue/index.ts` line 178, as it doesn't exist on the `EmailSendRequest` type. This fixes the TS2353 build error for the edge function deployment.

## Summary

Two small edits: one to `.gitignore` (remove 3 lines) and one to `process-email-queue/index.ts` (remove 1 line). The app will load again immediately after the `.gitignore` fix.

