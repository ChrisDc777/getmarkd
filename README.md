# 🔖 Markd — Smart Bookmark Manager

A private, real-time bookmark manager built with **Next.js** and **Supabase**.

## 🚀 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Auth & DB:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS + Radix UI
- **Realtime:** Supabase Realtime

## 🛠️ Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/ChrisDc777/getmarkd.git
   cd getmarkd
   npm install
   ```
2. **Setup Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL in `supabase/schema.sql`.
   - Enable Google OAuth in Authentication settings.
3. **Configure Environment**
   - Create a `.env.local` file:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```
4. **Run Dev**
   ```bash
   npm run dev
   ```

## 🧠 Challenges & Solutions

### 1. Stale Auth Sessions
- **Problem:** Users were getting logged out unexpectedly in Server Components.
- **Solution:** Switched from `getSession()` to `getUser()` in server-side logic to ensure the session is always validated against the Supabase Auth server.

### 2. Duplicate UI Items (Realtime)
- **Problem:** Optimistic updates and Realtime events caused bookmarks to appear twice.
- **Solution:** Added logic to the Realtime listener to skip incoming rows that matched existing optimistic IDs, ensuring a smooth single-item display.

### 3. Secure Route Handling
- **Problem:** Protecting dashboard routes while maintaining performance.
- **Solution:** Implemented a lightweight `middleware.ts` using `@supabase/ssr` to handle session refreshes and redirects before the request reaches the server components.

---