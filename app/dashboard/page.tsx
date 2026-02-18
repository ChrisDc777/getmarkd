import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Bookmark } from "@/types";
import { BookmarkList } from "./_components/BookmarkList";
import { Header } from "./_components/Header";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verify session server-side (never trust client alone)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  // Fetch initial bookmarks — RLS guarantees only this user's rows
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (bookmarksError) {
    console.error("Error fetching bookmarks:", bookmarksError);
  }

  return (
    <div className="relative min-h-screen">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-0 top-0 h-[500px] w-[500px] rounded-full bg-amber-accent/4 blur-[140px]"
      />

      <Header user={user} />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-8">
        {/* Page heading */}
        <div className="mb-10 animate-fade-in">
          <h1
            className="font-serif text-4xl text-cream"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Your Bookmarks
          </h1>
          <p className="mt-1.5 text-sm text-cream-dim">
            {(bookmarks ?? []).length === 0
              ? "Nothing saved yet — add your first link below."
              : `${(bookmarks ?? []).length} saved link${(bookmarks ?? []).length === 1 ? "" : "s"}`}
          </p>
        </div>

        <BookmarkList
          initialBookmarks={(bookmarks as Bookmark[]) ?? []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
