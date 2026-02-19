import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Bookmark } from "@/types";
import { BookmarkList } from "./_components/BookmarkList";
import { Header } from "./_components/Header";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (bookmarksError) console.error("Error fetching bookmarks:", bookmarksError);

  const count = (bookmarks ?? []).length;

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
        {/* Page title row */}
        <div className="mb-12 flex flex-col gap-2 items-center text-center animate-fade-in">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary/5 p-3 mb-4">
            <span className="text-3xl">🔖</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-dm-serif)" }}>
            Your Library
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            A private collection of your favorite links and resources, saved forever.
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