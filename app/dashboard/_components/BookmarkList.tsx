"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/types";
import { BookmarkItem } from "./BookmarkItem";
import { AddBookmarkForm } from "./AddBookmarkForm";
import { Separator } from "@/components/ui/separator";
import { BookmarkX, Search, X } from "lucide-react";

interface BookmarkListProps {
  initialBookmarks: Bookmark[];
  userId: string;
}

type OptimisticAction =
  | { type: "add"; bookmark: Bookmark }
  | { type: "delete"; id: string };

function bookmarkReducer(state: Bookmark[], action: OptimisticAction): Bookmark[] {
  switch (action.type) {
    case "add":    return [action.bookmark, ...state];
    case "delete": return state.filter(b => b.id !== action.id);
    default:       return state;
  }
}

export function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks]           = useState<Bookmark[]>(initialBookmarks);
  const [optimisticBookmarks, dispatch]     = useOptimistic(bookmarks, bookmarkReducer);
  const [deletingIds, setDeletingIds]       = useState<Set<string>>(new Set());
  const [isPending, startTransition]        = useTransition();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  /* ── Realtime subscription ── */
  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookmarks", filter: `user_id=eq.${userId}` },
        (payload) => {
          const nb = payload.new as Bookmark;
          setBookmarks(prev => prev.some(b => b.id === nb.id) ? prev : [nb, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookmarks" },
        (payload) => {
          const delId = payload.old.id as string;
          setBookmarks(prev => prev.filter(b => b.id !== delId));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  /* ── Add ── */
  const handleAdd = async (title: string, url: string) => {
    const tempId = `optimistic-${Date.now()}`;
    const opt: Bookmark = { id: tempId, user_id: userId, title, url, created_at: new Date().toISOString() };

    return new Promise<{ error: string | null }>((resolve) => {
      startTransition(async () => {
        dispatch({ type: "add", bookmark: opt });

        const { data, error } = await supabase
          .from("bookmarks")
          .insert({ title, url, user_id: userId })
          .select()
          .single();

        if (error) {
          setBookmarks(prev => prev.filter(b => b.id !== tempId));
          resolve({ error: error.message });
          return;
        }

        setBookmarks(prev => {
          const exists = prev.some(b => b.id === (data as Bookmark).id);
          if (exists) return prev;
          return [data as Bookmark, ...prev];
        });
        resolve({ error: null });
      });
    });
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    // console.log("[BookmarkList] Deleting ID:", id);
    setDeletingIds(prev => new Set(prev).add(id));
    
    startTransition(async () => {
      dispatch({ type: "delete", id });

      try {
        const { error, data } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", id)
          .eq("user_id", userId)
          .select();

        if (error) {
          // console.error("[BookmarkList] Supabase delete error:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          // console.warn("[BookmarkList] No rows deleted. Check RLS or if the record exists.");
          // Trigger a revert by throwing or just manually resetting
          throw new Error("No rows deleted");
        }

        // console.log("[BookmarkList] Delete successful:", data);
        setBookmarks(prev => prev.filter(b => b.id !== id));
      } catch (err) {
        // console.error("[BookmarkList] Deletion failed, reverting UI:", err);
        const original = bookmarks.find(b => b.id === id);
        if (original) {
          setBookmarks(prev => {
            if (prev.some(b => b.id === id)) return prev;
            return [original, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        }
      } finally {
        setDeletingIds(prev => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }
    });
  };

  // Filter out items that are currently being deleted to ensure they stay hidden
  // even if the optimistic transition ends before the base state is updated.
  const displayBookmarks = optimisticBookmarks
    .filter(b => !deletingIds.has(b.id))
    .filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex flex-col gap-10">
      <AddBookmarkForm onAdd={handleAdd} />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 whitespace-nowrap">
              Saved Bookmarks ({displayBookmarks.length})
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/50 border border-border/50 rounded-lg pl-9 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground p-1 rounded-md hover:bg-muted/30 transition-colors"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {displayBookmarks.length > 0 ? (
          <ul className="stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBookmarks.map(bookmark => (
              <li key={bookmark.id} className="h-full">
                <BookmarkItem
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  isDeleting={deletingIds.has(bookmark.id)}
                  isOptimistic={bookmark.id.startsWith("optimistic-")}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState isSearching={!!searchQuery} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ isSearching }: { isSearching?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center animate-fade-up bg-card/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/50">
        <BookmarkX className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground/80">
          {isSearching ? "No matches found" : "Your library is empty"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60 max-w-[200px]">
          {isSearching 
            ? "Try adjusting your search query or clear the filter." 
            : "Add your first link above to start your collection."
          }
        </p>
      </div>
    </div>
  );
}