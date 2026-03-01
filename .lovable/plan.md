

## Login / Landing Page Plan

### Overview
Create a split-screen page: left half is a minimal landing section with branding copy, right half is an auth form (email/password + Google). Supabase handles auth and user profiles.

### Database Setup (Supabase)

**Migration — `profiles` table:**
```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Frontend Changes

1. **Install `@supabase/supabase-js`** and create `src/integrations/supabase/client.ts` with project URL + anon key.

2. **Create `src/context/AuthContext.tsx`**
   - Wraps `onAuthStateChange` listener (set up before `getSession`)
   - Provides `user`, `loading`, `signOut`

3. **Create `src/pages/Auth.tsx`** — the split-screen page
   - **Left half**: Background `bg-background`, app name "safe to spend." in Lora italic, one-line tagline, minimal and warm
   - **Right half**: White card with email/password form (login + signup toggle) and "Sign in with Google" button
   - Uses Supabase `signInWithPassword`, `signUp`, `signInWithOAuth({ provider: 'google' })`
   - Redirect URL set to `window.location.origin`

4. **Create `src/components/ProtectedRoute.tsx`**
   - Reads auth context; redirects to `/auth` if not logged in; shows children if authenticated

5. **Update `src/App.tsx`**
   - Wrap routes with `AuthProvider`
   - Add `/auth` route pointing to `Auth` page
   - Wrap existing routes in `ProtectedRoute`

6. **Add sign-out button** to `AppLayout.tsx` header (small link or icon)

### Design Notes
- Left panel: `bg-background` (#f5f3ef), centered vertically, "safe to spend." in heading font italic, a short subtitle like "know what's yours to use." in muted text
- Right panel: `bg-card` (#fff), login form with the accent color for the primary button
- Responsive: stacks vertically on mobile (landing on top, form below)

### Google OAuth Prerequisite
The user will need to configure Google OAuth in both Google Cloud Console and Supabase Dashboard (Authentication → Providers → Google). The Supabase callback URL must be added as an authorized redirect URI in Google Cloud.

