# 🔖 Markd — Smart Bookmark Manager

A private, real-time bookmark manager. Each user sees only their own bookmarks. Adding a bookmark in one browser tab instantly appears in all other open tabs.

**Live Demo:** [https://markd.vercel.app](https://markd.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase Postgres |
| Security | Row Level Security (RLS) |
| Realtime | Supabase Realtime (postgres_changes) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Architecture

```
smart-bookmark-app/
├── app/
│   ├── layout.tsx                  # Root layout, fonts, metadata
│   ├── page.tsx                    # Root redirect (→ /dashboard or /login)
│   ├── globals.css                 # Design tokens, base styles
│   ├── login/
│   │   └── page.tsx                # Server Component: Google OAuth sign-in
│   ├── dashboard/
│   │   ├── page.tsx                # Server Component: fetches user + bookmarks
│   │   └── _components/
│   │       ├── Header.tsx          # Client: nav with user info + sign out
│   │       ├── BookmarkList.tsx    # Client: realtime + optimistic updates
│   │       ├── AddBookmarkForm.tsx # Client: form with validation
│   │       └── BookmarkItem.tsx    # Client: single row with delete
│   └── auth/
│       └── callback/
│           └── route.ts            # PKCE code exchange handler
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (createBrowserClient)
│   │   ├── server.ts               # Server client (createServerClient + cookies)
│   │   └── middleware.ts           # Session refresh + route protection logic
│   └── utils.ts                    # cn() className helper
├── types/
│   └── index.ts                    # Shared TypeScript types
├── middleware.ts                   # Next.js middleware entry point
└── supabase/
    └── schema.sql                  # Table, RLS policies, realtime setup
```

### Key Architecture Decisions

**1. `@supabase/ssr` (not deprecated `@supabase/auth-helpers-nextjs`)**  
Using the current recommended package. It provides `createBrowserClient` and `createServerClient` with explicit cookie handling — no magic, fully compatible with Next.js App Router.

**2. Server Component for data fetching**  
The `dashboard/page.tsx` is a Server Component that fetches the initial list of bookmarks on the server. This means:
- Zero layout shift on first load — data arrives with the HTML
- Session is verified server-side via `supabase.auth.getUser()` (not `getSession()`, which trusts the JWT without server verification)

**3. Middleware for route protection**  
`middleware.ts` runs on every request and:
- Calls `supabase.auth.getUser()` to refresh the session token if needed
- Redirects unauthenticated users away from `/dashboard`
- Redirects authenticated users away from `/login`

**4. Realtime with user-scoped filter**  
The Supabase Realtime channel uses a `filter: user_id=eq.${userId}` parameter. This means the database only pushes events for the current user's rows — reducing noise and preventing accidental data leakage even at the websocket level.

**5. Optimistic UI**  
Using React 19's `useOptimistic` hook: bookmark additions appear instantly in the UI before the database confirms the insert. If the DB write fails, the optimistic entry is rolled back. Deletions are similarly instant with rollback on error.

**6. RLS as the true security boundary**  
All client-side filtering is for UX only. Supabase RLS policies are the actual security boundary — even if a client sends a query for another user's data, Postgres will return zero rows.

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Cloud project with OAuth credentials

### 1. Clone and install

```bash
git clone https://github.com/your-username/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **Anon Key** from:  
   Dashboard → Project Settings → API

### 3. Run the SQL schema

Open **Supabase Dashboard → SQL Editor → New query**, paste and run `supabase/schema.sql`.

This creates:
- `bookmarks` table with all fields
- RLS enabled + 3 policies (SELECT / INSERT / DELETE)
- Realtime publication

### 4. Enable Google OAuth in Supabase

1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. You need a **Google OAuth Client ID + Secret**:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - APIs & Services → Credentials → Create → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID + Secret into Supabase
4. Save

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

> **Note:** For Google OAuth to work locally, add `http://localhost:3000/auth/callback` to your Google OAuth client's Authorized Redirect URIs.

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/smart-bookmark-app.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)

### 3. Add environment variables in Vercel

In the Vercel project settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

### 4. Update OAuth redirect URLs

After deployment, Vercel gives you a URL like `https://markd.vercel.app`.

Update two places:

**Google Cloud Console:**  
Add `https://markd.vercel.app/auth/callback` to Authorized Redirect URIs.

**Supabase Dashboard → Authentication → URL Configuration:**  
- Site URL: `https://markd.vercel.app`
- Redirect URLs: Add `https://markd.vercel.app/auth/callback`

### 5. Deploy

Click Deploy in Vercel (or it auto-deploys on push to `main`).

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Your Supabase anon (public) key |

> The anon key is safe to expose publicly — it has no elevated permissions. RLS policies are what restrict data access.

---

## Problems Encountered & Solutions

### Problem 1: Session not refreshing on Server Components
**Symptom:** User gets logged out after JWT expires even though they're active.  
**Root cause:** The `getSession()` method reads from the cookie without validating against the server. The cookie can become stale.  
**Solution:** Always use `supabase.auth.getUser()` in server code — it hits the Supabase Auth server and refreshes the token. The middleware also calls `getUser()` on every request to ensure tokens are kept fresh.

### Problem 2: Optimistic updates causing duplicates
**Symptom:** After adding a bookmark, it appeared twice — once from the optimistic update and once from the Realtime INSERT event.  
**Root cause:** The Realtime subscription fired and added the confirmed row, but the optimistic row was still in state.  
**Solution:** In the Realtime INSERT handler, check if the arriving row's `id` already exists in state. If it does, skip the add. The optimistic entry uses a `temp-` prefixed ID, which is replaced with the real UUID only after the DB confirms success.

### Problem 3: Realtime receiving other users' events
**Symptom:** In theory, without filters, a channel receives all table changes (Supabase broadcasts based on Postgres changes).  
**Solution:** Pass `filter: user_id=eq.${userId}` when creating the channel. Supabase filters at the server level so only the current user's row events are sent over the websocket. Combined with RLS, this is doubly safe.

### Problem 4: Google OAuth redirect URI mismatch on Vercel preview deployments
**Symptom:** OAuth fails on Vercel preview URLs (e.g. `markd-git-feature-xyz.vercel.app`).  
**Solution:** The `auth/callback/route.ts` handler uses the `x-forwarded-host` header (set by Vercel) to build the redirect URL dynamically. For production, lock down redirect URIs. For staging, add preview URLs to both Google and Supabase allowed lists, or use a fixed staging domain.

---

## Security Checklist

- [x] Google OAuth only — no passwords stored
- [x] RLS enabled on `bookmarks` table
- [x] SELECT policy: `auth.uid() = user_id`
- [x] INSERT policy: `auth.uid() = user_id` (prevents spoofing `user_id`)
- [x] DELETE policy: `auth.uid() = user_id`
- [x] Server-side session validation via `getUser()` (not `getSession()`)
- [x] Middleware protects all dashboard routes
- [x] Realtime channel filtered to current user only
- [x] `user_id` always set from server-verified `auth.uid()` — not from client input
